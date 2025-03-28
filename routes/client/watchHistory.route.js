//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const watchHistoryController = require("../../controllers/client/watchHistory.controller");

//when user view the video create watchHistory of the particular video
route.post("/createWatchHistory", checkAccessWithSecretKey(), watchHistoryController.createWatchHistory);

module.exports = route;
