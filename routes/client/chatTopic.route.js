//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ChatTopicController = require("../../controllers/client/chatTopic.controller");

//get thumb list of chat between the users
route.get("/getChatList", checkAccessWithSecretKey(), ChatTopicController.getChatList);

//search the users with chat has been done
route.post("/chatWithUserSearch", checkAccessWithSecretKey(), ChatTopicController.chatWithUserSearch);

//get recent chat with user
route.get("/recentChatWithUsers", checkAccessWithSecretKey(), ChatTopicController.recentChatWithUsers);

module.exports = route;
