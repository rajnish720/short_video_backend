//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const HashTagController = require("../../controllers/admin/hashTag.controller");

//create hashTag
route.post(
  "/create",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "hashTagBanner", maxCount: 1 },
    { name: "hashTagIcon", maxCount: 1 },
  ]),
  HashTagController.create
);

//update hashTag
route.patch(
  "/update",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "hashTagBanner", maxCount: 1 },
    { name: "hashTagIcon", maxCount: 1 },
  ]),
  HashTagController.update
);

//get hashTag
route.get("/getbyadmin", checkAccessWithSecretKey(), HashTagController.getbyadmin);

//delete hashTag
route.delete("/delete", checkAccessWithSecretKey(), HashTagController.delete);

//get all hashTag for deopdown
route.get("/getHashtag", checkAccessWithSecretKey(), HashTagController.getHashtag);

module.exports = route;
