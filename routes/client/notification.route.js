//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const NotificationController = require("../../controllers/client/notification.controller");

//get notification list for the particular user
route.get("/notificationList", checkAccessWithSecretKey(), NotificationController.notificationList);

//clear all notification for particular user
route.delete("/clearNotificationHistory", checkAccessWithSecretKey(), NotificationController.clearNotificationHistory);

module.exports = route;
