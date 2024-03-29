const libs = require.main.require('./libs');
const models = require.main.require('./models');
const { ethers } = require('hardhat');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/account/circles/creator/whitelists/add'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/account/circles/creator/whitelists_add'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'post': addToWhitelist // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
async function addToWhitelist(http_request, response){
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

  /************* Get Profile *************/
  let dbProfiles = await models.queries.select_table('profiles', {main_account_address: Account.main_account_address});
  if(!dbProfiles.done || !dbProfiles.data) {
    resp = libs.response.setup(resp, `${dbProfiles.code}-2`);
    response.status(200);
    response.json(resp);
    return
  }
  Profile = dbProfiles.data[0];
  
  /************* Validate Params Regex from libs.validations.validate_request_params() *************/
  try{
    var params = libs.validations.validate_request_params(http_request, ['circle_id', 'contact_adrs'], []);
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

  const contactAdrs = JSON.parse(params.verifiedParams.contact_adrs) || [];
  if(contactAdrs.length == 0){
    resp = libs.response.setup(resp, '400.3-1');
    resp.result = [params.errors];
    response.status(200);
    response.json(resp);
    return
  }

  /************* Get Circle *************/
  let dbCircles = await models.queries.select_table('circles', {
    circle_id: params.verifiedParams.circle_id,
    circle_creator_main: Account.main_account_address,
    circle_status: 'deployed'
  });
  if(!dbCircles.done || !dbCircles.data) {
    resp = libs.response.setup(resp, '401.1-1');
    response.status(200);
    response.json(resp);
    return
  }
  const Circle = dbCircles.data[0];

  /***************** Insert Seme-decentralized Circle Whitelists to Contract *******************/
  if(Circle.circle_mode == 'semi_dec') {
    const contractAbi = require.main.require("./contracts/abi/TLCC.json");
    const TLCC = await ethers.getContractAt(contractAbi, Circle.circle_id);

    const tx = await TLCC.addToWhitelist(Profile.account_tba_address, contactAdrs, {
      gasLimit: 4000000
    });
    await tx.wait()
    console.log(`${contactAdrs.length} contact(s) added to contract whitelist.`);
  }

  /***************** Get & Makeup Main Accounts By TBA *******************/
  dbProfiles = await models.queries.select_table('profiles');
  if(!dbProfiles.done || !dbProfiles.data){
    resp = libs.response.setup(resp, '500.1-1');
    response.status(200);
    response.json(resp);
    return
  }
  var TBAsMakeup = {};
  for(let main_account of dbProfiles.data) {
    TBAsMakeup[main_account.account_tba_address] = {
      main_account_address: main_account.main_account_address
    }
  }

  /***************** Insert Circle Whitelists *******************/
  for(var contactAdr of contactAdrs) {
    if(contactAdr in TBAsMakeup) {
      await models.queries.insert_table('circles_whitelists',
        {
          circle_id: params.verifiedParams.circle_id,
          whitelist_account_address: TBAsMakeup[contactAdr].main_account_address,
          whitelist_moderator_address: Account.account_address,
          whitelist_is_alive: true,
          whitelist_is_joined: false,
          whitelist_is_rejected: false
        }
      );
    }
  }

  resp.status_code = 200;
  resp.done = true;
  resp.message_type = 'success';
  resp.message = 'The whitelist has been updated successfully.';
  resp.result = [];
  response.status(200);
  response.json(resp);
  return
}

module.exports = new leaf();
