//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const VideoController = require("../../controllers/client/video.controller");

//upload video by particular user
route.post(
  "/uploadvideo",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "videoImage", maxCount: 5 },
    { name: "videoUrl", maxCount: 5 },
  ]),
  VideoController.uploadvideo
);

//update video by particular user
route.patch("/updateVideoByUser", checkAccessWithSecretKey(), upload.single("videoImage"), VideoController.updateVideoByUser);

//get particular user's videos
route.get("/videosOfUser", checkAccessWithSecretKey(), VideoController.videosOfUser);

//if isFakeData on then real+fake videos otherwise fake videos
route.get("/getAllVideos", checkAccessWithSecretKey(), VideoController.getAllVideos);

//delete video
route.delete("/deleteVideoOfUser", checkAccessWithSecretKey(), VideoController.deleteVideoOfUser);

//like or dislike of particular video by the particular user
route.post("/likeOrDislikeOfVideo", checkAccessWithSecretKey(), VideoController.likeOrDislikeOfVideo);

//when user share the video then shareCount of the particular video increased
route.post("/shareCountOfVideo", checkAccessWithSecretKey(), VideoController.shareCountOfVideo);

//delete video
route.delete("/deleteParticularVideo", checkAccessWithSecretKey(), VideoController.deleteParticularVideo);

//get videos of the particular song by particular user
route.get("/fetchVideosOfParticularSong", checkAccessWithSecretKey(), VideoController.fetchVideosOfParticularSong);

module.exports = route;
