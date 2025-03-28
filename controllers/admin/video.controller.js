const Video = require("../../models/video.model");

//fs
const fs = require("fs");

//import model
const User = require("../../models/user.model");
const Song = require("../../models/song.model");
const HashTag = require("../../models/hashTag.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const Report = require("../../models/report.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const WatchHistory = require("../../models/watchHistory.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Notification = require("../../models/notification.model");

//deleteFiles
const { deleteFiles } = require("../../util/deletefile");

//generateUniqueVideoOrPostId
const { generateUniqueVideoOrPostId } = require("../../util/generateUniqueVideoOrPostId");

//mongoose
const mongoose = require("mongoose");

//upload fake video
exports.uploadfakevideo = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (!req.body.caption || !req.body.videoTime || !req.body.hashTagId || !req.files) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [uniqueVideoId, user, song] = await Promise.all([generateUniqueVideoOrPostId(), User.findOne({ _id: req.query.userId, isFake: true }), Song.findById(req?.body?.songId)]);

    if (!user) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!settingJSON) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "setting does not found!" });
    }

    if (settingJSON.durationOfShorts < parseInt(req.body.videoTime)) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "your duration of Video greater than decided by the admin." });
    }

    if (req?.body?.songId) {
      if (!song) {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "Song does not found." });
      }
    }

    const video = new Video();

    video.userId = user._id;
    video.caption = req?.body?.caption;
    video.videoTime = req?.body?.videoTime;
    video.songId = req?.body?.songId ? song?._id : video?.songId;

    const multipleHashTag = req?.body?.hashTagId.toString().split(",");
    video.hashTagId = multipleHashTag;

    //create history for each hashtag used
    const hashTagPromises = multipleHashTag.map(async (hashTagId) => {
      const hashTag = await HashTag.findById(hashTagId);
      if (hashTag) {
        const hashTagUsageHistory = new HashTagUsageHistory({
          userId: user._id,
          hashTagId: hashTagId,
          videoId: video._id,
        });
        await hashTagUsageHistory.save();
      }
    });

    if (req?.files?.videoImage) {
      video.videoImage = req.files.videoImage[0].path;
    }

    if (req?.files?.videoUrl) {
      video.videoUrl = req.files.videoUrl[0].path;
    }

    video.isFake = true;
    video.uniqueVideoId = uniqueVideoId;

    await Promise.all([...hashTagPromises, video.save()]);

    const data = await Video.findById(video._id).populate("userId", "name userName image");

    return res.status(200).json({ status: true, message: "Video has been uploaded by the admin.", data: data });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//update fake video
exports.updatefakevideo = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "userId and videoId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, fakeVideoOfUser, song] = await Promise.all([User.findOne({ _id: userId }), Video.findOne({ _id: videoId, userId: userId }), Song.findById(req?.body?.songId)]);

    if (!user) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!fakeVideoOfUser) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "video does not found for this user." });
    }

    if (req?.body?.songId) {
      if (!song) {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "Song does not found." });
      }
    }

    if (req.files.videoImage) {
      const videoImage = fakeVideoOfUser?.videoImage.split("storage");
      if (videoImage) {
        if (fs.existsSync("storage" + videoImage[1])) {
          fs.unlinkSync("storage" + videoImage[1]);
        }
      }

      fakeVideoOfUser.videoImage = req.files.videoImage[0].path;
    }

    if (req.files.videoUrl) {
      const videoUrl = fakeVideoOfUser?.videoUrl.split("storage");
      if (videoUrl) {
        if (fs.existsSync("storage" + videoUrl[1])) {
          fs.unlinkSync("storage" + videoUrl[1]);
        }
      }

      fakeVideoOfUser.videoUrl = req.files.videoUrl[0].path;
    }

    fakeVideoOfUser.songId = req?.body?.songId ? song._id : fakeVideoOfUser.songId;
    fakeVideoOfUser.videoTime = req.body.videoTime ? req.body.videoTime : fakeVideoOfUser.videoTime;
    fakeVideoOfUser.caption = req.body.caption ? req.body.caption : fakeVideoOfUser.caption;
    await fakeVideoOfUser.save();

    const data = await Video.findById(fakeVideoOfUser._id).populate("userId", "name userName image");

    return res.status(200).json({ status: true, message: "Video has been updated by the admin.", fakeVideoOfUser: data });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get real or fake videos
