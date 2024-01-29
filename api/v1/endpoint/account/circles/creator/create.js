const libs = require.main.require('./libs');
const models = require.main.require('./models');
const { ethers } = require('hardhat');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/account/circles/creator/create'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/account/circles/creator/create'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'post': createCircle // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
async function createCircle(http_request, response){
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
    var params = libs.validations.validate_request_params(http_request, [
      'circle_mode',
      'circle_creator_tba',
      'circle_chain_id',
      'circle_payment_token',
      'circle_payment_type',
      'circle_name',
      'circle_size',
      'circle_round_days',
      'circle_round_payments',
      'circle_winners_order',
      'circle_winners_number',
      'circle_patience_benefit',
      'circle_creator_earnings',
      'circle_service_charge',
      'circle_service_address'
    ], [
      'circle_id',
      'circle_round_payments_string'
    ]);
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

  try {
    /***************** Deploy Seme-decentralized Circles *******************/
    if(params.verifiedParams.circle_mode == 'semi_dec') {
      const contractAbi = require.main.require("./contracts/abi/TLCC.json");
      const contractByteCode = require.main.require("./contracts/bytecode/TLCC.json");
      const deployArgs = [
        params.verifiedParams.circle_creator_tba,
        params.verifiedParams.circle_payment_token,
        params.verifiedParams.circle_name,
        parseInt(params.verifiedParams.circle_size),
        parseInt(params.verifiedParams.circle_round_days),
        params.verifiedParams.circle_round_payments_string,
        params.verifiedParams.circle_winners_order == 'random' ? 0 : params.verifiedParams.circle_winners_order == 'fixed' ? 1 : 2,
        parseInt(params.verifiedParams.circle_patience_benefit * 100),
        parseInt(params.verifiedParams.circle_creator_earnings * 100)
      ];
      const factory = await ethers.getContractFactory(contractAbi, contractByteCode);
      const TLCC = await factory.deploy(...deployArgs, {
        gasLimit: 6000000
      })
      await TLCC.waitForDeployment()
      params.verifiedParams['circle_id'] = await TLCC.getAddress();
      console.log(`TLCC deployed in address: ${params.verifiedParams.circle_id}`);
    }
  
    /***************** Insert Circles *******************/
    let circle_params = {
      circle_id: params.verifiedParams.circle_id,
      circle_mode: params.verifiedParams.circle_mode,
      circle_creator_main: Account.main_account_address,
      circle_creator_tba: params.verifiedParams.circle_creator_tba,
      circle_chain_id: params.verifiedParams.circle_chain_id,
      circle_payment_token: params.verifiedParams.circle_payment_token,
      circle_payment_type: params.verifiedParams.circle_payment_type,
      circle_name: params.verifiedParams.circle_name,
      circle_size: params.verifiedParams.circle_size,
      circle_round_days: params.verifiedParams.circle_round_days,
      circle_round_payments: params.verifiedParams.circle_round_payments,
      circle_winners_order: params.verifiedParams.circle_winners_order,
      circle_winners_number: params.verifiedParams.circle_winners_number,
      circle_patience_benefit: params.verifiedParams.circle_patience_benefit,
      circle_creator_earnings: params.verifiedParams.circle_creator_earnings,
      circle_service_charge: params.verifiedParams.circle_service_charge,
      circle_service_address: process.env.SERVICE_ADMIN_PUBLIC_KEY,
      circle_status: 'deployed',
      circle_deployed_at: new Date()
    }
    
    let circles_insert = await models.queries.insert_table('circles', circle_params);
    if(!circles_insert.done){
      resp = libs.response.setup(resp, `${circles_insert.code}-3`);
      response.status(200);
      response.json(resp);
      return
    }
  
    /***************** Insert Circle Whitelists *******************/
    let whitelist_insert = await models.queries.insert_table('circles_whitelists',
      {
        circle_id: params.verifiedParams.circle_id,
        whitelist_account_address: Account.account_address,
        whitelist_moderator_address: Account.account_address,
        whitelist_is_alive: true,
        whitelist_is_joined: false,
        whitelist_is_rejected: false
      }
    );
    if(!whitelist_insert.done){
      resp = libs.response.setup(resp, `${whitelist_insert.code}-3`);
      response.status(200);
      response.json(resp);
      return
    }
  
    resp.status_code = 200;
    resp.done = true;
    resp.message_type = 'success';
    resp.message = 'Circle has been created successfully.';
    resp.result = [circle_params];
    response.status(200);
    response.json(resp);
    return
  } catch(e) {
    console.log(e);
    resp = libs.response.setup(resp, '500.1-1');
    resp.result = [e];
    response.status(200);
    response.json(resp);
    return
  }
}

module.exports = new leaf();
