var express = require('express')
var auths = require('../utils/authentications');

var router = express.Router()

router.get("/oneLeggedAuth", function(req, res){
	var header_val = req.get("Authorization")
	var error_string = ""
	if (!header_val) {
		error_string += "OAuth1 one Legged authentication header not received.\n"
	}
	else {
		var key_value_pair_strings = header_val.substring(header_val.indexOf(' ') + 1).split(",")
		var dictionary = {}
		key_value_pair_strings.forEach(function (key_value_pair_string) {
			var key_value_array = key_value_pair_string.split('=').map(function(str){return str.trim()})
			dictionary[key_value_array[0]] = key_value_array[1].substring(1, key_value_array[1].length - 1)
		})

		if(!("oauth_consumer_key" in dictionary))
			error_string += "oauth_consumer_key not found in OAuth1 Authorization header.\n"
		else if(dictionary["oauth_consumer_key"] != "tysdb6721gvdaSAd2")
			error_string += "oauth_client_id is incorrect in OAuth1 Authorization header.\n"

		if(!("oauth_signature_method" in dictionary))
			error_string += "oauth_signature_method not found in OAuth1 Authorization header.\n"

		if(!("oauth_timestamp" in dictionary))
			error_string += "oauth_timestamp not found in OAuth1 Authorization header.\n"

		if(!("oauth_nonce" in dictionary))
			error_string += "oauth_nonce not found in OAuth1 Authorization header.\n"

		if(!("oauth_version" in dictionary))
			error_string += "oauth_version not found in OAuth1 Authorization header.\n"

		// Generate expected signature
		var oauthSignature = require('oauth-signature')
		var httpMethod = 'GET'
	    url = 'http://localhost:3000/auth/oneLeggedAuth'	    
	    parameters = {
	        oauth_consumer_key : dictionary['oauth_consumer_key'],
	        oauth_nonce : dictionary['oauth_nonce'],
	        oauth_timestamp : dictionary['oauth_timestamp'],
	        oauth_signature_method : dictionary['oauth_signature_method'],
	        oauth_version : dictionary['oauth_version']
	    }
	    consumerSecret = 'aQsxTgspcfBlcywTcyPshas6aS5h626'	    
		expected_signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret)
		console.log(expected_signature);
		console.log(dictionary["oauth_signature"]);
		if(!("oauth_signature" in dictionary))
			error_string += "oauth_signature not found in OAuth1 one Legged Authorization header.\n"
		else if(dictionary["oauth_signature"] != expected_signature)
			error_string += "oauth_signature is incorrect in OAuth1 Authorization header.\nCheck your client secret (aQsxTgspcfBlcywTcyPshas6aS5h626).\n"
	}

	if(error_string == "")
		res.end("You've passed the test!")
	else {
		console.log(error_string)
		res.statusCode = 401
		res.end(error_string)
	}
});

router.get('/pkcs12Certificate', function(req, res){
	console.log(req.summary);
	var header_val = req.get("Authorization")
	var error_string = ""
	if (!header_val) {
		error_string += "OAuth1 one Legged authentication header not received.\n"
	}
	else {
		var key_value_pair_strings = header_val.substring(header_val.indexOf(' ') + 1).split(",")
		var dictionary = {}
		key_value_pair_strings.forEach(function (key_value_pair_string) {
			var key_value_array = key_value_pair_string.split('=').map(function(str){return str.trim()})
			dictionary[key_value_array[0]] = key_value_array[1].substring(1, key_value_array[1].length - 1)
		})

		if(!("oauth_consumer_key" in dictionary))
			error_string += "oauth_consumer_key not found in OAuth1 Authorization header.\n"
		else if(dictionary["oauth_consumer_key"] != "skd897yahdjkas78")
			error_string += "oauth_client_id is incorrect in OAuth1 Authorization header.\n"

		if(!("oauth_signature_method" in dictionary))
			error_string += "oauth_signature_method not found in OAuth1 Authorization header.\n"

		if(!("oauth_timestamp" in dictionary))
			error_string += "oauth_timestamp not found in OAuth1 Authorization header.\n"

		if(!("oauth_nonce" in dictionary))
			error_string += "oauth_nonce not found in OAuth1 Authorization header.\n"

		if(!("oauth_version" in dictionary))
			error_string += "oauth_version not found in OAuth1 Authorization header.\n"

		// Generate expected signature
		/*var oauthSignature = require('oauth-signature')
		var httpMethod = 'GET'
	    url = 'http://localhost:3000/auth/oneLeggedAuth'	    
	    parameters = {
	        oauth_consumer_key : dictionary['oauth_consumer_key'],
	        oauth_nonce : dictionary['oauth_nonce'],
	        oauth_timestamp : dictionary['oauth_timestamp'],
	        oauth_signature_method : dictionary['oauth_signature_method'],
	        oauth_version : dictionary['oauth_version']
		}
		certKeyPass = 'lksdjgfu78edjkasdni'
		certKeyFile = 'aeryY76Jhf7hdLkduyQw8dj'
		certKeyAlias = 'nbfsdfYGbdjYThd97JHkdals7'   		    
	    expected_signature = oauthSignature.generate(httpMethod, url, parameters,certKeyPass, certKeyFile, certKeyAlias)
		if(!("oauth_signature" in dictionary))
			error_string += "oauth_signature not found in OAuth1 one Legged Authorization header.\n"
		else if(dictionary["oauth_signature"] != expected_signature)
			error_string += "oauth_signature is incorrect in OAuth1 Authorization header.\nCheck your client secret (lksdjgfu78edjkasdni).\n"*/
	}

	if(error_string == "")
		res.end("You've passed the test!")
	else {
		console.log(error_string)
		res.statusCode = 401
		res.end(error_string)
	}
});

