const fs = require('fs');
const libs = require.main.require('./libs');
const models = require.main.require('./models');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/oracles/price'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/oracles/price'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'get': getPrice // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
/*********************** GET: PROFILE ******************************/
async function getPrice(http_request, response){
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
  /************* Validate Params Regex from libs.validations.validate_request_params() *************/
  try{
    var params = libs.validations.validate_request_params(http_request, ['asset'], []);
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
  
  let tokenId = params.verifiedParams.asset == 'vic' ? 'tomochain' : 'tomochain';
  
  try {
    const prices = fs.readFileSync('assets/data/prices.json', 'utf-8');

    const result = JSON.parse(prices)[tokenId]?.usd || 0;
  
    resp = libs.response.setup(resp, '200.1-1');
    resp.result = [result];
    response.status(200);
    response.json(resp);
    return
  } catch(err) {
    console.log(err);
    resp = libs.response.setup(resp, '500.1-2');
    resp.result = [0];
    response.status(200);
    response.json(resp);
    return
  }
}

module.exports = new leaf();
