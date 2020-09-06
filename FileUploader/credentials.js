const { google } = require("googleapis");

const credentials = require("./credentials.json");

const APP_CLIENT_ID = credentials.web.client_id;
const APP_CLIENT_SECRET = credentials.web.client_secret;
const APP_REDIRECT_URL = credentials.web.redirect_uris[0];

module.exports = new google.auth.OAuth2(
  APP_CLIENT_ID,
  APP_CLIENT_SECRET,
  APP_REDIRECT_URL
);
