const libs = require.main.require('./libs');
const models = require.main.require('./models');
const { ethers } = require('hardhat');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor() {
    this.__uri__ = '/account/circles/creator/launch'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/account/circles/creator/launch'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'post': launchCircle // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
async function launchCircle(http_request, response) {
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
  if(!('authorization' in http_request.headers)) {
    resp = libs.response.setup(resp, '401.1-0');
    response.status(200);
    response.json(resp);
    return
  }
  let connected_account = await models.accounts.getAccountByAuthTokent(http_request.headers.authorization);
  if(!connected_account.done) {
    let response_id = `${connected_account.status_code}-1`;
    resp = libs.response.setup(resp, response_id);
    response.status(200);
    response.json(resp);
    return
  }
  const Account = connected_account.result;

  /************* Validate Params Regex from libs.validations.validate_request_params() *************/
  try{
    var params = libs.validations.validate_request_params(http_request,
      [
        'circle_id',
        'start_date'
      ],[]);
  }catch(e) {
    resp = libs.response.setup(resp, '400.2-1');
    resp.result = [e];
    response.status(200);
    response.json(resp);
    return
  }
  if(params.hasErrors) {
    resp = libs.response.setup(resp, '400.3-1');
    resp.result = [params.errors];
    response.status(200);
    response.json(resp);
    return
  }

  /************* Get Account Circle *************/
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
    const startDate = parseInt(new Date(params.verifiedParams.start_date).getTime() / 1000);
    console.log(startDate);
    const tx = await TLCC.launchCircle(startDate, {
      gasLimit: 4000000
    });
    await tx.wait();
    
    console.log(`Circle launched, start date: ${params.verifiedParams.start_date}.`);
  }

  /***************** Update Circles *******************/
  var circle_params = {
    circle_start_date: params.verifiedParams.start_date,
    circle_status: 'launched',
    circle_launched_at: new Date()
  }
  let circles_update = await models.queries.update_table('circles', circle_params, {id: Circle.id});
  if(!circles_update.done) {
    resp = libs.response.setup(resp, `${circles_update.code}-3`);
    response.status(200);
    response.json(resp);
    return
  }

  
  resp.status_code = 200;
  resp.done = true;
  resp.message_type = 'success';
  resp.message = 'Circle has been launched successfully.';
  resp.result = [circle_params];
  response.status(200);
  response.json(resp);
  return
}

module.exports = new leaf();
