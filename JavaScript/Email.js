var formContext = "";

function OnCrmPageLoad(executionContext) {
    formContext = executionContext.getFormContext();

    //
    //You don't need to change this. Just understand that forms have one the following states when opening
    //
    var FormTypes =
    {
        Undefined: 0,
        Create: 1,
        Update: 2,
        ReadOnly: 3,
        Disabled: 4,
        QuickCreate: 5,
        BulkEdit: 6
    }
    runAlways(formContext);
    switch (formContext.ui.getFormType()) {
        case FormTypes.Create: OnNewFormLoad(); break;
        case FormTypes.Update: OnUpdateFormLoad(); break;
        case FormTypes.ReadOnly: OnReadOnlyFormLoad(); break;
        case FormTypes.Disabled: OnDisabledFormLoad(); break;
        case FormTypes.QuickCreate: OnQuickCreateFormLoad(); break;
        case FormTypes.BulkEdit: OnBulkEditFormLoad(); break;
        case FormTypes.Undefined: alert("Error"); break;
    }
}

//
//I only use the RunAlways, OnNewFormLoad and OnUpdateFormLoad, but i keep the others here if i ever would need. 
//When looking at this you can always know what funtion is running. Easy to read and debug. 
//On my OnNewFOrmLoad I am now calling a function "GetDefaultQueueAndSignature"
//
function runAlways() { }
function OnNewFormLoad() {
    //On new form load we call get Signature and Queue
    //
    //For regarding we have to check that it contains ID before getting data, and we have to check that it is case
    //
    var RegardingObject = formContext.getAttribute("regardingobjectid").getValue();
    //Check for Signature added
    var SignatureYesNo = formContext.getAttribute("cs_signatureadded");
    if (RegardingObject != null) {
        if (RegardingObject[0].entityType == "incident") {
            if (SignatureYesNo == null || SignatureYesNo.getValue() == false) {
                GetCaseIDSetSubjectSetContact();
                GetDefaultQueueAndSignature();
            }
        }
    }
}
function OnUpdateFormLoad() {
    //
    //On new UpdateForm load we call get Signature and Queue
    //
    //For regarding we have to check that it contains ID before getting data, and we have to check that it is case
    //
    var RegardingObject = formContext.getAttribute("regardingobjectid").getValue();
    //Check for Signature added
    var SignatureYesNo = formContext.getAttribute("cs_signatureadded");
    if (RegardingObject != null) {
        if (RegardingObject[0].entityType == "incident") {
            if (SignatureYesNo == null || SignatureYesNo.getValue() == false) {
                GetCaseIDSetSubjectSetContact();
                GetDefaultQueueAndSignature();
            }
        }
    }
}
function OnReadOnlyFormLoad() { }
function OnDisabledFormLoad() { }
function OnQuickCreateFormLoad() { }
function OnBulkEditFormLoad() { }


//******************************************************************** */
//CUSTOM FUNCTIONS are added below here. Below this point you add all types of functions you need. 
//******************************************************************** */
function GetDefaultQueueAndSignature() {
    //Get User GUID and replace "{" and "}" with blanks. 
    var UserID = Xrm.Utility.getGlobalContext().userSettings.userId;
    UserID = UserID.replace("{", "");
    UserID = UserID.replace("}", "");

        //Get User Default Queue and Signature via WebApi
        Xrm.WebApi.online.retrieveRecord("systemuser", UserID, "?$select=_queueid_value&$expand=cs_Signature($select=cs_htmlsignature)").then(
            function success(result) {
                var Id = "{" + result["_queueid_value"] + "}";
                var Name = result["_queueid_value@OData.Community.Display.V1.FormattedValue"];
                var LogicalName = result["_queueid_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
                if (result.hasOwnProperty("cs_Signature")) {
                    var Signature = result["cs_Signature"]["cs_htmlsignature"];
                }
                if (LogicalName == null || Signature == null) {
                    alert("User Record missing Queue and/or Signature");
                    return;
                }
                //Set FROM lookup to queue
                formContext.getAttribute("from").setValue([{ id: Id, name: Name, entityType: LogicalName }]);
                //Set signature before current text in body
                var Body = formContext.getAttribute("description").getValue();
                //To handle if boolean is null. Will happen if solution is installed on production environment

                //Set Signature
                if (Body != null) {
                    formContext.getAttribute("description").setValue("<br /><br />" + Signature + Body);
                    formContext.getAttribute("cs_signatureadded").setValue(true);
                } else {
                    formContext.getAttribute("description").setValue("<br /><br />" + Signature);
                    formContext.getAttribute("cs_signatureadded").setValue(true);
                }

            },
            function (error) {
                Xrm.Utility.alertDialog(error.message);
            }
        );
}

function GetCaseIDSetSubjectSetContact() {
    //Get Uswer GUID and replace "{" and "}" with blanks. 
    var CaseID = formContext.getAttribute("regardingobjectid").getValue()[0].id;
    CaseID = CaseID.replace("{", "");
    CaseID = CaseID.replace("}", "");
    var EmailTOType = formContext.getAttribute("to").getValue()[0].entityType;
    var CaseNumber;
    var CaseContactGUID;
    var CaseContactName;
    var CaseContactType;
    var Subject;
    var Title;

    Xrm.WebApi.online.retrieveRecord("incident", CaseID, "?$select=_primarycontactid_value,ticketnumber,title").then(
        function success(result) {
            CaseNumber = result["ticketnumber"];
            Title = result["title"];
            CaseContactGUID = result["_primarycontactid_value"];
            CaseContactName = result["_primarycontactid_value@OData.Community.Display.V1.FormattedValue"];
            CaseContactType = result["_primarycontactid_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

            //
            //Check if TO field is Type ACCOUNT. We need to set it to contact
            //
            if (EmailTOType == "account") {
                //Change from the Account to Contact, so the email can send. 
                formContext.getAttribute("to").setValue([{ id: CaseContactGUID, name: CaseContactName, entityType: CaseContactType }]);
            }

            //
            //Check if Subject contains case number. If not, add case number.
            //
            Subject = formContext.getAttribute("subject");
            if (Subject.getValue() != null) {
                var SubjectContainsID = Subject.getValue().includes(CaseNumber);
                //
                //IF subject does not contain casenumber, i add the casenumber to the subject
                //
                if (SubjectContainsID == false) {
                    formContext.getAttribute("subject").setValue(Subject.getValue() + " - " + CaseNumber);
                }
            } else {
                //IF email is new. give it a default subject
                formContext.getAttribute("subject").setValue(Title + " - " + CaseNumber);
            }
        },
        function (error) {
            Xrm.Utility.alertDialog(error.message);
        }
    );
}
