const Report = require("../../models/report.model");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");
const Post = require("../../models/post.model");
const ReportReason = require("../../models/reportReason.model");

//mongoose
const mongoose = require("mongoose");

//report made by particular user
exports.reportByUser = async (req, res) => {
  try {
    if (!req.query.reportReason || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);
    const toUserId = new mongoose.Types.ObjectId(req.query.toUserId);
    const reportReason = req.query.reportReason?.trim();

    let existingReport;
    const [user, video, post, toUser] = await Promise.all([User.findOne({ _id: userId }), Video.findOne({ _id: videoId }), Post.findOne({ _id: postId }), User.findOne({ _id: toUserId })]);

    if (req.query.type === "video" && (!req.query.videoId || !req.query.userId)) {
      return res.status(200).json({ status: false, message: "videoId and userId must be requried report to the video." });
    }

    if (req.query.type === "post" && (!req.query.postId || !req.query.userId)) {
      return res.status(200).json({ status: false, message: "postId and userId must be requried report to the post." });
    }

    if (req.query.type === "user" && (!req.query.toUserId || !req.query.userId)) {
      return res.status(200).json({ status: false, message: "toUserId and userId must be requried report to the user." });
    }

    if (req.query.videoId) {
      if (!video) {
        return res.status(200).json({ status: false, message: "video does not found!" });
      }

      if (!user) {
        return res.status(200).json({ status: false, message: "user does not found!" });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by admin!" });
      }

      existingReport = await Report.findOne({
        videoId: video._id,
        userId: user._id,
        type: 1,
      });
    }

    if (req.query.postId) {
      if (!post) {
        return res.status(200).json({ status: false, message: "post does not found!" });
      }

      if (!user) {
        return res.status(200).json({ status: false, message: "user does not found!" });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by admin!" });
      }

      existingReport = await Report.findOne({
        postId: post._id,
        userId: user._id,
        type: 2,
      });
    }

    if (req.query.toUserId) {
      if (!toUser) {
        return res.status(200).json({ status: false, message: "toUser does not found!" });
      }

      if (toUser.isBlock) {
        return res.status(200).json({ status: false, message: "toUser are blocked by admin!" });
      }

      existingReport = await Report.findOne({
        fromUserId: user._id,
        toUserId: toUser._id,
        type: 3,
      });
    }

    if (existingReport) {
      return res.status(200).json({
        status: true,
        message: `A report has been already submitted by ${user?.name}.`,
      });
    } else {
      const report = new Report();

      if (req.query.videoId) {
        report.videoId = video._id;
        report.type = 1;
      }

      if (req.query.postId) {
        report.postId = post._id;
        report.type = 2;
      }

      if (req.query.toUserId) {
        report.toUserId = toUserId._id;
        report.type = 3;
      }

      report.reportReason = reportReason;
      report.userId = user._id;
      await report.save();

      return res.status(200).json({
        status: true,
        message: `A report has been submitted by ${user?.name}.`,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//when report by the user get reportReason
exports.getReportReason = async (req, res) => {
  try {
    const reportReason = await ReportReason.find();

    return res.status(200).json({
      status: true,
      message: "Retrive reportReason Successfully",
      data: reportReason,
    });
  } catch {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};
