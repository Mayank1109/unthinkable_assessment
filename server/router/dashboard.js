const express = require("express");
const router = express.Router();
const multer = require("multer");
const User_File = require("../models/fileModel");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get("/dashboard", async (req, res) => {
  try {
    User_File.find()
      .then((response) => {
        res.json({
          response,
        });
      })
      .catch((error) => {
        res.json({
          message: "An Error Occured",
        });
      });
  } catch (err) {
    res.send(err);
  }
});

router.post("/", upload.single("file"), (req, res) => {
  try {
    let data = new User_File({
      file: req.file.path,
    });
    data
      .save()
      .then((response) => {
        res.json({
          message: "File added successfully!",
          data: response,
        });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occured" });
  }
});

module.exports = router;
