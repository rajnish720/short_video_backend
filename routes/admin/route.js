//express
const express = require("express");
const route = express.Router();

//require admin's route.js
const admin = require("./admin.route");
const post = require("./post.route");
const setting = require("./setting.route");
const video = require("./video.route");
const song = require("./song.route");
const songCategory = require("./songCategory.route");
const hashTag = require("./hashTag.route");
const verificationRequest = require("./verificationRequest.route");
const gift = require("./gift.route");
const user = require("./user.route");
const dashboard = require("./dashboard.route");
const report = require("./report.route");
const currency = require("./currency.route");
const history = require("./history.route");
const withdraw = require("./withdraw.route");
const withdrawRequest = require("./withDrawRequest.route");
const coinplan = require("./coinplan.route");
const complaint = require("./complaint.route");
const banner = require("./banner.route");
const reportReason = require("./reportReason.route");
const login = require("./login.route");
const livevideo = require("./livevideo.route");

//exports admin's route.js
route.use("/admin", admin);
route.use("/post", post);
route.use("/setting", setting);
route.use("/video", video);
route.use("/song", song);
route.use("/songCategory", songCategory);
route.use("/hashTag", hashTag);
route.use("/verificationRequest", verificationRequest);
route.use("/gift", gift);
route.use("/user", user);
route.use("/dashboard", dashboard);
route.use("/report", report);
route.use("/currency", currency);
route.use("/history", history);
route.use("/withdraw", withdraw);
route.use("/withdrawRequest", withdrawRequest);
route.use("/coinplan", coinplan);
route.use("/complaint", complaint);
route.use("/banner", banner);
route.use("/reportReason", reportReason);
route.use("/login", login);
route.use("/livevideo", livevideo);

module.exports = route;
