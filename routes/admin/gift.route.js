//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const GiftController = require("../../controllers/admin/gift.controller");

//create gift
route.post(
  "/createGift",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "svgaImage", maxCount: 1 },
  ]),
  GiftController.createGift
);

//update gift
route.patch(
  "/updateGift",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "svgaImage", maxCount: 1 },
  ]),
  GiftController.updateGift
);

//get gift
route.get("/getGifts", checkAccessWithSecretKey(), GiftController.getGifts);

//delete gift
route.delete("/deleteGift", checkAccessWithSecretKey(), GiftController.deleteGift);

module.exports = route;
