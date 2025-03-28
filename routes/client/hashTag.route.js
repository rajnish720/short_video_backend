//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const HashTagController = require("../../controllers/client/hashTag.controller");

//craete hashTag by user
route.post("/createHashTag", checkAccessWithSecretKey(), HashTagController.createHashTag);

//get all hashTag (when add the video by particular user)
route.get("/hashtagDrop", checkAccessWithSecretKey(), HashTagController.hashtagDrop);

//get particular hashTag's video
route.get("/videosOfHashTag", checkAccessWithSecretKey(), HashTagController.videosOfHashTag);

//get particular hashTag's post
route.get("/postsOfHashTag", checkAccessWithSecretKey(), HashTagController.postsOfHashTag);

module.exports = route;
