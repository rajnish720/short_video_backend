const SongCategory = require("../../models/songCategory.model");

//import model
const Song = require("../../models/song.model");
const SongFavorite = require("../../models/songFavorite.model");
const Notification = require("../../models/notification.model");
const Video = require("../../models/video.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideo = require("../../models/likeHistoryOfpostOrvideo.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Report = require("../../models/report.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const WatchHistory = require("../../models/watchHistory.model");

//fs
const fs = require("fs");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//mongoose
const mongoose = require("mongoose");

//create songCategory
exports.create = async (req, res) => {
  try {
    if (!req.body.name || !req.file) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const songCategory = new SongCategory();

    songCategory.name = req.body.name;
    songCategory.image = req?.file?.path;
    await songCategory.save();

    return res.status(200).json({
      status: true,
      message: "SongCategory created by admin!",
      songCategory: songCategory,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//update songCategory
exports.update = async (req, res) => {
  try {
    if (!req.query.songCategoryId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "songCategoryId must be required!!" });
    }

    const songCategory = await SongCategory.findOne({ _id: req.query.songCategoryId });
    if (!songCategory) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "songCategory does not found!!" });
    }

    if (req.file) {
      const image = songCategory?.image.split("storage");
      if (image) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }

      songCategory.image = req?.file?.path;
    }

    songCategory.name = req.body.name ? req.body.name.trim() : songCategory.name;
    await songCategory.save();

    return res.status(200).json({
      status: true,
      message: "SongCategory updated by admin!",
      songCategory: songCategory,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get all songCategory
exports.getSongCategory = async (req, res, next) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [totalSongCategory, songCategory] = await Promise.all([
      SongCategory.countDocuments(),
      SongCategory.find()
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      status: true,
      message: "SongCategories get by admin.",
      totalSongCategory: totalSongCategory,
      songCategory: songCategory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete songCategory
exports.destroy = async (req, res) => {
  try {
    if (!req.query.songCategoryId) {
      return res.status(200).json({ status: false, message: "songCategoryId must be required!" });
    }

    const songCategoryId = new mongoose.Types.ObjectId(req.query.songCategoryId);

    const songCategory = await SongCategory.findById(songCategoryId);
    if (!songCategory) {
      return res.status(200).json({ status: false, message: "No songCategory found with the provided ID." });
    }

    const image = songCategory?.image.split("storage");
    if (image) {
      if (fs.existsSync("storage" + image[1])) {
        fs.unlinkSync("storage" + image[1]);
      }
    }

    res.status(200).json({ status: true, message: "SongCategory has been deleted by admin!" });

    const songsToDelete = await Song.find({ songCategoryId: songCategoryId });

    await songsToDelete.map(async (song) => {
      const songImage = song?.songImage.split("storage");
      if (songImage) {
        if (fs.existsSync("storage" + songImage[1])) {
          fs.unlinkSync("storage" + songImage[1]);
        }
      }

      const songLink = song?.songLink.split("storage");
      if (songLink) {
        if (fs.existsSync("storage" + songLink[1])) {
          fs.unlinkSync("storage" + songLink[1]);
        }
      }

      const videosToDelete = await Video.find({ songId: song?._id });

      await videosToDelete.map(async (video) => {
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
          LikeHistoryOfpostOrvideo.deleteMany({ videoId: video._id }),
          PostOrVideoComment.deleteMany({ videoId: video._id }),
          LikeHistoryOfpostOrvideoComment.deleteMany({ videoId: video._id }),
          WatchHistory.deleteMany({ videoId: video._id }),
          HashTagUsageHistory.deleteMany({ videoId: video._id }),
          Notification.deleteMany({ $or: [{ otherUserId: video?.userId }, { userId: video?.userId }] }),
          Report.deleteMany({ videoId: video._id }),
          Video.deleteOne({ _id: video._id }),
        ]);
      });

      await SongFavorite.deleteMany({ songId: song?._id });
      await song.deleteOne();
    });

    await songCategory.deleteOne();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};
