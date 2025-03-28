//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ComplaintController = require("../../controllers/admin/complaint.controller");

//get type wise all complaints
route.get("/getComplaints", checkAccessWithSecretKey(), ComplaintController.getComplaints);

//complaint solved
route.patch("/solveComplaint", checkAccessWithSecretKey(), ComplaintController.solveComplaint);

//delete complaint
route.delete("/deleteComplaint", checkAccessWithSecretKey(), ComplaintController.deleteComplaint);

module.exports = route;