exports.getVideos = async (req, res, next) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
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

    if (req.query.type === "realVideo") {
      const [totalRealVideoOfUser, realVideoOfUser] = await Promise.all([
        Video.countDocuments({ isFake: false, ...dateFilterQuery }),
        Video.aggregate([
          { $match: { isFake: false, ...dateFilterQuery } },
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
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "hashtags",
              localField: "hashTagId",
              foreignField: "_id",
              as: "hashTags",
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideos",
              localField: "_id",
              foreignField: "videoId",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "postorvideocomments",
              localField: "_id",
              foreignField: "videoId",
              as: "comments",
            },
          },
          {
            $project: {
              caption: 1,
              videoTime: 1,
              videoUrl: 1,
              videoImage: 1,
              isFake: 1,
              createdAt: 1,
              totalLikes: { $size: "$likes" },
              totalComments: { $size: "$comments" },
              userId: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              userImage: "$user.image",
              hashTags: "$hashTags",
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit }, //how many records you want to skip
          { $limit: limit },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: `Retrive real videos of the users.`,
        totalVideo: totalRealVideoOfUser,
        videos: realVideoOfUser,
      });
    } else if (req.query.type === "fakeVideo") {
      const [totalFakeVideoOfUser, fakeVideoOfUser] = await Promise.all([
        Video.countDocuments({ isFake: true, ...dateFilterQuery }),
        Video.aggregate([
          { $match: { isFake: true, ...dateFilterQuery } },
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
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "hashtags",
              localField: "hashTagId",
              foreignField: "_id",
              as: "hashTags",
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideos",
              localField: "_id",
              foreignField: "videoId",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "postorvideocomments",
              localField: "_id",
              foreignField: "videoId",
              as: "comments",
            },
          },
          {
            $project: {
              caption: 1,
              videoTime: 1,
              videoUrl: 1,
              videoImage: 1,
              isFake: 1,
              createdAt: 1,
              totalLikes: { $size: "$likes" },
              totalComments: { $size: "$comments" },
              userId: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              userImage: "$user.image",
              hashTags: "$hashTags",
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit }, //how many records you want to skip
          { $limit: limit },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: `Retrive fake videos of the users.`,
        totalVideo: totalFakeVideoOfUser,
        videos: fakeVideoOfUser,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get particular user's videos
exports.getVideosOfUser = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [totalVideoOfUser, realVideoOfUser] = await Promise.all([
      Video.countDocuments({ userId: userId }),
      Video.aggregate([
        { $match: { userId: userId } },
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
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "comments",
          },
        },
        {
          $project: {
            caption: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            isFake: 1,
            createdAt: 1,
            totalLikes: { $size: "$likes" },
            totalComments: { $size: "$comments" },
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit }, //how many records you want to skip
        { $limit: limit },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: `Retrive videos of the users.`,
      total: totalVideoOfUser,
      data: realVideoOfUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get particular video details
exports.getDetailOfVideo = async (req, res, next) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required." });
    }

    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const video = await Video.findOne({ _id: videoId }).lean();
    if (!video) {
      return res.status(200).json({ status: false, message: "Video does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive video's details.",
      data: video,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete video multiple or single
exports.deleteVideo = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required." });
    }

    const videoIds = req.query.videoId.split(",");

    const videos = await Promise.all(videoIds.map((Id) => Video.findById(Id)));
    if (videos.some((video) => !video)) {
      return res.status(200).json({ status: false, message: "No videos found with the provided IDs." });
    }

    res.status(200).json({ status: true, message: "Videos have been deleted by the admin." });

    await videos.map(async (video) => {
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
        Report.deleteMany({ videoId: video._id }),
        Notification.deleteMany({ otherUserId: video?.userId }),
        Video.deleteOne({ _id: video._id }),
      ]);
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
