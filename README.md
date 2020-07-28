# Simplifying Customer Service
Welcome to my community solution for simplifying the Customer Service. </br>
This is a part of a blog series you can find on my blog https://crmkeeper.com/dynamics-365-customer-service/ 

<p align="center">
  <img src="https://github.com/thomassandsor/CustomerService/blob/master/IMAGES/thomas_min.jpg">
</p>

## Scenario
![Bilde](./IMAGES/Process.jpg)

Before you start downloading the solution, you should head on over to my blog post where I explain how to implement everything. </br>
*URL* </br>
I would prefer to download the solution as unmanaged. I only add things that you easily can remove afterwords. Every form I create is custom, and should not overwrite anything you have from before. This is why I am sayin it should be safe to import as unmanaged solution. I am not an ISV, so therefore the configuration is not to be considered as an ISV solution either. 

The following is a list of what is included in the Solution file. 

## Account
##### Form
Account Main - CS <- Main form for account. 
Recent Cases - CS <- Quick View Form for Cases

## Appointment, Email, Note, Phone Call and Task
##### Relationship
N:1 relationship updated to configurable cascading, and Assign set to "Cascade None". Default behaviour is Parental. This had to be done, because the assigning of case will mess with the date stamps on case activities. 

## Case
##### Form
Case Main - CS <- Main form for Case
##### JavaScript
cs_case <- Script for Case

##### View
Active Cases - CS <- Main view for all cases  Active Cases Team - CS <- All cases assigned to the team  My Active Cases - CS <- The cases assigned to you

##### Field
Case Number "ticketnumber" - I overwrite the autonumber. Default Value is CAS-{SEQNUM:5}-{RANDSTRING:6} if you wan to revert
Last Activity Date "cs_lastactivitydate" - Updates whenever a new email is received. Feel free to use field for Tasks or other avtivities as needed. 

## Contact
##### Form
Contact Main - CS <- Main form Contact
Contact Simple Form - CS <- Quick edit on Case
Recent Cases - CS <- Quick View form for Case

## Email
##### Form
Email - CS <- Main form Email
##### JavaScript
cs_email <- Script for Email
##### Field
Signature Added "cs_signatureadded" - Added because email does a strange close&update before actually sending the email. This is just to store that javascript has added signature

## Signature (Custom Entity cs_signature)
##### Field
HTML Signature "cs_htmlsignature" - Where we store the signature in HTML for the user

## User
##### Form
User - CS <- Main Form
##### Field
Signature "cs_signature" - lookup storing the signature
Field: Signature "cs_signature"

## Process
Email - New email received on case <- Notify user when a new email has arrived + update the case with the latest activity received date. **example WF for use if you want to**

## Record Creation and Update Rules
Email 2 Case - Will import as inactive and you have to update with correct parameters to make it work **Need to update owner of new cases**

## Model Driven App
CS - App to run with all views/forms/dash etc


