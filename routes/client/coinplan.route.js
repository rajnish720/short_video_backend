const express = require("express");
const route = express.Router();

//Controller
const coinplanController = require("../../controllers/client/coinplan.controller");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//get coinplan
route.get("/getCoinplan", checkAccessWithSecretKey(), coinplanController.getCoinplan);

//when user purchase the coinPlan create coinPlan history by user
route.post("/createHistory", checkAccessWithSecretKey(), coinplanController.createHistory);

module.exports = route;
