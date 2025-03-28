const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const WithdrawalRequestController = require("../../controllers/admin/withDrawRequest.controller");

//get all withdraw requests
route.get("/index", checkAccessWithSecretKey(), WithdrawalRequestController.index);

//accept withdraw request
route.patch("/accept", checkAccessWithSecretKey(), WithdrawalRequestController.acceptWithdrawalRequest);

//decline withdraw request
route.patch("/decline", checkAccessWithSecretKey(), WithdrawalRequestController.declineWithdrawalRequest);

module.exports = route;
