var authentication = require('basic-auth')

function checkAndSendResponse(res, errorMessage, condition, response = null)
{
	if (condition) {
        if (response == null) {
		    res.end("You've passed the test!")
        } else {
            res.json(response)
        }
	} else {
		res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Bearer realm="http://localhost:3000"') // should only be set for basic auth and bearer token auth
		res.end(errorMessage)
	}
}

function authenticateCustomQueryParam(req, msgObj = {message: ""})
{
	var query_token = req.query.token
	var api_key = req.query['api-key']
    var message = "CustomQuery: passed!"

	if (!req.query.token || !req.query['api-key'])
	    message = "CustomQuery: Parameter is not received."
	else if(!(query_token == 'asdqwaxr2gSdhasWSDbdAgdA637sdAhde7Adysi23' && api_key == 'api-key') &&
	     !(Boolean(req.query.v1_master) && query_token == 'asdqwaxr2gSdhasWSDbdAgdA637sdAhde7Adysi23'))
		message = 'CustomQuery: Wrong query parameter. ' + query_token + ' and ' + api_key
	console.log(message)
	msgObj.message += message + "\n"
	return message == "CustomQuery: passed!" // IsValid
}

function authenticateCustomHeaderParam(req, msgObj = {message: ""})
{
	var header_token = req.get("token")
	var api_key = req.get("api-key")
    var message = "CustomHeader: passed!"

	if (!header_token || !api_key)
		message = "CustomHeader: authentication header not received."
	else if(!(header_token == 'Qaws2W233WedeRe4T56G6Vref2' && api_key == 'api-key') &&
		 !(Boolean(req.query.v1_master) && header_token == 'Qaws2W233WedeRe4T56G6Vref2'))
		message = 'CustomHeader: Invalid token. Got ' + header_token + ' and ' + api_key
	console.log(message)
	msgObj.message += message + "\n"
	return message == "CustomHeader: passed!" // IsValid
}

function authenticateBasicAuth(req, msgObj = {message: ""})
{
	var credentials = authentication(req)
	var message = ""

	if (credentials && ((credentials.name === 'Zeeshan' || credentials.name === 'farhan.muhammad+38@apimatic.io' || credentials.name === 'farhan') && (credentials.pass === 'bhai_99' || credentials.pass === 'pass:word' || credentials.pass === 'apimatic'))) {
		message = "BasicAuth: passed!"
	}
	else if (!credentials)
		message = "BasicAuth: header not received."
	else
		message = "BasicAuth: Invalid credentials."
	console.log(message)
	msgObj.message += message + "\n"
	return message == "BasicAuth: passed!" // IsValid
}

function authenticateOAuthBearerToken(req, msgObj = {message: ""}){
	var header_val = req.get("Authorization")
    var message = ""

	if (header_val && (header_val === 'Bearer 0b79bab50daca910b000d4f1a2b675d604257e42')) {
		message = "OAuthBearerToken: passed!"
	}
	else {
		if (!header_val)
			message = "OAuthBearerToken: header not received."
		else
			message = "OAuthBearerToken: Invalid access token. Got " + header_val
  	}
	console.log(message)
	msgObj.message += message + "\n"
	return message == "OAuthBearerToken: passed!" // IsValid
}

function authenticateCustomAuth(req, msgObj = {message: ""})
{
	var header_val = req.get("accesstoken")
	var message = ""

	if (header_val === "azHmdOe09EdchxeWsdnplkQbv76sJH"){
		message = "CustomAuth: passed!"
	} else {
		if (!header_val)
			message = "CustomAuth: header not received."
		else
			message = "CustomAuth: Wrong access token. Expected: azHmdOe09EdchxeWsdnplkQbv76sJH"
	}
	console.log(message)
	msgObj.message += message + "\n"
	return message == "CustomAuth: passed!" // IsValid
}

function authenticateOAuth2(req, msgObj = {message: ""})
{
    var headerVal = req.get("Authorization")
	var message = ""

    if (headerVal && headerVal.substr(0, 6) === 'Bearer' && isValidToken(headerVal.substr(7))) {
        message = "OAuth2: passed!"
    } else {
		if (!headerVal)
			message = "OAuth2: header not received."
		else
			message = "Oauth2: Invalid access token. Got " + headerVal
    }
	console.log(message)
	msgObj.message += message + "\n"
	return message == "OAuth2: passed!" // IsValid
}

// Used to track tokens issued to clients.
var issuedTokens = [];

// Check if the given token was actually issued by this server, and that
// the timeout has not expired.
var isValidToken = function(token) {
  // Get rid of expired tokens.
  let nonExpiredTokens = issuedTokens.filter(function(t) {
    return t.expiry > Math.floor(Date.now() / 1000);
  });

  // Check if the received token is valid.
  return nonExpiredTokens.some(function(t) {
    return t.access_token == token;
  });
};

const tokenExpiresIn = 3600; // Tweak this to test refresh.

// Create an oauth token with random access_token string or a predefined bearerToken string (if specified)
var makeNewToken = function(length, accessToken = null) {
  var result = '';
  if (accessToken == null) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~+/'
    const charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  } else {
    result = accessToken;
  }
  // Create an oauthToken with a predefined bearerToken as access_token field.
  const oauthToken = {
    access_token: result,
    refresh_token: result,
    token_type: "Bearer",
    expires_in: tokenExpiresIn,
    expiry: Math.floor(Date.now() / 1000) + tokenExpiresIn
  };
  // Store oauthToken for validating incoming requests.
  issuedTokens.push(oauthToken);
  console.log('issuing ' + result);
  return oauthToken;
};

// Refresh an existing token by resetting its expiry.
var refreshToken = function(refreshToken) {
  let tokenIndex = issuedTokens.findIndex(function(t) {
    return t.refresh_token == refreshToken;
  });

  if (tokenIndex !== -1) {
    issuedTokens[tokenIndex].expiry = Math.floor(Date.now() / 1000) + tokenExpiresIn;
    console.log('refreshing ' + refreshToken);
    return issuedTokens[tokenIndex];
  } else {
    console.log('Refresh token not found in server.');
    return null;
  }
};

module.exports = {
  checkAndSendResponse: checkAndSendResponse,
  customAuth: authenticateCustomAuth,
  bearerTokenAuth: authenticateOAuthBearerToken,
  basicAuth: authenticateBasicAuth,
  customHeaderAuth: authenticateCustomHeaderParam,
  customQueryAuth: authenticateCustomQueryParam,
  oAuth2: authenticateOAuth2,
  createToken: makeNewToken,
  refreshToken: refreshToken
};
