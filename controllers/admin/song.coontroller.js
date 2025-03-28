const Song = require("../../models/song.model");

//fs
const fs = require("fs");

//import model
const SongFavorite = require("../../models/songFavorite.model");
const SongCategory = require("../../models/songCategory.model");
const Notification = require("../../models/notification.model");
const Video = require("../../models/video.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideo = require("../../models/likeHistoryOfpostOrvideo.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Report = require("../../models/report.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const WatchHistory = require("../../models/watchHistory.model");

//deleteFiles
const { deleteFiles } = require("../../util/deletefile");

//create song
exports.createSong = async (req, res) => {
  try {
    if (!req.body.singerName || !req.body.songTitle || !req.body.songTime || !req.body.songCategoryId || !req.files) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const songCategory = await SongCategory.findById(req.body.songCategoryId);
    if (!songCategory) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "songCategory does not found!" });
    }

    const song = new Song();

    song.singerName = req.body.singerName;
    song.songTitle = req.body.songTitle;
    song.songTime = req.body.songTime; //always be in seconds
    song.songImage = req.files.songImage[0].path;
    song.songLink = req.files.songLink[0].path;
    song.songCategoryId = songCategory._id;
    await song.save();

    const data = await Song.findById(song._id).populate("songCategoryId", "name image");

    return res.status(200).json({
      status: true,
      message: "Song added by admin.",
      data: data,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//update song by admin
exports.updateSong = async (req, res) => {
  try {
    if (!req.query.songId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const [song, songCategory] = await Promise.all([Song.findById(req.query.songId), req.body.songCategoryId ? SongCategory.findById(req.body.songCategoryId) : Promise.resolve(null)]);

    if (!song) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "song does not found!" });
    }

    if (!songCategory) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "songCategory does not found!" });
    }

    song.songCategoryId = req.body.songCategoryId ? songCategory._id : song.songCategoryId;
    song.singerName = req.body.singerName ? req.body.singerName : song.singerName;
    song.songTitle = req.body.songTitle ? req.body.songTitle : song.songTitle;
    song.songTime = req.body.songTime ? req.body.songTime : song.songTime;

    if (req?.files?.songImage) {
      const songImage = song?.songImage.split("storage");
      if (songImage) {
        if (fs.existsSync("storage" + songImage[1])) {
          fs.unlinkSync("storage" + songImage[1]);
        }
      }

      song.songImage = req?.files?.songImage[0].path;
    }

    if (req?.files?.songLink) {
      const songLink = song?.songLink.split("storage");
      if (songLink) {
        if (fs.existsSync("storage" + songLink[1])) {
          fs.unlinkSync("storage" + songLink[1]);
        }
      }

      song.songLink = req?.files?.songLink[0].path;
    }

    await song.save();

    const data = await Song.findById(song._id).populate("songCategoryId", "name image");

    return res.status(200).json({
      status: true,
      message: "Song updated by admin.",
      data: data,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get all songs
exports.getSongs = async (req, res, next) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
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

    const [totalSong, song] = await Promise.all([
      Song.countDocuments(dateFilterQuery),
      Song.find(dateFilterQuery)
        .populate("songCategoryId", "name image")
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({ status: true, message: "Retrive Songs for the admin.", total: totalSong, data: song });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete song by admin (multiple or single)
exports.deletesong = async (req, res) => {
  try {
    if (!req.query.songId) {
      return res.status(200).json({ status: false, message: "songId must be required." });
    }

    const songIds = req.query.songId.split(",");

    const songs = await Promise.all(songIds.map((Id) => Song.findById(Id)));
    if (songs.some((song) => !song)) {
      return res.status(200).json({ status: false, message: "No songs found with the provided IDs." });
    }

    res.status(200).json({ status: true, message: "Song has been deleted by the admin." });

    await songs.map(async (song) => {
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
