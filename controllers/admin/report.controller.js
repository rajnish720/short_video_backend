const Report = require("../../models/report.model");

//fs
const fs = require("fs");

//import model
const Notification = require("../../models/notification.model");
const Video = require("../../models/video.model");
const Post = require("../../models/post.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const WatchHistory = require("../../models/watchHistory.model");

//get type wise all reports
exports.getReports = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.type || !req.query.status || !req.query.start || !req.query.limit) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    let statusQuery = {};
    if (req.query.status !== "All") {
      statusQuery.status = parseInt(req.query.status);
    }

    if (req.query.type == 1) {
      const [totalReports, report] = await Promise.all([
        Report.countDocuments({ ...statusQuery, ...dateFilterQuery, type: 1 }),
        Report.aggregate([
          {
            $match: { ...statusQuery, ...dateFilterQuery, type: 1 },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "user.isBlock": false,
            },
          },
          {
            $lookup: {
              from: "videos",
              localField: "videoId",
              foreignField: "_id",
              as: "video",
            },
          },
          {
            $unwind: {
              path: "$video",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              type: 1,
              status: 1,
              reportReason: 1,
              createdAt: 1,

              userName: "$user.userName",
              name: "$user.name",
              image: "$user.image",
              uniqueId: "$user.uniqueId",

              videoImage: "$video.videoImage",
              videoUrl: "$video.videoUrl",
              uniqueVideoId: "$video.uniqueVideoId",
              videoId: "$video._id",
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit }, //how many records you want to skip
          { $limit: limit },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "get reports of the video by the admin.",
        total: totalReports,
        data: report.length > 0 ? report : [],
      });
    } else if (req.query.type == 2) {
      const [totalReports, report] = await Promise.all([
        Report.countDocuments({ ...statusQuery, ...dateFilterQuery, type: 2 }),
        Report.aggregate([
          {
            $match: { ...statusQuery, ...dateFilterQuery, type: 2 },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "user.isBlock": false,
            },
          },
          {
            $lookup: {
              from: "posts",
              localField: "postId",
              foreignField: "_id",
              as: "post",
            },
          },
          {
            $unwind: {
              path: "$post",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              type: 1,
              status: 1,
              reportReason: 1,
              createdAt: 1,

              userName: "$user.userName",
              name: "$user.name",
              image: "$user.image",
              uniqueId: "$user.uniqueId",

              postImage: "$post.mainPostImage",
              uniquePostId: "$post.uniquePostId",
              postId: "$post._id",
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit }, //how many records you want to skip
          { $limit: limit },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "get reports of the post by the admin.",
        total: totalReports,
        data: report.length > 0 ? report : [],
      });
    } else if (req.query.type == 3) {
      const [totalReports, report] = await Promise.all([
        Report.countDocuments({ ...statusQuery, ...dateFilterQuery, type: 3 }),
        Report.aggregate([
          {
            $match: { ...statusQuery, ...dateFilterQuery, type: 3 },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "user.isBlock": false,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "toUserId",
              foreignField: "_id",
              as: "toUser",
            },
          },
          {
            $unwind: {
              path: "$toUser",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              type: 1,
              status: 1,
              reportReason: 1,
              createdAt: 1,

              userName: "$user.userName",
              name: "$user.name",
              image: "$user.image",
              uniqueId: "$user.uniqueId",

              toUserUserName: "$toUser.userName",
              toUserName: "$toUser.name",
              toUserImage: "$toUser.image",
              toUserUniqueId: "$toUser.uniqueId",
              toUserId: "$toUser._id",
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit }, //how many records you want to skip
          { $limit: limit },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "get reports of the user by the admin.",
        total: totalReports,
        data: report.length > 0 ? report : [],
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//report solved
exports.solveReport = async (req, res) => {
  try {
    if (!req.query.reportId) {
      return res.status(200).json({ status: false, message: "reportId must be requried." });
    }

    const report = await Report.findById(req.query.reportId);
    if (!report) {
      return res.status(200).json({ status: false, message: "report does not found." });
    }

    if (report.status == 2) {
      return res.status(200).json({ status: false, message: "report already solved by the admin." });
    }

    report.status = 2;
    await report.save();

    return res.status(200).send({
      status: true,
      message: "report has been solved by the admin.",
      data: report,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//delete report
exports.deleteReport = async (req, res) => {
  try {
    if (!req.query.reportId) {
      return res.status(200).json({ status: false, message: "reportId must be requried." });
    }

    const report = await Report.findById(req.query.reportId);
    if (!report) {
      return res.status(200).json({ status: false, message: "report does not found." });
    }

    res.status(200).json({
      status: true,
      message: "Report has been deleted by the admin.",
    });

    if (report.videoId !== null) {
      const video = await Video.findById(report.videoId);

      const videoImage = video?.videoImage?.split("storage");
      if (videoImage) {
        if (fs.existsSync("storage" + videoImage[1])) {
          fs.unlinkSync("storage" + videoImage[1]);
        }
      }

      const videoUrl = video?.videoUrl?.split("storage");
      if (videoUrl) {
        if (fs.existsSync("storage" + videoUrl[1])) {
          fs.unlinkSync("storage" + videoUrl[1]);
        }
      }

      await Promise.all([
        LikeHistoryOfPostOrVideo.deleteMany({ videoId: video._id }),
        PostOrVideoComment.deleteMany({ videoId: video._id }),
        LikeHistoryOfpostOrvideoComment.deleteMany(),
        WatchHistory.deleteMany({ videoId: video._id }),
        HashTagUsageHistory.deleteMany({ videoId: video._id }),
        Notification.deleteMany({ otherUserId: video?.userId }),
      ]);

      await Video.deleteOne({ _id: video._id });
    }

    if (report.postId !== null) {
      const post = await Post.findById(report?.postId);

      if (post?.mainPostImage) {
        const mainPostImage = post?.mainPostImage?.split("storage");
        if (mainPostImage) {
          if (fs.existsSync("storage" + mainPostImage[1])) {
            fs.unlinkSync("storage" + mainPostImage[1]);
          }
        }
      }

      if (post?.postImage?.length > 0) {
        await post?.postImage.map(async (image) => {
          const postImage = image.split("storage");
          if (postImage) {
            if (fs.existsSync("storage" + postImage[1])) {
              fs.unlinkSync("storage" + postImage[1]);
            }
          }
        });
      }

      await Promise.all([
        LikeHistoryOfPostOrVideo.deleteMany({ postId: post._id }),
        PostOrVideoComment.deleteMany({ postId: post._id }),
        LikeHistoryOfpostOrvideoComment.deleteMany({ postId: post._id }),
        HashTagUsageHistory.deleteMany({ postId: post._id }),
        Notification.deleteMany({ $or: [{ otherUserId: post?.userId }, { userId: post?.userId }] }),
      ]);

      await Post.deleteOne({ _id: post?._id });
    }

    await report.deleteOne();
  } catch {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
