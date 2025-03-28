const express = require("express");
const route = express.Router();

//Controller
const historyController = require("../../controllers/client/history.controller");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//gift coin history of particular user
route.get("/historyOfUser", checkAccessWithSecretKey(), historyController.historyOfUser);

module.exports = route;
