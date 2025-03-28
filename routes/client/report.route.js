//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const reportController = require("../../controllers/client/report.controller");

//report made by particular user
route.post("/reportByUser", checkAccessWithSecretKey(), reportController.reportByUser);

//when report by the user get reportReason
route.get("/getReportReason", checkAccessWithSecretKey(), reportController.getReportReason);

module.exports = route;
