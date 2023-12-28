const libs = require.main.require('./libs');
const path = require('path');
const fs = require('fs');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/assets/docs/demo-video'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/assets/images'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'get': getImageFile // Setting for each http method a function
    }
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
/*********************** GET: Account Collection Logo Image ******************************/
async function getImageFile(http_request, response){
  let resp = {
    origin_url: null,
    response_id: null,
    status_code: 200,
    done: true,
    message_type: null,
    message: null,
    result: null
  }
  
  const videoFile = path.resolve('./assets/docs/piltonet_demo.mov');

  try {
    if(fs.existsSync(videoFile)) {
      response.status(200);
      response.sendFile(videoFile);
    } else {
      resp.origin_url = http_request.protocol + '://' + http_request.get('host') + http_request.originalUrl;
      resp = libs.response.setup(resp, '404.1');
      response.status(200);
      response.json(resp);
    }
  } catch(err) {
    console.error(err)
  }
  return
}

module.exports = new leaf();
