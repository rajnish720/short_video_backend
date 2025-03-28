//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const FollowerFollowingController = require("../../controllers/client/followerFollowing.controller");

//follow or unfollow the user
route.post("/followUnfollowUser", checkAccessWithSecretKey(), FollowerFollowingController.followUnfollowUser);

//get follower or following list of the particular user
route.get("/followerFollowingList", checkAccessWithSecretKey(), FollowerFollowingController.followerFollowingList);

module.exports = route;
