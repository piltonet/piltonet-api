const fs = require('fs');
const base64Img = require('base64-img');
const libs = require.main.require('./libs');
const models = require.main.require('./models');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/account/contacts/fetch_invite_code'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/acounts/contacts/fetch_invite_code'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'get': fetchInviteCode // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
async function fetchInviteCode(http_request, response){
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
    var params = libs.validations.validate_request_params(http_request, ['invite_code'], []);
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

    /***************** Look For Contact Before *******************/
    let dbContact = await models.queries.select_table('contacts', {
      main_account_address: Account.main_account_address,
      contact_account_address: ContactProfile.main_account_address
    });
    if(!dbContact.done){
      resp = libs.response.setup(resp, `${dbContact.code}-3`);
      response.status(200);
      response.json(resp);
      return
    }
    if(dbContact.data && dbContact.data.length > 0){
      resp = libs.response.setup(resp, '405.5-1');
      response.status(200);
      response.json(resp);
      return
    }

  let invite_code_account = {
    main_account_address: ContactProfile.main_account_address,
    account_tba_address: ContactProfile.account_tba_address,
    account_nickname: ContactProfile.account_nickname,
    account_email: ContactProfile.account_email,
    account_fullname: ContactProfile.account_fullname,
    account_image_url: ContactProfile.account_image_url,
    account_social_twitter: ContactProfile.account_social_twitter,
    account_social_facebook: ContactProfile.account_social_facebook,
    account_social_instagram: ContactProfile.account_social_instagram,
    account_social_linkedin: ContactProfile.account_social_linkedin,
    account_social_telegram: ContactProfile.account_social_telegram,
    account_invite_code: ContactProfile.account_invite_code,
    account_invite_code_ed: ContactProfile.account_invite_code_ed
  }

  resp.status_code = 200;
  resp.done = true;
  resp.message_type = 'success';
  resp.message = 'Invite code has been fetched successfully.';
  resp.result = [invite_code_account];
  response.status(200);
  response.json(resp);
  return
}

module.exports = new leaf();
