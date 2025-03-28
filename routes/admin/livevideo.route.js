//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const LivevideoController = require("../../controllers/admin/livevideo.controller");

//upload fake video
route.post(
  "/uploadLivevideo",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "videoImage", maxCount: 5 },
    { name: "videoUrl", maxCount: 5 },
  ]),
  LivevideoController.uploadLivevideo
);

//update fake video
route.patch(
  "/updateLivevideo",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "videoImage", maxCount: 5 },
    { name: "videoUrl", maxCount: 5 },
  ]),
  LivevideoController.updateLivevideo
);

//get live videos
route.get("/getVideos", checkAccessWithSecretKey(), LivevideoController.getVideos);

//delete video
route.delete("/deleteVideo", checkAccessWithSecretKey(), LivevideoController.deleteVideo);

//video live or not
route.patch("/isLive", checkAccessWithSecretKey(), LivevideoController.isLive);

module.exports = route;
