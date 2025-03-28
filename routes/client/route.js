//express
const express = require("express");
const route = express.Router();

//require client's route.js
const user = require("./user.route");
const post = require("./post.route");
const video = require("./video.route");
const chat = require("./chat.route");
const chatTopic = require("./chatTopic.route");
const followerFollowing = require("./followerFollowing.route");
const postOrvideoComment = require("./postOrvideoComment.route");
const searchHistory = require("./searchHistory.route");
const notification = require("./notification.route");
const watchHistory = require("./watchHistory.route");
const verificationRequest = require("./verificationRequest.route");
const hashTag = require("./hashTag.route");
const liveUser = require("./liveUser.route");
const gift = require("./gift.route");
const report = require("./report.route");
const setting = require("./setting.route");
const withdrawRequest = require("./withDrawRequest.route");
const song = require("./song.route");
const complaint = require("./complaint.route");
const withdraw = require("./withdraw.route");
const coinPlan = require("./coinplan.route");
const history = require("./history.route");
const banner = require("./banner.route");
const chatRequest = require("./chatRequest.route");

//exports client's route.js
route.use("/user", user);
route.use("/post", post);
route.use("/video", video);
route.use("/chat", chat);
route.use("/chatTopic", chatTopic);
route.use("/followerFollowing", followerFollowing);
route.use("/postOrvideoComment", postOrvideoComment);
route.use("/searchHistory", searchHistory);
route.use("/notification", notification);
route.use("/watchHistory", watchHistory);
route.use("/verificationRequest", verificationRequest);
route.use("/hashTag", hashTag);
route.use("/liveUser", liveUser);
route.use("/gift", gift);
route.use("/report", report);
route.use("/setting", setting);
route.use("/withdrawRequest", withdrawRequest);
route.use("/song", song);
route.use("/complaint", complaint);
route.use("/withdraw", withdraw);
route.use("/coinPlan", coinPlan);
route.use("/history", history);
route.use("/banner", banner);
route.use("/chatRequest", chatRequest);

module.exports = route;
