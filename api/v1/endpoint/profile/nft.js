const libs = require.main.require('./libs');
const models = require.main.require('./models');
const { ethers } = require('hardhat');

// Constructor of Endpoint Leaf
class leaf { // Required
  constructor(){
    this.__uri__ = '/profile/nft/:tba_address'; // Required: Defining new leaf under /v1/
    this.__path__ = 'v1/endpoint/profile/nft'; // Optional: path of file
    this.__add__ = true; // You Can tell express js to add or not this leaf to webservice
    this.__methods__ = { // Methods and Resposible Functions
      'get': getProfile // Setting for each http method a function
    };
  }
}

/*********************************************************************************************************************/
/*********************************************************************************************************************/
/*********************** GET: PROFILE ******************************/
async function getProfile(http_request, response){
  
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

  try {
    const tba_address = http_request.params.tba_address || '0x0000000000000000000000000000000000000000';
    const tbaAddress = ethers.getAddress(`0x${tba_address}`);
    let dbProfiles = await models.queries.select_table('profiles', {account_tba_address: tbaAddress});
    if(!dbProfiles.done){
      resp = libs.response.setup(resp, '500.1-1');
      response.status(500);
      response.json(resp);
      return
    }
    if(!dbProfiles.data || dbProfiles.data.length == 0){
      resp = libs.response.setup(resp, '404.1-1');
      resp.result = [];
      response.status(404);
      response.json(resp);
      return
    }
  
    const Profile = dbProfiles.data[0];
    
    // const profileNFT = {
    //   account_address: Profile.account_address,
    //   account_nickname: Profile.account_nickname,
    //   account_email: Profile.account_email,
    //   account_bio: Profile.account_bio,
    //   account_social: Profile.account_social,
    //   account_image_url: Profile.account_image_url,
    //   account_cover_url: Profile.account_cover_url,
    //   account_created_nfts: null,
    //   account_owned_nfts: null,
    //   account_favorited_nfts: null,
    // }
    let attributes = [];
    if(Profile.account_social_twitter) {
      attributes.push({
        "trait_type": "X", 
        "value": Profile.account_social_twitter
      })
    }
    if(Profile.account_social_facebook) {
      attributes.push({
        "trait_type": "Facebook", 
        "value": Profile.account_social_facebook
      })
    }
    if(Profile.account_social_instagram) {
      attributes.push({
        "trait_type": "Instagram", 
        "value": Profile.account_social_instagram
      })
    }
    if(Profile.account_social_linkedin) {
      attributes.push({
        "trait_type": "Linkedin", 
        "value": Profile.account_social_linkedin
      })
    }
    if(Profile.account_social_telegram) {
      attributes.push({
        "trait_type": "Telegram", 
        "value": Profile.account_social_telegram
      })
    }
  
    const profileNFT = {
      description: 'Piltonet registered profile.', 
      external_url: `https://piltonet.com/@${Profile.account_nickname}`, 
      image: Profile.account_image_url || '', 
      name: Profile.account_fullname || Profile.account_nickname,
      attributes: attributes
    }
  
    const profileNFTJson = JSON.parse(JSON.stringify(profileNFT))
  
    // All is done.
    response.status(200);
    response.json(profileNFTJson);
  } catch(err) {
    // console.log(err);
    resp = libs.response.setup(resp, '404.1-2');
    response.status(404);
    response.json(resp);
  }
}
   
module.exports = new leaf();
