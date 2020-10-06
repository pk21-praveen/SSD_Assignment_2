// Importing necessary libraries
const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const multer = require("multer");

// Importing client credentials
const clientAuth = require('./credentials/clientAuth');

// express app initialization
const app = express();

// ststic folder path declaration
app.use(express.static("public"));

// set view template
app.set("view engine", "ejs");

// declare required variables 
let username, picture, authed = false;

// define google api scopes
const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file'
];

// initialize multer middleware for handling multipart form-data
let Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    // local storage file destination
    callback(null, "./drive");
  },
  filename: function (req, file, callback) {
    // setting a file name
    callback(null, file.originalname + "-" + Date.now());
  },
});

// initialize multer singleFileUploader function
let singleFileUploader = multer({ storage: Storage }).single("file");

// landing page api
app.get("/", (req, res) => {

  // if already logged
  if (!authed) {
    // generate oauth url 
    var url = clientAuth.generateAuthUrl({ access_type: "offline", scope: scopes });

    // redirect to index.ejs view with url
    res.render("index", { url: url });

  } else {

    // initialize google oauth2 api
    var googleOAuth2 = google.oauth2({ auth: clientAuth, version: 'v2' });

    // get user info
    googleOAuth2.userinfo.get(function (err, response) {

      if (err) {
        // handle error
        console.log(err);
      } else {
        // assign userinfo to local variables
        username = response.data.name
        picture = response.data.picture

        // pass the userinfo to upload.ejs view
        res.render("upload", { username: username, picture: picture, isUploaded: false });
      }

    });
  }
});

// file upload api
app.post("/uploadFile", (req, res) => {
  // uploading file using multer
  singleFileUploader(req, res, function (err) {
    if (err) {
      // handle error
      return res.end("Error: Unable to upload file");
    } else {
      // initialize google drive api
      const drive = google.drive({ version: "v3", auth: clientAuth });

      // set file data
      let fileData = {
        fields: "id",
        media: {
          mimeType: req.file.mimetype,
          body: fs.createReadStream(req.file.path),
        },
        resource: {
          name: req.file.filename,
        }
      };

      // upload files to drive
      drive.files.create(fileData,
        (err, file) => {
          if (err) {
            // handle error
            console.error(err);
          } else {
            // remove local file
            fs.unlinkSync(req.file.path)

            // return respnse to upload.ejs view
            res.render("upload", { username: username, picture: picture, isUploaded: true });
          }
        }
      );

    }
  });
});

// goole auth callback api
app.get("/auth/google/callback", function (req, res) {
  const code = req.query.code;
  if (code) {
    // Get an access token from the google based on oauth code
    clientAuth.getToken(code, function (err, tokens) {

      if (err) {
        // handle error
        console.log("Error: Failed to authenticate");
      } else {
        // set client credentials through access token
        clientAuth.setCredentials(tokens);

        // enable true for auth variable
        authed = true;

        // redirect to landing page
        res.redirect("/");
      }
    });
  }
});

// logout api
app.get('/logout', (req, res) => {
  // enable false for auth variable
  authed = false

  // redirect to landing page
  res.redirect('/')
})

// app listening port
app.listen(3000, () => {
  console.log("Listening on Port 3000");
});



