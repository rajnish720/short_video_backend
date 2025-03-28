const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const currencyController = require("../../controllers/admin/currency.controller");

//create currency
route.post("/create", checkAccessWithSecretKey(), currencyController.store);

//update currency
route.patch("/update", checkAccessWithSecretKey(), currencyController.update);

//get all currencies
route.get("/", checkAccessWithSecretKey(), currencyController.get);

//delete currency
route.delete("/delete", checkAccessWithSecretKey(), currencyController.destroy);

//set default currency
route.patch("/setdefault", checkAccessWithSecretKey(), currencyController.setdefault);

//get default currency
route.get("/getDefault", checkAccessWithSecretKey(), currencyController.getDefault);

module.exports = route;
