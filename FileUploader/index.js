const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const multer = require("multer");

const oAuth2Client = require('./credentials');

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");

let username, picture, authed = false;

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file'
];

let Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./drive");
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

let upload = multer({storage: Storage}).single("file");

app.get("/", (req, res) => {
  if (!authed) {
    // Generate an OAuth URL and redirect there
    var url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log(url);
    res.render("index", { url: url });
  } else {
    var oauth2 = google.oauth2({
      version: 'v2',
      auth: oAuth2Client
    });
    oauth2.userinfo.get(function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response.data);
        username = response.data.name
        picture = response.data.picture
        res.render("upload", {
          username: response.data.name,
          picture: response.data.picture,
          success: false
        });
      }
    });
  }
});

app.post("/upload", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return res.end("Something went wrong");
    } else {
      console.log(req.file.path);
      const drive = google.drive({ version: "v3", auth: oAuth2Client });
      const fileMetadata = {
        username: req.file.filename,
      };
      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      };
      drive.files.create(
        {
          resource: fileMetadata,
          media: media,
          fields: "id",
        },
        (err, file) => {
          if (err) {
            // Handle error
            console.error(err);
          } else {
            fs.unlinkSync(req.file.path)
            res.render("upload", { username: name, picture: pic, success: true })
          }

        }
      );
    }
  });
});

app.get('/logout', (req, res) => {
  authed = false
  res.redirect('/')
})

app.get("/auth/callback", function (req, res) {
  const code = req.query.code;
  if (code) {
    // Get an access token based on our OAuth code
    oAuth2Client.getToken(code, function (err, tokens) {
      if (err) {
        console.log("Error authenticating");
        console.log(err);
      } else {
        console.log("Successfully authenticated");
        console.log(tokens)
        oAuth2Client.setCredentials(tokens);


        authed = true;
        res.redirect("/");
      }
    });
  }
});

app.listen(3000, () => {
  console.log("Listening on Port 3000");
});



