//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const AdminMiddleware = require("../../middleware/admin.middleware");

//controller
const AdminController = require("../../controllers/admin/admin.controller");

//create admin
route.post("/signUp", AdminController.store);

//admin login
route.post("/login", AdminController.login);

//update admin profile
route.patch("/updateProfile", AdminMiddleware, upload.single("image"), AdminController.update);

//get admin profile
route.get("/profile", AdminMiddleware, AdminController.getProfile);

//send email for forgot the password (forgot password)
route.post("/forgotPassword", AdminMiddleware, AdminController.forgotPassword);

//update admin password
route.patch("/updatePassword", AdminMiddleware, AdminController.updatePassword);

//set password
route.patch("/setPassword", AdminMiddleware, AdminController.setPassword);

module.exports = route;
