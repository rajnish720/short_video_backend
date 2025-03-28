//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const UserController = require("../../controllers/client/user.controller");

//check the user is exists or not with loginType 3 quick(identity)
route.post("/checkUser", checkAccessWithSecretKey(), UserController.checkUser);

//user login or sign up
route.post("/loginOrSignUp", checkAccessWithSecretKey(), UserController.loginOrSignUp);

//update profile of the user
route.patch("/update", checkAccessWithSecretKey(), upload.single("image"), UserController.update);

//get user profile who login
route.get("/getProfile", checkAccessWithSecretKey(), UserController.getProfile);

//get user profile with total count of followers, total count of following and total count of videos and posts's likes (for own user profile)
route.get("/getUserProfile", checkAccessWithSecretKey(), UserController.getUserProfile);

//get user's coin
route.get("/getUserCoin", checkAccessWithSecretKey(), UserController.getUserCoin);

//get all reveived gift by user
route.get("/receviedGiftByUser", checkAccessWithSecretKey(), UserController.receviedGiftByUser);

//update password
route.patch("/updatePassword", checkAccessWithSecretKey(), UserController.updatePassword);

//set password
route.patch("/setPassword", checkAccessWithSecretKey(), UserController.setPassword);

//delete user account
route.delete("/deleteUserAccount", checkAccessWithSecretKey(), UserController.deleteUserAccount);

module.exports = route;
