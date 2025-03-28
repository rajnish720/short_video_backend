//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const UserController = require("../../controllers/admin/user.controller");

//create user
route.post("/fakeUser", checkAccessWithSecretKey(), upload.single("image"), UserController.fakeUser);

//update profile of the user
route.patch("/updateUser", checkAccessWithSecretKey(), upload.single("image"), UserController.updateUser);

//get users (who is added by admin or real)
route.get("/getUsers", checkAccessWithSecretKey(), UserController.getUsers);

//handle block of the users (multiple or single)
route.patch("/isBlock", checkAccessWithSecretKey(), UserController.isBlock);

//delete the users (multiple or single)
route.delete("/deleteUsers", checkAccessWithSecretKey(), UserController.deleteUsers);

//get user profile
route.get("/getProfile", checkAccessWithSecretKey(), UserController.getProfile);

module.exports = route;
