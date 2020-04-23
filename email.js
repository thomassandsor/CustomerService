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
    //
    //On new form load we call get Signature and Queue
    //
    GetDefaultQueueAndSignature();
    //
    //For regarding we have to check that it contains ID before getting data, and we have to check that it is case
    //
    var RegardingObject = formContext.getAttribute("regardingobjectid").getValue();
    if (RegardingObject != null) {
        if (RegardingObject[0].entityType == "incident") {
            GetCaseIDSetSubject();
        }
    }
}
function OnUpdateFormLoad() {
    //
    //On new UpdateForm load we call get Signature and Queue
    //
    GetDefaultQueueAndSignature();
    //
    //For regarding we have to check that it contains ID before getting data, and we have to check that it is case
    //
    var RegardingObject = formContext.getAttribute("regardingobjectid").getValue();
    if (RegardingObject != null) {
        if (RegardingObject[0].entityType == "incident") {
            GetCaseIDSetSubject();
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
            if(Body != null){
                formContext.getAttribute("description").setValue("<br /><br />" + Signature + Body);
            }else{
                formContext.getAttribute("description").setValue("<br /><br />" + Signature);
            }
            
        },
        function (error) {
            Xrm.Utility.alertDialog(error.message);
        }
    );
}

function GetCaseIDSetSubject() {
    //Get Uswer GUID and replace "{" and "}" with blanks. 
    var CaseID = formContext.getAttribute("regardingobjectid").getValue()[0].id;
    CaseID = CaseID.replace("{", "");
    CaseID = CaseID.replace("}", "");

    Xrm.WebApi.online.retrieveRecord("incident", CaseID, "?$select=ticketnumber").then(
        function success(result) {
            var CaseNumber = result["ticketnumber"];
            var Subject = formContext.getAttribute("subject");
            //
            //Check if Subject contains data
            //
            if (Subject.getValue() != null) {
                var SubjectContainsID = Subject.getValue().includes(CaseNumber);
                //
                //IF subject does not contain casenumber, i add the casenumber to the subject
                //
                if (SubjectContainsID == false) {
                    formContext.getAttribute("subject").setValue(Subject.getValue() + " - " + CaseNumber);
                }
            } 
            //
            //This is a new email without a subject. Get the CaseNumber, and inform that topic has to be set
            //
            else {
                formContext.getAttribute("subject").setValue("[Insert Topic] - " + CaseNumber);
            }
        },
        function (error) {
            Xrm.Utility.alertDialog(error.message);
        }
    );

}
