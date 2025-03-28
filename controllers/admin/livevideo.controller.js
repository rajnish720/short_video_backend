const Livevideo = require("../../models/livevideo.model");

//mongoose
const mongoose = require("mongoose");

//import model
const User = require("../../models/user.model");

//fs
const fs = require("fs");

//deletefile
const { deleteFiles } = require("../../util/deletefile");

//upload live video
exports.uploadLivevideo = async (req, res, next) => {
  try {
    if (!req.body.userId || !req.body.videoTime || !req.files) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const user = await User.findOne({ _id: req.body.userId, isFake: true });
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
      return res.status(200).json({ status: false, message: "Setting does not found!" });
    }

    if (settingJSON.durationOfShorts < parseInt(req.body.videoTime)) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "your duration of Video greater than decided by the admin." });
    }

    const video = new Livevideo();

    video.userId = user._id;
    video.videoTime = req?.body?.videoTime;

    if (req?.files?.videoImage) {
      video.videoImage = req.files.videoImage[0].path;
    }

    if (req?.files?.videoUrl) {
      video.videoUrl = req.files.videoUrl[0].path;
    }

    await video.save();

    const data = await Livevideo.findById(video._id).populate("userId", "name userName image");

    return res.status(200).json({ status: true, message: "Livevideo has been uploaded by the admin.", data: data });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//update live video
exports.updateLivevideo = async (req, res, next) => {
  try {
    if (!req.body.userId || !req.body.videoId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "userId and videoId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.body.userId);
    const videoId = new mongoose.Types.ObjectId(req.body.videoId);

    const [user, livevideo] = await Promise.all([User.findOne({ _id: userId }), Livevideo.findOne({ _id: videoId, userId: userId })]);

    if (!user) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!livevideo) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "video does not found for this user." });
    }

    if (req.files.videoImage) {
      const videoImage = livevideo?.videoImage?.split("storage");
      if (videoImage) {
        if (fs.existsSync("storage" + videoImage[1])) {
          fs.unlinkSync("storage" + videoImage[1]);
        }
      }

      livevideo.videoImage = req.files.videoImage[0].path;
    }

    if (req.files.videoUrl) {
      const videoUrl = livevideo?.videoUrl?.split("storage");
      if (videoUrl) {
        if (fs.existsSync("storage" + videoUrl[1])) {
          fs.unlinkSync("storage" + videoUrl[1]);
        }
      }

      livevideo.videoUrl = req.files.videoUrl[0].path;
    }

    livevideo.videoTime = req.body.videoTime ? req.body.videoTime : livevideo.videoTime;
    await livevideo.save();

    const data = await Livevideo.findById(livevideo._id).populate("userId", "name userName image");

    return res.status(200).json({ status: true, message: "Video has been updated by the admin.", data: data });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get live videos
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

    const [totalLivevideo, livevideos] = await Promise.all([
      Livevideo.countDocuments({ ...dateFilterQuery }),
      Livevideo.aggregate([
        { $match: { ...dateFilterQuery } },
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
          $project: {
            _id: 1,
            isLive: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            createdAt: 1,
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
      message: `Retrive live videos.`,
      total: totalLivevideo,
      data: livevideos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//delete video
exports.deleteVideo = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required." });
    }

    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const livevideo = await Livevideo.findOne({ _id: videoId });
    if (!livevideo) {
      return res.status(200).json({ status: false, message: "video does not found for this user." });
    }

    res.status(200).json({ status: true, message: "Videos have been deleted by the admin." });

    const videoImage = livevideo?.videoImage?.split("storage");
    if (videoImage) {
      if (fs.existsSync("storage" + videoImage[1])) {
        fs.unlinkSync("storage" + videoImage[1]);
      }
    }

    const videoUrl = livevideo?.videoUrl?.split("storage");
    if (videoUrl) {
      if (fs.existsSync("storage" + videoUrl[1])) {
        fs.unlinkSync("storage" + videoUrl[1]);
      }
    }

    await Livevideo.deleteOne({ _id: livevideo._id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//video live or not
exports.isLive = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required." });
    }

    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const livevideo = await Livevideo.findOne({ _id: videoId });
    if (!livevideo) {
      return res.status(200).json({ status: false, message: "video does not found for this user." });
    }

    livevideo.isLive = !livevideo.isLive;
    await livevideo.save();

    return res.status(200).json({
      status: true,
      message: "livevideo has been updated by admin!",
      data: livevideo,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
