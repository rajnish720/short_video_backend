//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const verificationRequestController = require("../../controllers/client/verificationRequest.controller");

//verification request created by the user
route.post(
  "/verificationRequestByUser",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "profileSelfie", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  verificationRequestController.verificationRequestByUser
);

//get particular user's verificationRequest
route.get("/verificationRequestOfUser", checkAccessWithSecretKey(), verificationRequestController.verificationRequestOfUser);

module.exports = route;
