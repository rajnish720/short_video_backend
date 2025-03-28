const Post = require("../../models/post.model");

//fs
const fs = require("fs");

//import model
const User = require("../../models/user.model");
const HashTag = require("../../models/hashTag.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Notification = require("../../models/notification.model");
const Report = require("../../models/report.model");

//deleteFiles
const { deleteFiles } = require("../../util/deletefile");

//mongoose
const mongoose = require("mongoose");

//generateUniqueVideoOrPostId
const { generateUniqueVideoOrPostId } = require("../../util/generateUniqueVideoOrPostId");

//upload fake post
exports.uploadfakePost = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (!req.body.caption || !req.body.hashTagId || !req.files) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [uniquePostId, user] = await Promise.all([generateUniqueVideoOrPostId(), User.findOne({ _id: userId, isFake: true })]);

    if (!user) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    const post = new Post();

    post.userId = user._id;
    post.caption = req.body.caption;

    const multipleHashTag = req?.body?.hashTagId.toString().split(",");
    post.hashTagId = multipleHashTag;

    //create history for each hashtag used
    const hashTagPromises = multipleHashTag.map(async (hashTagId) => {
      const hashTag = await HashTag.findById(hashTagId);
      if (hashTag) {
        const hashTagUsageHistory = new HashTagUsageHistory({
          userId: user._id,
          hashTagId: hashTagId,
          postId: post._id,
        });
        await hashTagUsageHistory.save();
      }
    });

    //multiple postImage
    let postImageData = [];
    if (req?.files?.postImage) {
      postImageData = await Promise.all(req?.files?.postImage.map(async (data) => data.path));

      post.mainPostImage = postImageData[0];
      post.postImage = postImageData;
    }

    post.isFake = true;
    post.uniquePostId = uniquePostId;

    await Promise.all([...hashTagPromises, post.save()]);

    const data = await Post.findById(post._id).populate("userId", "name userName image");

    return res.status(200).json({ status: true, message: "Post has been uploaded by the admin.", data: data });
  } catch (error) {
    console.log(error);
    if (req.files) deleteFiles(req.files);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//update fake post
exports.updatefakePost = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.postId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "userId and postId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, fakePostOfUser] = await Promise.all([User.findOne({ _id: userId }), Post.findOne({ _id: postId, userId: userId })]);

    if (!user) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!fakePostOfUser) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "post does not found for this user." });
    }

    if (req?.files?.postImage) {
      var postImageData = [];

      //for delete existing postImage
      if (fakePostOfUser.postImage.length > 0) {
        for (var i = 0; i < fakePostOfUser.postImage.length; i++) {
          const postImage = fakePostOfUser.postImage[i].split("storage");
          if (postImage) {
            if (fs.existsSync("storage" + postImage[1])) {
              fs.unlinkSync("storage" + postImage[1]);
            }
          }
        }
      }

      await req?.files?.postImage.map(async (data) => {
        await postImageData.push(data.path);
      });

      fakePostOfUser.mainPostImage = postImageData[0];
      fakePostOfUser.postImage = postImageData;
    }

    fakePostOfUser.location = req.body.location ? req.body.location : fakePostOfUser.location;
    fakePostOfUser.locationCoordinates.latitude = req.body.latitude ? req.body.latitude : fakePostOfUser.latitude;
    fakePostOfUser.locationCoordinates.longitude = req.body.longitude ? req.body.longitude : fakePostOfUser.longitude;
    fakePostOfUser.caption = req.body.caption ? req.body.caption : fakePostOfUser.caption;
    await fakePostOfUser.save();

    const data = await Post.findById(fakePostOfUser._id).populate("userId", "name userName image");

    return res.status(200).json({ status: true, message: "fake post has been updated by the admin.", data: data });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get real or fake posts
exports.getPosts = async (req, res, next) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.type) {
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

    if (req.query.type === "realPost") {
      const [totalrealPostOfUser, realPostOfUser] = await Promise.all([
        Post.countDocuments({ isFake: false, ...dateFilterQuery }),
        Post.aggregate([
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
              from: "likehistoryofpostorvideos",
              localField: "_id",
              foreignField: "postId",
              as: "likes",
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
              from: "postorvideocomments",
              localField: "_id",
              foreignField: "postId",
              as: "comments",
            },
          },
          {
            $project: {
              caption: 1,
              mainPostImage: 1,
              postImage: 1,
              location: 1,
              shareCount: 1,
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
        message: `Retrive real posts of the users.`,
        total: totalrealPostOfUser,
        data: realPostOfUser,
      });
    } else if (req.query.type === "fakePost") {
      const [totalfakePostOfUser, fakePostOfUser] = await Promise.all([
        Post.countDocuments({ isFake: true, ...dateFilterQuery }),
        Post.aggregate([
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
              foreignField: "postId",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "postorvideocomments",
              localField: "_id",
              foreignField: "postId",
              as: "comments",
            },
          },
          {
            $project: {
              caption: 1,
              mainPostImage: 1,
              postImage: 1,
              shareCount: 1,
              isFake: 1,
              location: 1,
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
        message: `Retrive fake posts of the users.`,
        total: totalfakePostOfUser,
        data: fakePostOfUser,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get particular user's posts
exports.getUserPost = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, totalPostOfUser, posts] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      Post.countDocuments({ userId: userId }),
      Post.aggregate([
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
            foreignField: "postId",
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "postId",
            as: "comments",
          },
        },
        {
          $project: {
            caption: 1,
            mainPostImage: 1,
            postImage: 1,
            shareCount: 1,
            isFake: 1,
            location: 1,
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

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive posts of the particular user.",
      total: totalPostOfUser,
      data: posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get particular post details
exports.getDetailOfPost = async (req, res, next) => {
  try {
    if (!req.query.postId) {
      return res.status(200).json({ status: false, message: "postId must be required." });
    }

    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const post = await Post.findOne({ _id: postId }).lean();
    if (!post) {
      return res.status(200).json({ status: false, message: "Post does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive post's details.",
      data: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete post
exports.deletePost = async (req, res) => {
  try {
    if (!req.query.postId) {
      return res.status(200).json({ status: false, message: "postId must be requried." });
    }

    const postIds = req.query.postId.split(",");

    const posts = await Promise.all(postIds.map((Id) => Post.findById(Id)));
    if (posts.some((post) => !post)) {
      return res.status(200).json({ status: false, message: "No posts found with the provided IDs." });
    }

    res.status(200).json({ status: true, message: "Post has been deleted by the admin." });

    await posts.map(async (post) => {
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
        Report.deleteMany({ postId: post._id }),
        Notification.deleteMany({ $or: [{ otherUserId: post?.userId }, { userId: post?.userId }] }),
        post.deleteOne(),
      ]);
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};