router.get('/oauth1', function(req, res) {
	var header_val = req.get("Authorization")
	console.log(req.summary);
	var error_string = ""
	if (!header_val) {
		error_string += "OAuth1 authentication header not received.\n"
	}
	else {
		var key_value_pair_strings = header_val.substring(header_val.indexOf(' ') + 1).split(",")
		var dictionary = {}
		key_value_pair_strings.forEach(function (key_value_pair_string) {
			var key_value_array = key_value_pair_string.split('=').map(function(str){return str.trim()})
			dictionary[key_value_array[0]] = key_value_array[1].substring(1, key_value_array[1].length - 1)
		})

		if(!("oauth_consumer_key" in dictionary))
			error_string += "oauth_consumer_key not found in OAuth1 Authorization header.\n"
		else if(dictionary["oauth_consumer_key"] != "dpf43f3p2l4k3l03")
			error_string += "oauth_client_id is incorrect in OAuth1 Authorization header.\n"

		if(!("oauth_token" in dictionary))
			error_string += "oauth_token not found in OAuth1 Authorization header.\n"
		else if(dictionary["oauth_token"] != "nnch734d00sl2jdk")
			error_string += "oauth_token is incorrect in OAuth1 Authorization header.\n"

		if(!("oauth_signature_method" in dictionary))
			error_string += "oauth_signature_method not found in OAuth1 Authorization header.\n"

		if(!("oauth_timestamp" in dictionary))
			error_string += "oauth_timestamp not found in OAuth1 Authorization header.\n"

		if(!("oauth_nonce" in dictionary))
			error_string += "oauth_nonce not found in OAuth1 Authorization header.\n"

		if(!("oauth_version" in dictionary))
			error_string += "oauth_version not found in OAuth1 Authorization header.\n"

		// Generate expected signature
		var oauthSignature = require('oauth-signature')
		var httpMethod = 'GET'
	    url = 'http://localhost:3000/auth/oauth1'	    
	    parameters = {
	        oauth_consumer_key : dictionary['oauth_consumer_key'],
	        oauth_token : dictionary['oauth_token'],
	        oauth_nonce : dictionary['oauth_nonce'],
	        oauth_timestamp : dictionary['oauth_timestamp'],
	        oauth_signature_method : dictionary['oauth_signature_method'],
	        oauth_version : dictionary['oauth_version']
	    }
	    consumerSecret = 'kd94hf93k423kf44'
	    tokenSecret = 'pfkkdhi9sl3r4s00'	    
	    expected_signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret)

		if(!("oauth_signature" in dictionary))
			error_string += "oauth_signature not found in OAuth1 Authorization header.\n"
		else if(dictionary["oauth_signature"] != expected_signature)
			error_string += "oauth_signature is incorrect in OAuth1 Authorization header.\nCheck your token secret (pfkkdhi9sl3r4s00) and client secret (kd94hf93k423kf44).\n"
	}

	if(error_string == "")
		res.end("You've passed the test!")
	else {
		console.log(error_string)
		res.statusCode = 401
		res.end(error_string)
	}
})

router.get('/skipAuthentication', function(req, res){
	console.log(req.query.token);
	if(typeof req.query.token === 'undefined'){
		res.end("You've passed the test!");
	}else{
		res.statusCode = 400;
		res.end("Authentication is not skipped.");
	}
});

