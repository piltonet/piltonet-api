const fs = require('fs');
const base64Img = require('base64-img');
const libs = require.main.require('./libs');
const models = require.main.require('./models');
const { ethers } = require('hardhat');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/account/create'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/account/create'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'post': createAccount // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
async function createAccount(http_request, response){
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
    var params = libs.validations.validate_request_params(http_request, ['account_nickname', 'account_email'], ['account_email_verified']);
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

  /***************** ERC721Profile > Create Profile *******************/
  const NETWORK = process.env.DEFAULT_NETWORK;
  const deployedERC721Profile = require.main.require(`./deployments/${NETWORK}/ERC721Profile.json`);

  const ERC721Profile = await ethers.getContractAt('ERC721Profile', deployedERC721Profile.address);

  let tokenId = 0;
  let tbaAddress = '0x';
  if((await ERC721Profile.balanceOf(Account.account_address)).toString() == '0') {
    const tx = await ERC721Profile.createProfile(Account.account_address, {
      gasLimit: 4000000
    });
    await tx.wait()
  }
  const tokenOfAccount = await ERC721Profile.tokenOf(Account.account_address);
  tokenId = tokenOfAccount[0].toString();
  tbaAddress = tokenOfAccount[1];
  console.log(`Profile Created. tokenId: ${tokenId}, tba:${tbaAddress}`);
  
  /***************** Insert Main Account *******************/
  let main_account_params = {
    main_account_address: Account.account_address,
    profiles_contract_address: deployedERC721Profile.address,
    account_token_id: tokenId,
    account_tba_address: tbaAddress,
    account_nickname: params.verifiedParams.account_nickname,
    account_email: params.verifiedParams.account_email,
    account_email_verified: params.verifiedParams.account_email_verified
  }
  let main_account_insert = await models.queries.insert_table('profiles', main_account_params);
  if(!main_account_insert.done){
    resp = libs.response.setup(resp, `${main_account_insert.code}-2`);
    response.status(200);
    response.json(resp);
    return
  }

  /***************** Update Account *******************/
  let account_params = {
    account_status: 'main',
    main_account_address: Account.account_address
  }
  let account_update = await models.queries.update_table('accounts', account_params, {id: Account.id});
  if(!account_update.done){
    resp = libs.response.setup(resp, `${account_update.code}-4`);
    response.status(200);
    response.json(resp);
    return
  }


  resp.status_code = 200;
  resp.done = true;
  resp.message_type = 'success';
  resp.message = 'Account profile has been created successfully.';
  resp.result = [main_account_params];
  response.status(200);
  response.json(resp);
  return
}

module.exports = new leaf();
