//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const PostController = require("../../controllers/client/post.controller");

//upload post by particular user
route.post("/uploadPost", checkAccessWithSecretKey(), upload.fields([{ name: "postImage", maxCount: 5 }]), PostController.uploadPost);

//update post by particular user
route.patch("/updatePostByUser", checkAccessWithSecretKey(), PostController.updatePostByUser);

//if isFakeData on then real+fake posts otherwise fake posts
route.get("/getAllPosts", checkAccessWithSecretKey(), PostController.getAllPosts);

//get particular user's posts
route.get("/postsOfUser", checkAccessWithSecretKey(), PostController.postsOfUser);

//delete post
route.delete("/deletePostOfUser", checkAccessWithSecretKey(), PostController.deletePostOfUser);

//like or dislike of particular post by the particular user
route.post("/likeOrDislikeOfPost", checkAccessWithSecretKey(), PostController.likeOrDislikeOfPost);

//when user share the post then shareCount of the particular post increased
route.post("/shareCountOfPost", checkAccessWithSecretKey(), PostController.shareCountOfPost);

//delete post
route.delete("/deleteParticularPost", checkAccessWithSecretKey(), PostController.deleteParticularPost);

module.exports = route;
