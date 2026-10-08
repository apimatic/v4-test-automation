var express = require('express')
var auths = require('../utils/authentications');
var router = express.Router()
const querystring = require('querystring');
const urllib = require('url');

const ccg_clientId = '23';
const ccg_clientSecret = 'tQNSqQlXBIwZcY9auoujQ57ckDcoh3t8UPbBRkSF';
const acg_clientId = '24';
const acg_clientSecret = 'Y9auoujQ57ckDtQNSqQlXBIwZccoh3t8UPbBRkSF';
const acg_redirecturi = 'http://localhost:25565/myredirect'
const acg_authCode ='910b000d4f';
const ropcg_clientId = '25';
const ropcg_clientSecret = 'ckDcoh3t8UPbBRkSFtQNSqQlXBIwZcY9auoujQ57';
const ropcg_username = 'apimatic';
const ropcg_password = 'api-d604257e42-matic';
const bearerToken = '0b79bab50daca910b000d4f1a2b675d604257e42';


router.get('/auth-server', function(req, res) {
    // Create and issue an oauthToken with bearerToken as access_token field.
    auths.createToken(64, bearerToken)
    var msgObj = { message: "" }
	var oAuth = auths.oAuth2(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, oAuth)
});

router.post('/auth-server/request_token', function(req, res) {
    OAuthRequestToken(ccg_clientId, ccg_clientSecret, req, res);
});

// for Authorization Code Grant flows that redirect to some uri
router.get('/auth-server/oauth/authorize', function(req, res) {
    const { response_type, client_id, redirect_uri, scope } = req.query;

    if (response_type !== 'code') {
        return res.status(400).send('Invalid response_type');
    }

    if (client_id !== acg_clientId) {
        return res.status(400).send('Invalid client_id');
    }

    if (redirect_uri) {
        // Validate redirect_uri
        const parsedUrl = urllib.parse(redirect_uri);
        if (!parsedUrl.protocol || !parsedUrl.host) {
            return res.status(400).send('Invalid redirect_uri');
        }

        // Redirect to the redirect_uri with the authorization code
        const redirectUrl = `${redirect_uri}?${querystring.stringify({ code: acg_authCode })}`;
        res.redirect(redirectUrl);
        return;
    }

    return res.status(400).send('Missing redirect_uri');
});

router.post('/non-auth-server/token', function(req, res) {
    const grantType = req.body['grant_type'];
    if (grantType == "authorization_code")
    {
        OAuthRequestToken(acg_clientId, acg_clientSecret, req, res);
    }
    else if (grantType == "password")
    {
        OAuthRequestToken(ropcg_clientId, ropcg_clientSecret, req, res);
    }
    else if (grantType == "refresh_token"){
        OAuthRefreshToken(req, res);
    }
    else
    {
        res.statusCode = 401;
        res.json({error: "invalid_grant"});
    }
});

router.post('/non-auth-server/token-password-only', function(req, res) {

    const grantType = req.body['grant_type'];
    console.log (`grantType: ${req.body['grant_type']}`)
    console.log (`userName: ${req.body['username']}`)
    console.log (`password: ${req.body['password']}`)

    if(grantType == "password" && ropcg_username == req.body['username'] && ropcg_password == req.body['password'])
    {
        const oauthToken = auths.createToken(64)
        res.statusCode = 200;
        res.json(oauthToken);
        return;
    }

    res.statusCode = 401
    console.log("Resource Owner Password Oauth2 auth: Auth Code.");
    res.end("username or password not received.");
});

router.get('/non-auth-server/status', function(req, res) {
	var msgObj = { message: "" }
	var oAuth2 = auths.oAuth2(req, msgObj);
	auths.checkAndSendResponse(res, msgObj.message, oAuth2, { status: "passed" })
});

router.get('/non-auth-server/user', function(req, res) {
	var msgObj = { message: "" }
	var oAuth2 = auths.oAuth2(req, msgObj);
	auths.checkAndSendResponse(res, msgObj.message, oAuth2, { status: "passed" })
});

