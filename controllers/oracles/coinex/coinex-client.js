const request = require('superagent');
const crypto = require('crypto');
const querystring = require('querystring');

const baseUrl = process.env.COINEX_SPOT_BASE_URL;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36';

const CoinexClient = (apiKey, apiSecret) => {
  // @GET
  const Get = async (url, fields = {}) => {
    const tonce = Date.now().toString();
    const completeUrl = baseUrl + url;

    const body = {
      tonce,
      ...fields,
    };

    const bodyAsQueryString = querystring.stringify(body);

    const requestPromise = request
      .get(completeUrl + '?' + bodyAsQueryString)
      .set('User-Agent', USER_AGENT)
      .timeout(5000);

    try {
      const response = await requestPromise;
      const { body } = response;
      const { code } = body;

      if(code) {
        throw new Error(`Coinex error code: ${code}`);
      }

      return body;
    } catch(error) {
      if(error.response) {
        console.error('Coinex request failed:');
        console.error(error.response.body);
      }
      throw error;
    }
  };

  // @GET_AUTH
  const GetAuth = async (url, fields = {}) => {
    const tonce = Date.now().toString();
    const completeUrl = baseUrl + url;

    const body = {
      access_id: apiKey,
      tonce,
      ...fields,
    };

    const bodySorted = Object.keys(body)
      .slice()
      .sort()
      .reduce(
        (prev, key) => ({
          ...prev,
          [key]: body[key],
        }),
        {}
      );

    const bodyAsQueryString = querystring.stringify(bodySorted);

    const bodyAsQueryStringWithSecret =
      bodyAsQueryString + '&secret_key=' + apiSecret;

    const signature = crypto
      .createHash('md5')
      .update(bodyAsQueryStringWithSecret)
      .digest('hex')
      .toUpperCase();

    const requestPromise = request
      .get(completeUrl + '?' + bodyAsQueryString)
      .set('authorization', signature)
      .set('User-Agent', USER_AGENT)
      .timeout(5000);

    try {
      const response = await requestPromise;
      const { body } = response;
      const { code } = body;

      if(code) {
        throw new Error(`Coinex error code: ${code}`);
      }

      return body;
    } catch(error) {
      if(error.response) {
        console.error('Coinex request failed:');
        console.error(error.response.body);
      }
      throw error;
    }
  };

  // @POST
  const Post = async (url, params = {}) => {
    const tonce = Date.now().toString();
    const completeUrl = baseUrl + url;

    const body = {
      access_id: apiKey,
      tonce,
      ...params,
    };

    const bodySorted = Object.keys(body)
      .slice()
      .sort()
      .reduce(
        (prev, key) => ({
          ...prev,
          [key]: body[key],
        }),
        {}
      );

    const bodyAsQueryString = querystring.stringify(bodySorted);

    const bodyAsQueryStringWithSecret =
      bodyAsQueryString + '&secret_key=' + apiSecret;

    const signature = crypto
      .createHash('md5')
      .update(bodyAsQueryStringWithSecret)
      .digest('hex')
      .toUpperCase();

    const requestPromise = request
      .post(completeUrl)
      .set('authorization', signature)
      .set('User-Agent', USER_AGENT)
      .send(body)
      .timeout(5000);

    try {
      const response = await requestPromise;

      const { body } = response;
      const { code } = body;

      if(code) {
        throw new Error(`Coinex error code: ${code}`);
      }

      return body;
    } catch(error) {
      if(error.response) {
        console.error('Coinex request failed:');
        console.error(error.response.body);
      }
      throw error;
    }
  };

  // @DELETE
  const Delete = async (url, fields = {}) => {
    const tonce = Date.now().toString();
    const completeUrl = baseUrl + url;

    const body = {
      access_id: apiKey,
      tonce,
      ...fields,
    };

    const bodySorted = Object.keys(body)
      .slice()
      .sort()
      .reduce(
        (prev, key) => ({
          ...prev,
          [key]: body[key],
        }),
        {}
      );

    const bodyAsQueryString = querystring.stringify(bodySorted);

    const bodyAsQueryStringWithSecret =
      bodyAsQueryString + '&secret_key=' + apiSecret;

    const signature = crypto
      .createHash('md5')
      .update(bodyAsQueryStringWithSecret)
      .digest('hex')
      .toUpperCase();

    const requestPromise = request
      .delete(completeUrl + '?' + bodyAsQueryString)
      .set('authorization', signature)
      .set('User-Agent', USER_AGENT)
      .timeout(5000);

    try {
      const response = await requestPromise;
      const { body } = response;
      const { code } = body;

      if(code) {
        throw new Error(`Coinex error code: ${code}`);
      }

      return body;
    } catch(error) {
      if(error.response) {
        console.error('Coinex request failed:');
        console.error(error.response.body);
      }
      throw error;
    }
  };

  return { Get, GetAuth, Post, Delete };
};

module.exports = CoinexClient;