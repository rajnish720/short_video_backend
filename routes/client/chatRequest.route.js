//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ChatRequestController = require("../../controllers/client/chatRequest.controller");

//get recent chat with user
route.get("/getMessageRequestThumb", checkAccessWithSecretKey(), ChatRequestController.getMessageRequestThumb);

//accept OR decline message request by receiver
route.post("/handleMessageRequest", checkAccessWithSecretKey(), ChatRequestController.handleMessageRequest);

//get old chat of particular message request
route.get("/getOldMessageRequest", checkAccessWithSecretKey(), ChatRequestController.getOldMessageRequest);

//delete all message requestes of particular user
route.delete("/deleteMessageRequest", checkAccessWithSecretKey(), ChatRequestController.deleteMessageRequest);

module.exports = route;
