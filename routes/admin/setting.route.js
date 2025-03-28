//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const settingController = require("../../controllers/admin/setting.controller");

//create Setting
//route.post("/createSetting", checkAccessWithSecretKey(), settingController.createSetting);

//update Setting
route.patch("/updateSetting", checkAccessWithSecretKey(), settingController.updateSetting);

//get setting data
route.get("/getSetting", checkAccessWithSecretKey(), settingController.getSetting);

//handle setting switch
route.patch("/handleSwitch", checkAccessWithSecretKey(), settingController.handleSwitch);

//handle water mark setting
route.patch("/updateWatermarkSetting", checkAccessWithSecretKey(), upload.single("watermarkIcon"), settingController.updateWatermarkSetting);

module.exports = route;
