const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

const WithdrawalRequestController = require("../../controllers/client/withDrawRequest.controller");

//convert coin into amount (in default currency)
route.post("/coinToAmount", checkAccessWithSecretKey(), WithdrawalRequestController.coinToAmount);

//withdraw request made by particular user
route.post("/createWithdrawRequest", checkAccessWithSecretKey(), WithdrawalRequestController.createWithdrawRequest);

module.exports = route;
