//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const verificationRequestController = require("../../controllers/admin/verificationRequest.controller");

//verificationRequest accept by the admin
route.patch("/verificationRequestAccept", checkAccessWithSecretKey(), verificationRequestController.verificationRequestAccept);

//verificationRequest decline by the admin
route.patch("/verificationRequestDecline", checkAccessWithSecretKey(), verificationRequestController.verificationRequestDecline);

//get all verificationRequest
route.get("/getAll", checkAccessWithSecretKey(), verificationRequestController.getAll);

module.exports = route;
