//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const VideoController = require("../../controllers/admin/video.controller");

//upload fake video
route.post(
  "/uploadfakevideo",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "videoImage", maxCount: 5 },
    { name: "videoUrl", maxCount: 5 },
  ]),
  VideoController.uploadfakevideo
);

//update fake video
route.patch(
  "/updatefakevideo",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "videoImage", maxCount: 5 },
    { name: "videoUrl", maxCount: 5 },
  ]),
  VideoController.updatefakevideo
);

//get real or fake videos
route.get("/getVideos", checkAccessWithSecretKey(), VideoController.getVideos);

//get particular user's videos
route.get("/getVideosOfUser", checkAccessWithSecretKey(), VideoController.getVideosOfUser);

//get particular video details
route.get("/getDetailOfVideo", checkAccessWithSecretKey(), VideoController.getDetailOfVideo);

//delete video
route.delete("/deleteVideo", checkAccessWithSecretKey(), VideoController.deleteVideo);

module.exports = route;
