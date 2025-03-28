//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const songController = require("../../controllers/admin/song.coontroller");

//create songList
route.post(
  "/createSong",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "songImage", maxCount: 1 },
    { name: "songLink", maxCount: 1 },
  ]),
  songController.createSong
);

//update songList
route.patch(
  "/updateSong",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "songImage", maxCount: 1 },
    { name: "songLink", maxCount: 1 },
  ]),
  songController.updateSong
);

//get all song
route.get("/getSongs", checkAccessWithSecretKey(), songController.getSongs);

//delete song
route.delete("/deletesong", checkAccessWithSecretKey(), songController.deletesong);

module.exports = route;
