const Song = require("../../models/song.model");

//import model
const User = require("../../models/user.model");
const SongFavorite = require("../../models/songFavorite.model");

//mongoose
const mongoose = require("mongoose");

//song favorite by the particular user
exports.favoriteSongByUser = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.songId) {
      return res.status(200).json({ status: false, message: "userId and songId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const songId = new mongoose.Types.ObjectId(req.query.songId);

    const [user, song, alreadyFavoriteSong] = await Promise.all([
      User.findById(userId),
      Song.findById(songId),
      SongFavorite.findOne({
        userId: userId,
        songId: songId,
      }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!song) {
      return res.status(200).json({ status: false, message: "song does not found!" });
    }

    if (alreadyFavoriteSong) {
      await SongFavorite.deleteOne({
        userId: user._id,
        songId: song._id,
      });

      return res.status(200).json({
        status: true,
        message: "The user has removed the song from their favorites list.",
        songIsFavorite: false,
      });
    } else {
      console.log("else");

      const songFavorite = new SongFavorite();
      songFavorite.userId = user._id;
      songFavorite.songId = song._id;
      await songFavorite.save();

      return res.status(200).json({
        status: true,
        message: "The user has added the song to their favorites.",
        songIsFavorite: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all songs when upload video by the user
exports.getSongsByUser = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, songs] = await Promise.all([
      User.findOne({ _id: userId }),
      Song.aggregate([
        {
          $lookup: {
            from: "songcategories",
            localField: "songCategoryId",
            foreignField: "_id",
            as: "songCategory",
          },
        },
        {
          $unwind: {
            path: "$songCategory",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "songfavorites",
            let: { songId: "$_id", userId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$songId", "$$songId"] }, { $eq: ["$userId", "$$userId"] }],
                  },
                },
              },
            ],
            as: "isFavorite",
          },
        },
        {
          $project: {
            singerName: 1,
            songTitle: 1,
            songTime: 1,
            songLink: 1,
            songImage: 1,
            createdAt: 1,
            songCategoryName: "$songCategory.name",
            songCategoryImage: "$songCategory.image",
            isFavorite: { $cond: { if: { $gt: [{ $size: "$isFavorite" }, 0] }, then: true, else: false } },
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Retrieve the list of songs.", songs: songs });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all favorite songs when upload video by the user (favorite by particular user)
exports.getFavoriteSongs = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, songs] = await Promise.all([
      User.findOne({ _id: userId }),

      SongFavorite.find({ userId: userId })
        .populate({
          path: "songId",
          select: "singerName songTitle songTime songImage songLink",
          populate: { path: "songCategoryId", select: "name" },
        })
        .sort({ createdAt: -1 }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Retrieve all songs that the user has favorited.", songs: songs });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//search songs by thse user
exports.searchSongs = async (req, res) => {
  try {
    if (!req.query.searchString || !req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const searchString = req.query.searchString.trim();

    const userPromise = User.findOne({ _id: userId });
    const searchPromise = Song.aggregate([
      {
        $match: {
          $or: [{ songTitle: { $regex: searchString, $options: "i" } }, { singerName: { $regex: searchString, $options: "i" } }],
        },
      },
      {
        $lookup: {
          from: "songcategories",
          localField: "songCategoryId",
          foreignField: "_id",
          as: "songCategory",
        },
      },
      {
        $unwind: {
          path: "$songCategory",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "songfavorites",
          let: { songId: "$_id", userId: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$songId", "$$songId"] }, { $eq: ["$userId", "$$userId"] }],
                },
              },
            },
          ],
          as: "isFavorite",
        },
      },
      {
        $project: {
          singerName: 1,
          songTitle: 1,
          songTime: 1,
          songLink: 1,
          songImage: 1,
          createdAt: 1,
          songCategoryName: "$songCategory.name",
          isFavorite: { $cond: { if: { $gt: [{ $size: "$isFavorite" }, 0] }, then: true, else: false } },
        },
      },
    ]);

    const [user, response] = await Promise.all([userPromise, searchPromise]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Success", searchData: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