router.get('/oauthOrCombination', function(req, res) {
	var msgObj = { message: "" }
	var oAuth2 = auths.oAuth2(req, msgObj);
	var bearerToken = auths.bearerTokenAuth(req, msgObj);

	auths.checkAndSendResponse(res, msgObj.message, oAuth2 || bearerToken)
});

// Sends errors as defined in https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
function sendErrorResponse(res, error, error_description) {
    const statusCode = error === 'invalid_client' ? 401 : 400;
    res.status(statusCode).json({
        error,
        error_description
    });
}

function validateClientCredentials(req, clientId, clientSecret) {
    const headerVal = req.get("Authorization");
    if (!headerVal) {
        return {
            valid: false,
            error: 'invalid_client',
            description: 'OAuth2 authentication header not received.'
        };
    }

    const expectedHeader = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');
    if (headerVal !== expectedHeader) {
        return {
            valid: false,
            error: 'invalid_client',
            description: `Failed validation. Authorization header should be ${expectedHeader}, using client_id=${clientId} and client_secret=${clientSecret}`
        };
    }

    return { valid: true };
}

function validateGrantType(req) {
    const grantType = req.body['grant_type'];

    if (grantType === 'authorization_code' && (!req.body['code'] || req.body['code'] !== acg_authCode)) {
        return {
            valid: false,
            error: 'invalid_grant',
            description: `Auth Code not received or is incorrect. Auth code should be ${acg_authCode}`
        };
    } else if (grantType === 'password' && (ropcg_username !== req.body['username'] || ropcg_password !== req.body['password'])) {
        return {
            valid: false,
            error: 'invalid_grant',
            description: `Username/password not received or is incorrect. Username should be ${ropcg_username} and password should be ${ropcg_password}`
        };
    } else if (grantType !== 'authorization_code' && grantType !== 'password' && grantType !== 'client_credentials') {
        return {
            valid: false,
            error: 'unsupported_grant_type',
            description: 'The authorization grant type is not supported by the authorization server.'
        };
    }

    return { valid: true };
}

function OAuthRequestToken(clientId, clientSecret, req, res) {
    console.log(`headerval: ${req.get("Authorization")}`);

    const clientValidation = validateClientCredentials(req, clientId, clientSecret);
    if (!clientValidation.valid) {
        res.setHeader('WWW-Authenticate', 'Bearer realm="http://localhost:3000/oauth2"');
        console.log("Oauth2 auth: Missing or wrong header.");
        return sendErrorResponse(res, clientValidation.error, clientValidation.description);
    }

    console.log(`grantType: ${req.body['grant_type']}`);

    const grantValidation = validateGrantType(req);
    if (!grantValidation.valid) {
        return sendErrorResponse(res, grantValidation.error, grantValidation.description);
    }

    // Create and issue an oauthToken with a random access_token field.
    const oauthToken = auths.createToken(64);
    res.status(200).json(oauthToken);
}

// As defined in https://datatracker.ietf.org/doc/html/rfc6749#section-6
// Refresh token values are the same as access token values
// Checks if the token exists in issued tokens
// If it does, then the expiry time is updated.
function OAuthRefreshToken(req, res) {
    const clientAuth = req.get("Authorization");
    const grantType = req.body['grant_type'];
    const refreshToken = req.body['refresh_token'];
    const scope = req.body['scope'];
    let error = null;

    if (!grantType || grantType !== 'refresh_token') {
        error = {
                error: 'invalid_grant',
                error_description: 'Invalid or missing grant_type in request.'
        };
    } else if (!refreshToken) {
        error = {
            error: 'invalid_request',
            error_description: 'Missing refresh_token in request.'
        };
    } else if (!clientAuth) {
        error = {
            error: 'invalid_client',
            error_description: 'Missing client id and/or secret in request.'
        };
    }

    newToken = auths.refreshToken(refreshToken);
    if (!newToken){
        error = {
            error: 'invalid_grant',
            error_description: 'Refresh token not found in server.'
        };
    }

    if (error) {
        res.status(400).json(error);
    } else {
        console.log('Authorization Header:', clientAuth);
        console.log('Grant Type:', grantType);
        console.log('Refresh Token:', refreshToken);
        if (scope) {
            console.log('Scope:', scope);
        }
        res.status(200).json(newToken);
    }
}


module.exports = router;
