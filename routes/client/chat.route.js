//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ChatController = require("../../controllers/client/chat.controller");

//create chat ( image or audio )
route.post(
  "/createChat",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),

  ChatController.createChat
);

//get old chat between the users
route.get("/getOldChat", checkAccessWithSecretKey(), ChatController.getOldChat);

module.exports = route;
