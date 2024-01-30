const fs = require('fs');
const base64Img = require('base64-img');
const libs = require.main.require('./libs');
const models = require.main.require('./models');
const { ethers } = require('hardhat');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/account/contacts/accept_invite_code_by_service'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/acounts/contacts/accept_invite_code_by_service'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'post': acceptInviteCodeByService // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
async function acceptInviteCodeByService(http_request, response){
  /************* Default Result Schema *************/
  let resp = {
    origin_url: http_request.protocol + '://' + http_request.get('host') + http_request.originalUrl,
    response_id: null,
    status_code: 200,
    done: true,
    message_type: null,
    message: null,
    result: null
  };

  /******************* HTTP Request ********************************/
  /************* Verify Account Authorization *************/
  if(!('authorization' in http_request.headers)){
    resp = libs.response.setup(resp, '401.1-0');
    response.status(200);
    response.json(resp);
    return
  }
  let connected_account = await models.accounts.getAccountByAuthTokent(http_request.headers.authorization);
  if(!connected_account.done){
    let response_id = `${connected_account.status_code}-1`;
    resp = libs.response.setup(resp, response_id);
    response.status(200);
    response.json(resp);
    return
  }
  const Account = connected_account.result;
  
  /************* Validate Params Regex from libs.validations.validate_request_params() *************/
  try{
    var params = libs.validations.validate_request_params(http_request, ['profile_tba', 'contact_tba', 'invite_code'], []);
  }catch(e){
    resp = libs.response.setup(resp, '400.2-1');
    resp.result = [e];
    response.status(200);
    response.json(resp);
    return
  }
  if(params.hasErrors){
    resp = libs.response.setup(resp, '400.3-1');
    resp.result = [params.errors];
    response.status(200);
    response.json(resp);
    return
  }

  // To Do
  /***************** ContactList > addContactByService *******************/
  try {
    const NETWORK = process.env.DEFAULT_NETWORK;
    const deployedContactList = require.main.require(`./contracts/deployments/${NETWORK}/ContactList.json`);
  
    const contractAbi = require.main.require("./contracts/abi/ContactList.json");
    const ContactList = await ethers.getContractAt(contractAbi, deployedContactList.address);
  
    const tx = await ContactList.addContactByService(params.verifiedParams.profile_tba, params.verifiedParams.contact_tba, {
      gasLimit: 4000000
    });
    await tx.wait()
    console.log(`Contact Added. profileTBA: ${params.verifiedParams.profile_tba}, contactTBA: ${params.verifiedParams.contact_tba}`);
  } catch(e) {
    console.log(e);
    resp = libs.response.setup(resp, '403.1-1');
    resp.result = [e];
    response.status(200);
    response.json(resp);
    return
  }

  /***************** Look For Friend Main Account *******************/
  let dbProfiles = await models.queries.select_table('profiles', {account_invite_code: params.verifiedParams.invite_code});
  if(!dbProfiles.done){
    resp = libs.response.setup(resp, `${dbProfiles.code}-2`);
    response.status(200);
    response.json(resp);
    return
  }
  if(!dbProfiles.data){
    resp = libs.response.setup(resp, '405.3-1');
    response.status(200);
    response.json(resp);
    return
  }
  const ContactProfile = dbProfiles.data[0];
  if(ContactProfile.main_account_address == Account.main_account_address) {
    resp = libs.response.setup(resp, '405.3-1');
    response.status(200);
    response.json(resp);
    return
  }
  if(new Date(ContactProfile.account_invite_code_ed) < new Date()) {
    resp = libs.response.setup(resp, '405.4-1');
    response.status(200);
    response.json(resp);
    return
  }

  var contactStatus = 'waiting';
  /***************** Get Account In Friend Contact *******************/
  where_params = {
    main_account_address: ContactProfile.main_account_address,
    contact_account_address: Account.main_account_address
  }
  let dbWaitingFriends = await models.queries.select_table('contacts', where_params);
  if(!dbWaitingFriends.done){
    resp = libs.response.setup(resp, `${dbWaitingFriends.code}-2`);
    response.status(200);
    response.json(resp);
    return
  }
  if(dbWaitingFriends.data) {
    contactStatus = 'connected';
    await models.queries.update_table('contacts', {contact_status: contactStatus}, where_params);
  }

  /***************** Insert Contacts *******************/
  // generate contact_id
  let contact_id = {
    account_address: Account.account_address,
    main_account_address: Account.main_account_address,
    contact_account_address: ContactProfile.main_account_address,
    created_at: new Date().getTime(),
    random_token: libs.cryptography.random_token(10)
  };
  const contactId = libs.cryptography.hash_md5(JSON.stringify(contact_id));

  let contact_params = {
    contact_id: contactId,
    main_account_address: Account.main_account_address,
    contact_account_address: ContactProfile.main_account_address,
    contact_trust_level: 0,
    contact_status: contactStatus
  }
  let contacts_insert = await models.queries.insert_table('contacts', contact_params);
  if(!contacts_insert.done){
    resp = libs.response.setup(resp, `${contacts_insert.code}-3`);
    response.status(200);
    response.json(resp);
    return
  }

  resp.status_code = 200;
  resp.done = true;
  resp.message_type = 'success';
  resp.message = 'Invite code has been accepted successfully.';
  // resp.result = [contact_params];
  response.status(200);
  response.json(resp);
  return
}

module.exports = new leaf();
