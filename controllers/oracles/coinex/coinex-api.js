const CoinexClient = require('./coinex-client.js');

const AccessID = process.env.COINEX_ACCESS_ID;
const SecretKey = process.env.COINEX_SECRET_KEY;

const coinexClient = CoinexClient(AccessID, SecretKey);

const rate = async () => {
  try {
    const apiResponse = await coinexClient.Get('/common/currency/rate');
    if(apiResponse?.data) {
      return apiResponse.data;
    } else {
      console.log(apiResponse);
      return false;
    }
  } catch(err) {
    console.log(err);
    return false;
  }
};

const ticker = async (market = 'VICUSDT') => {
  try {
    const apiResponse = await coinexClient.Get('/market/ticker', {
      market: market
    });
    if(apiResponse?.data) {
      return apiResponse.data;
    } else {
      console.log(apiResponse);
      return false;
    }
  } catch(err) {
    console.log(err);
    return false;
  }
};

const depth = async (merge = 0, limit = 50, market = 'VICUSDT') => {
  try {
    const apiResponse = await coinexClient.Get('/market/depth', {
      market: market,
      merge: merge,
      limit: limit
    });
    if(apiResponse?.data) {
      return apiResponse.data;
    } else {
      console.log(apiResponse);
      return false;
    }
  } catch(err) {
    console.log(err);
    return false;
  }
};

module.exports = {
  rate,
  ticker,
  depth
};