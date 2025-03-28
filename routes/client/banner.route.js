//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const bannerController = require("../../controllers/client/banner.controller");

//get banner
route.get("/getBanner", checkAccessWithSecretKey(), bannerController.getBanner);

module.exports = route;
