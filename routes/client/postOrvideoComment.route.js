//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const PostOrVideoCommentController = require("../../controllers/client/postOrvideoComment.controller");

//create comment of particular post or video
route.post("/commentOfPostOrVideo", checkAccessWithSecretKey(), PostOrVideoCommentController.commentOfPostOrVideo);

//create like or dislike of particular comment
route.post("/likeOrDislikeOfComment", checkAccessWithSecretKey(), PostOrVideoCommentController.likeOrDislikeOfComment);

//get all comments for particular video or post
route.get("/getpostOrvideoComments", checkAccessWithSecretKey(), PostOrVideoCommentController.getpostOrvideoComments);

module.exports = route;
