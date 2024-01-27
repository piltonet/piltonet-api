const fs = require('fs');
const request = require('superagent');

const prices = async () => {
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36';

  let tokenIds = ['tomochain'];

  const requestPromise = request
    .get(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds[0]}&vs_currencies=usd`)
    .set('User-Agent', USER_AGENT)
    .timeout(5000);

  try {
    const apiResponse = await requestPromise;
    if(apiResponse && apiResponse.status == 200 && apiResponse.text != {}) {
      fs.writeFile('assets/data/prices.json', apiResponse.text, err => {
        if(err) {
          console.error(err);
        } else {
          // file written successfully
        }
      });
    } else {
      console.error(apiResponse);
    }
  } catch(err) {
    console.error(err);
  }
};

module.exports = {
  prices
};