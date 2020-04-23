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
    alert(formContext.ui.getFormType());
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
//
function runAlways() { }
function OnNewFormLoad() {}
function OnUpdateFormLoad() {
    //
    //Clean up Contact Data. If contact has account, but account not in Customer field perform update. If Contact doen's have account ask for update
    //
    GetAccountInfo();
}
function OnReadOnlyFormLoad() { }
function OnDisabledFormLoad() { }
function OnQuickCreateFormLoad() { }
function OnBulkEditFormLoad() { }


//******************************************************************** */
//CUSTOM FUNCTIONS are added below here. Below this point you add all types of functions you need. 
//******************************************************************** */
function GetAccountInfo() {
    var CustomerField = formContext.getAttribute("customerid").getValue();
    if (CustomerField != null) {
        if (CustomerField[0].entityType == "contact") {
            var CustomerGUID = CustomerField[0].id;
            CustomerGUID = CustomerGUID.replace("{", "");
            CustomerGUID = CustomerGUID.replace("}", "");

            //
            //If the Customer Field contains a contact, I want to change this. I want the Customer Field to be an account. Step 1 is to find out if the contact has account registered.
            //
            Xrm.WebApi.online.retrieveRecord("contact", CustomerGUID, "?$select=_parentcustomerid_value").then(
                function success(result) {
                    var Id = "{" + result["_parentcustomerid_value"] + "}";
                    var Name = result["_parentcustomerid_value@OData.Community.Display.V1.FormattedValue"];
                    var LogicalName = result["_parentcustomerid_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

                    //
                    //IF the contact has an account I move the Contact to Case Contact, and receive the Account from the Contact and enter it to Customer on Case.
                    //
                    if (LogicalName != null){
                        formContext.getAttribute("primarycontactid").setValue(CustomerField);
                        formContext.getAttribute("customerid").setValue([{ id: Id, name: Name, entityType: LogicalName }]);
                        formContext.data.entity.save();
                    }else{
                        //
                        //Promt if you want to open contact for update?
                        //https://carldesouza.com/how-to-implement-javascript-confirmation-dialogs-in-power-apps-and-dynamics-365/
                        //
                        var confirmStrings = { text:"Contact is not connected to Account. Please update!", title:"Data Update Recommended", confirmButtonLabel:"Open Contact", cancelButtonLabel: "Not Now" };
                        var confirmOptions = { height: 200, width: 450 };
                        Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
                        function (success) {    
                            if (success.confirmed){
                                //
                                //If the user chooses to update, I open a small contact form, and make the user set the Account. 
                                //After Save&Close i recall this function, and then I update Account and Contact for case. 
                                //
                                Xrm.Navigation.navigateTo({pageType:"entityrecord", entityName:"contact", formType:2, formId:"e4206691-b1e3-4e9d-a23a-4865b9511091", entityId:CustomerGUID}, {target: 2, position: 1, width: {value: 20, unit:"%"},height: {value: 50, unit:"%"}}).then(
                                    function success() {
                                        GetAccountInfo();
                                    },
                                    function error() {
                                        alert("The system was not able to save the change. Please reload the page and try again");
                                    }
                                );
                            }else{
                                //Say or do something if the user doesn't update Contact
                            }
                        });

                    }
                },
                function (error) {
                    Xrm.Utility.alertDialog(error.message);
                }
            );
            
        }
    }

}
