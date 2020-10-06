const { google } = require("googleapis");

const credentials = require("./credentials.json");

module.exports = new google.auth.OAuth2(
  credentials.web.client_id, // APP_CLIENT_ID
  credentials.web.client_secret, // APP_CLIENT_SECRET
  credentials.web.redirect_uris[0] // APP_REDIRECT_URL
);
