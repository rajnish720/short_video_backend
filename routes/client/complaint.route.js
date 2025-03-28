//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ComplaintController = require("../../controllers/client/complaint.controller");

//complaint or suggession by particular user
route.post("/complaintByUser", checkAccessWithSecretKey(), upload.single("image"), ComplaintController.complaintByUser);

module.exports = route;
