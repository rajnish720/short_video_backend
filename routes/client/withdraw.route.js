//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const WithdrawController = require("../../controllers/client/withdraw.controller");

//get Withdraw
route.get("/get", checkAccessWithSecretKey(), WithdrawController.get);

module.exports = route;
