//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const bannerController = require("../../controllers/admin/banner.controller");

//get banner
route.get("/getBanner", checkAccessWithSecretKey(), bannerController.getBanner);

//banner create
route.post("/createBanner", checkAccessWithSecretKey(), upload.single("image"), bannerController.createBanner);

//banner update
route.patch("/updateBanner", checkAccessWithSecretKey(), upload.single("image"), bannerController.updateBanner);

//delete banner
route.delete("/deleteBanner", checkAccessWithSecretKey(), bannerController.deleteBanner);

//banner is active or not
route.patch("/isActive", checkAccessWithSecretKey(), bannerController.isActive);

module.exports = route;
