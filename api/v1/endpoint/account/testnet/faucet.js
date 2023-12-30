const fs = require('fs');
const base64Img = require('base64-img');
const libs = require.main.require('./libs');
const models = require.main.require('./models');
const { ethers } = require('hardhat');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/account/testnet/faucet'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/account/testnet/faucet'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'post': claimPCUSD // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
async function claimPCUSD(http_request, response){
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
    var params = libs.validations.validate_request_params(http_request, ['account_tba_address']);
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

  /***************** VRC25PCUSD > transfer *******************/
  try{
    const NETWORK = process.env.DEFAULT_NETWORK;
    const deployedERC721Profile = require.main.require(`./contracts/deployments/${NETWORK}/VRC25PCUSD.json`);

    const contractAbi = require.main.require("./contracts/abi/VRC25PCUSD.json");
    const VRC25PCUSD = await ethers.getContractAt(contractAbi, deployedERC721Profile.address);

    let _balance = await VRC25PCUSD.balanceOf(params.verifiedParams.account_tba_address);
    const balance = parseInt(_balance.toString()) / 1e6;
    if(balance > 0) {
      resp.status_code = 200;
      resp.done = false;
      resp.message_type = 'warning';
      resp.message = 'The profile account has already been charged.';
      response.status(200);
      response.json(resp);
      return
    }

    // transfer PCUSD
    const amount = 50;
    const tx = await VRC25PCUSD.transfer(params.verifiedParams.account_tba_address, amount * 1e6, {
      gasLimit: 4000000
    });
    let _tx = await tx.wait();
    console.log(`Transfer 50 PCUSD to ${params.verifiedParams.account_tba_address} tx:`, _tx.hash);
    resp.result = [balance + amount];
  }catch(e){
    resp = libs.response.setup(resp, '500.1-1');
    resp.result = [e];
    response.status(200);
    response.json(resp);
    return
  }
  

  resp.status_code = 200;
  resp.done = true;
  resp.message_type = 'success';
  resp.message = 'The profile account charged successfully.';
  response.status(200);
  response.json(resp);
  return
}

module.exports = new leaf();
