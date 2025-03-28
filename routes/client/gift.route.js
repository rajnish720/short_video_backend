//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const GiftController = require("../../controllers/client/gift.controller");

//get category wise gifts (when view live of another user)
route.get("/getGiftsForUser", checkAccessWithSecretKey(), GiftController.getGiftsForUser);

//send gift to particular user's video
route.post("/sendGiftByUser", checkAccessWithSecretKey(), GiftController.sendGiftByUser);

//send gift to fake live video
route.post("/sendGiftTolive", checkAccessWithSecretKey(), GiftController.sendGiftTolive);

module.exports = route;
