const HashTag = require("../../models/hashTag.model");

//deletefile
const { deleteFiles } = require("../../util/deletefile");

//import model
const Video = require("../../models/video.model");
const Post = require("../../models/post.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");

//fs
const fs = require("fs");

//mongoose
const mongoose = require("mongoose");

//craete hashTag
exports.create = async (req, res) => {
  try {
    if (!req.files || !req.body.hashTag) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const hashTag = req.body.hashTag.trim();

    const alreadyExist = await HashTag.findOne({ hashTag: hashTag }).lean();

    if (alreadyExist) {
      return res.status(200).json({
        status: false,
        message: "HashTag already exist.",
      });
    } else {
      const newHashTag = new HashTag();
      newHashTag.hashTag = hashTag;
      newHashTag.hashTagIcon = req?.files?.hashTagIcon[0].path;
      newHashTag.hashTagBanner = req?.files?.hashTagBanner[0].path;
      await newHashTag.save();

      return res.status(200).json({
        status: true,
        message: "HashTag created by the admin.",
        data: newHashTag,
      });
    }
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//update hashTag
exports.update = async (req, res) => {
  try {
    if (!req.query.hashTagId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "hashTagId must be requried." });
    }

    const hashTagId = new mongoose.Types.ObjectId(req.query.hashTagId);

    const hashTag = await HashTag.findById(hashTagId);
    if (!hashTag) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "hashTag does not found." });
    }

    if (req?.files?.hashTagBanner) {
      const hashTagBanner = hashTag?.hashTagBanner.split("storage");
      if (hashTagBanner) {
        if (fs.existsSync("storage" + hashTagBanner[1])) {
          fs.unlinkSync("storage" + hashTagBanner[1]);
        }
      }

      hashTag.hashTagBanner = req.files ? req?.files?.hashTagBanner[0].path : hashTag.hashTagBanner;
    }

    if (req.files.hashTagIcon) {
      const hashTagIcon = hashTag?.hashTagIcon.split("storage");
      if (hashTagIcon) {
        if (fs.existsSync("storage" + hashTagIcon[1])) {
          fs.unlinkSync("storage" + hashTagIcon[1]);
        }
      }

      hashTag.hashTagIcon = req.files ? req.files.hashTagIcon[0].path : hashTag.hashTagIcon;
    }

    hashTag.hashTag = req.body.hashTag ? req.body.hashTag : hashTag.hashTag;
    await hashTag.save();

    return res.status(200).json({ status: true, message: "HashTag has been updated by the admin.", data: hashTag });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get hashTag
exports.getbyadmin = async (req, res, next) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [totalHashTag, hashTag] = await Promise.all([
      HashTag.countDocuments(),

      HashTag.aggregate([
        {
          $lookup: {
            from: "hashtagusagehistories",
            localField: "_id",
            foreignField: "hashTagId",
            as: "usageHistory",
          },
        },
        {
          $addFields: {
            usageCount: { $size: "$usageHistory" },
          },
        },
        {
          $project: {
            usageHistory: 0,
          },
        },
        {
          $sort: { usageCount: -1 },
        },
        {
          $skip: (start - 1) * limit,
        },
        {
          $limit: limit,
        },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Hashtag get by the admin.",
      total: totalHashTag,
      data: hashTag,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete hashTag
exports.delete = async (req, res, next) => {
  try {
    if (!req.query.hashTagId) {
      return res.status(200).json({ status: false, message: "hashTagId must be requried." });
    }

    const hashTagId = new mongoose.Types.ObjectId(req.query.hashTagId);

    const hashTag = await HashTag.findById(hashTagId);
    if (!hashTag) {
      return res.status(200).json({ status: false, message: "hashTag does not found." });
    }

    const hashTagBanner = hashTag?.hashTagBanner?.split("storage");
    if (hashTagBanner) {
      if (fs.existsSync("storage" + hashTagBanner[1])) {
        fs.unlinkSync("storage" + hashTagBanner[1]);
      }
    }

    const hashTagIcon = hashTag?.hashTagIcon?.split("storage");
    if (hashTagIcon) {
      if (fs.existsSync("storage" + hashTagIcon[1])) {
        fs.unlinkSync("storage" + hashTagIcon[1]);
      }
    }

    res.status(200).json({ status: true, message: "HashTag has been deleted by the admin." });

    const [updatedVideos, updatedPosts, deleteHistory] = await Promise.all([
      Video.updateMany({ hashTagId: { $in: [hashTag._id] } }, { $pull: { hashTagId: hashTag._id } }),
      Post.updateMany({ hashTagId: { $in: [hashTag._id] } }, { $pull: { hashTagId: hashTag._id } }),
      HashTagUsageHistory.deleteMany({ hashTagId: hashTag._id }),
    ]);

    await hashTag.deleteOne();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all hashTag for deopdown
exports.getHashtag = async (req, res, next) => {
  try {
    const hashTag = await HashTag.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "Retrive HashTag.",
      data: hashTag,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
