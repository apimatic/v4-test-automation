// Trimmed from APIMatic's private API Tester (upstream commit db81cdb) down to
// what the auth build uses: the /auth and /oauth2 checkers and the echo
// catch-all. routes/ and utils/ are copied verbatim so they still diff cleanly
// against upstream; only this wiring was rewritten. See README.md.
var express = require("express");
var cors = require("cors");

var auth = require("./routes/auth");
var oauth2 = require("./routes/oauth2");
var echo = require("./routes/index");

var app = express();

// The portal calls this from another origin (the served portal on 127.0.0.1).
app.use(cors());
app.options("*", cors());

// Keep serving after a handler throws — e.g. the OAuth1 routes, which need
// `oauth-signature` and aren't installed because nothing here uses them.
process.on("uncaughtException", function (err) {
  console.error(err.stack);
});

app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(buildRequest);

app.use("/auth", auth);
app.use("/oauth2", oauth2);
// Anything else: `?echo=true` returns the request as received, otherwise 400.
app.use("/*", echo);

// What the echo catch-all returns.
function buildRequest(req, res, next) {
  req.summary = {
    path: req.url,
    query: req.query,
    headers: req.headers,
    method: req.method,
    body: req.body,
    uploadCount: 0,
  };
  next();
}

module.exports = app;