router.get('/oauth3', function(req, res) {
	var header_val = req.get("Authorization")
	console.log(header_val);
	var error_string = ""
	if (!header_val) {
		error_string += "OAuth1 authentication header not received.\n"
	}
	else {
		var key_value_pair_strings = header_val.substring(header_val.indexOf(' ') + 1).split(",")
		var dictionary = {}
		key_value_pair_strings.forEach(function (key_value_pair_string) {
			var key_value_array = key_value_pair_string.split('=').map(function(str){return str.trim()})
			dictionary[key_value_array[0]] = key_value_array[1].substring(1, key_value_array[1].length - 1)
		})

		if(!("oauth_consumer_key" in dictionary))
			error_string += "oauth_consumer_key not found in OAuth1 Authorization header.\n"
		else if(dictionary["oauth_consumer_key"] != "dpf43f3p2l4k3l03")
			error_string += "oauth_client_id is incorrect in OAuth1 Authorization header.\n"

		if(!("oauth_token" in dictionary))
			error_string += "oauth_token not found in OAuth1 Authorization header.\n"
		else if(dictionary["oauth_token"] != "nnch734d00sl2jdk")
			error_string += "oauth_token is incorrect in OAuth1 Authorization header.\n"

		if(!("oauth_signature_method" in dictionary))
			error_string += "oauth_signature_method not found in OAuth1 Authorization header.\n"

		if(!("oauth_timestamp" in dictionary))
			error_string += "oauth_timestamp not found in OAuth1 Authorization header.\n"

		if(!("oauth_nonce" in dictionary))
			error_string += "oauth_nonce not found in OAuth1 Authorization header.\n"

		if(!("oauth_version" in dictionary))
			error_string += "oauth_version not found in OAuth1 Authorization header.\n"

		// Generate expected signature
		var oauthSignature = require('oauth-signature')
		var httpMethod = 'GET'
	    url = 'https://core-build.apimatic.io/api/auth/oauth3'	    
	    parameters = {
	        oauth_consumer_key : dictionary['oauth_consumer_key'],
	        oauth_token : dictionary['oauth_token'],
	        oauth_nonce : dictionary['oauth_nonce'],
	        oauth_timestamp : dictionary['oauth_timestamp'],
	        oauth_signature_method : dictionary['oauth_signature_method'],
	        oauth_version : dictionary['oauth_version']
	    }
	    consumerSecret = 'kd94hf93k423kf44'
	    tokenSecret = 'pfkkdhi9sl3r4s00'	    
	    expected_signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret)

		if(!("oauth_signature" in dictionary))
			error_string += "oauth_signature not found in OAuth1 Authorization header.\n"
		else if(dictionary["oauth_signature"] != expected_signature)
			error_string += "oauth_signature is incorrect in OAuth1 Authorization header.\nCheck your token secret (pfkkdhi9sl3r4s00) and client secret (kd94hf93k423kf44).\n"
	}

	if(error_string == "")
		res.end("You've passed the test!")
	else {
		console.log(error_string)
		res.statusCode = 401
		res.end(error_string)
	}
})

router.get('/basic', function(req, res) {
	var msgObj = { message: "" }
	var basicAuth = auths.basicAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, basicAuth)
})

router.get('/customQueryParam', function(req,res){
	var msgObj = { message: "" }
	var customQuery = auths.customQueryAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, customQuery)
});

router.get('/customHeaderSignature', function(req, res) {
	var msgObj = { message: "" }
	var customHeader = auths.customHeaderAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, customHeader)
});

router.get('/customQueryOrHeaderParam', function(req, res) {
	var msgObj = { message: "" }
	var customQuery = auths.customQueryAuth(req, msgObj);
	var customHeader = auths.customHeaderAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, customQuery || customHeader)
});

router.get('/basicAndApiKeyAndApiHeader', function(req, res) {
	var msgObj = { message: "" }
	var basicAuth = auths.basicAuth(req, msgObj);
	var customQuery = auths.customQueryAuth(req, msgObj);
	var customHeader = auths.customHeaderAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, basicAuth && customQuery && customHeader)
});

router.get('/oauth2', function(req, res) {
	var msgObj = { message: "" }
	var oAuthBearerToken = auths.bearerTokenAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, oAuthBearerToken)
});

router.get('/customAuthentication', function(req, res) {
	var msgObj = { message: "" }
	var customAuth = auths.customAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, customAuth)
});

router.get('/multipleAuthCombination', function(req, res) {
	var msgObj = { message: "" }
	var customAuth = auths.customAuth(req, msgObj);
	var oAuthBearerToken = auths.bearerTokenAuth(req, msgObj);
	var customQuery = auths.customQueryAuth(req, msgObj);
	var customHeader = auths.customHeaderAuth(req, msgObj);
	var basicAuth = auths.basicAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, customAuth || oAuthBearerToken || (customQuery && customHeader && basicAuth))
});

module.exports = router;