const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

const reportController = require("../../controllers/admin/report.controller");

//get type wise all reports
route.get("/getReports", checkAccessWithSecretKey(), reportController.getReports);

//report solved
route.patch("/solveReport", checkAccessWithSecretKey(), reportController.solveReport);

//delete report
route.delete("/deleteReport", checkAccessWithSecretKey(), reportController.deleteReport);

module.exports = route;
