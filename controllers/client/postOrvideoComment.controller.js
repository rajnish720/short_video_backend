const PostOrVideoComment = require("../../models/postOrvideoComment.model");

//import model
const User = require("../../models/user.model");
const Post = require("../../models/post.model");
const Video = require("../../models/video.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Notification = require("../../models/notification.model");

//day.js
const dayjs = require("dayjs");

//mongoose
const mongoose = require("mongoose");

//private key
const admin = require("../../util/privateKey");

//create comment of particular post or video
exports.commentOfPostOrVideo = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.commentText || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (req.query.type === "post") {
      if (!req.query.postId) {
        return res.status(200).json({ status: false, message: "postId must be requried." });
      }

      const userId = new mongoose.Types.ObjectId(req.query.userId);
      const postId = new mongoose.Types.ObjectId(req.query.postId);

      const [user, post, postOrVideoComment] = await Promise.all([
        User.findOne({ _id: userId }).lean(),
        Post.findOne({ _id: postId }).lean(),
        PostOrVideoComment.create({
          userId: userId,
          postId: postId,
          commentText: req.query.commentText.trim(),
        }),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      if (!post) {
        return res.status(200).json({ status: false, message: "post does not found." });
      }

      res.status(200).json({ status: true, message: "Comment passed on post by that user.", postOrVideoComment: postOrVideoComment });

      const postUser = await User.findOne({ _id: post?.userId }).lean();

      // Check if the user has an fcmToken
      if (postUser && postUser.fcmToken && postUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: postUser?.fcmToken,
          notification: {
            title: "💬 New Comment Alert! 💬",
            body: "Hey there! A user has just commented on your post. Check it out now!",
          },
          data: {
            type: "POSTCOMMENT",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            const notification = new Notification();
            notification.userId = user._id; // login userId i.e., to whom notification is sent
            notification.otherUserId = postUser._id;
            notification.title = "💬 New Comment Alert! 💬";
            notification.message = "Hey there! A user has just commented on your post. Check it out now!";
            notification.image = post.mainPostImage;
            notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            await notification.save();
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    } else if (req.query.type === "video") {
      if (!req.query.videoId) {
        return res.status(200).json({ status: false, message: "videoId must be requried." });
      }

      const userId = new mongoose.Types.ObjectId(req.query.userId);
      const videoId = new mongoose.Types.ObjectId(req.query.videoId);

      const [user, video, postOrVideoComment] = await Promise.all([
        User.findOne({ _id: userId }).lean(),
        Video.findOne({ _id: videoId }).lean(),
        PostOrVideoComment.create({
          userId: userId,
          videoId: videoId,
          commentText: req.query.commentText.trim(),
        }),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      if (!video) {
        return res.status(200).json({ status: false, message: "video does not found." });
      }

      res.status(200).json({ status: true, message: "Comment passed on video by that user.", postOrVideoComment: postOrVideoComment });

      const videoUser = await User.findOne({ _id: video.userId }).lean();

      // Check if the user has an fcmToken
      if (videoUser && videoUser.fcmToken && videoUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: videoUser?.fcmToken,
          notification: {
            title: "💬 New Comment Alert! 💬",
            body: "Hey there! A user has commented on your video. Check it out now!",
          },
          data: {
            type: "VIDEOCOMMENT",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            const notification = new Notification();
            notification.userId = user._id; // Logged-in userId to whom the notification is sent
            notification.otherUserId = videoUser._id;
            notification.title = "💬 New Comment Alert! 💬";
            notification.message = "Hey there! A user has commented on your video. Check it out now!";
            notification.image = video.videoImage;
            notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            await notification.save();
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//create like or dislike of particular comment
exports.likeOrDislikeOfComment = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.postOrVideoCommentId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postOrVideoCommentId = new mongoose.Types.ObjectId(req.query.postOrVideoCommentId);

    const [user, postOrVideoComment, alreadylikedPostOrVideoComment] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      PostOrVideoComment.findById(postOrVideoCommentId),
      LikeHistoryOfpostOrvideoComment.findOne({
        userId: userId,
        postOrvideoCommentId: postOrVideoCommentId,
      }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    if (!postOrVideoComment) {
      return res.status(200).json({ status: false, message: "postOrVideoComment does not found." });
    }

    if (alreadylikedPostOrVideoComment) {
      await LikeHistoryOfpostOrvideoComment.deleteOne({
        userId: user._id,
        postOrvideoCommentId: postOrVideoComment._id,
      });

      return res.status(200).json({
        status: true,
        message: "The comment was marked with a dislike by the user.",
        isLike: false,
      });
    } else {
      console.log("else");

      let post, video;
      const likeHistoryOfpostOrvideoComment = new LikeHistoryOfpostOrvideoComment();
      if (postOrVideoComment.postId !== null) {
        post = await Post.findById(postOrVideoComment.postId);
        likeHistoryOfpostOrvideoComment.postId = post?._id;
      } else {
        video = await Video.findById(postOrVideoComment.videoId);
        likeHistoryOfpostOrvideoComment.videoId = video?._id;
      }

      likeHistoryOfpostOrvideoComment.userId = user._id;
      likeHistoryOfpostOrvideoComment.postOrvideoCommentId = postOrVideoComment._id;
      await likeHistoryOfpostOrvideoComment.save();

      return res.status(200).json({
        status: true,
        message: "The comment was marked with a like by the user.",
        isLike: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all comments for particular video or post
exports.getpostOrvideoComments = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (req.query.type === "post") {
      if (!req.query.postId) {
        return res.status(200).json({ status: false, message: "postId must be requried." });
      }

      let now = dayjs();

      const userId = new mongoose.Types.ObjectId(req.query.userId);
      const postId = new mongoose.Types.ObjectId(req.query.postId);

      const [user, post, postOrVideoComment] = await Promise.all([
        User.findOne({ _id: userId }).lean(),
        Post.findOne({ _id: postId }).lean(),
        PostOrVideoComment.aggregate([
          {
            $match: { postId: postId, videoId: null },
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
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideocomments",
              localField: "_id",
              foreignField: "postOrvideoCommentId",
              as: "totalLikes",
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideocomments",
              let: {
                postOrvideoCommentId: "$_id",
                userId: userId,
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$postOrvideoCommentId", "$$postOrvideoCommentId"] }, { $eq: ["$userId", "$$userId"] }],
                    },
                  },
                },
              ],
              as: "likeHistory",
            },
          },
          {
            $project: {
              userId: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              userImage: "$user.image",
              isVerified: "$user.isVerified",
              commentText: 1,
              createdAt: 1,
              totalLikes: { $size: "$totalLikes" },
              isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
              time: {
                $let: {
                  vars: {
                    timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                  },
                  in: {
                    $concat: [
                      {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$timeDiff", 31536000000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 2592000000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 604800000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 86400000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 3600000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 60000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 1000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                            },
                            { case: true, then: "Just now" },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          { $sort: { createdAt: -1 } },
        ]),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      if (!post) {
        return res.status(200).json({ status: false, message: "post does not found." });
      }

      return res.status(200).json({ status: true, message: "Comments for particular post.", postOrVideoComment: postOrVideoComment });
    } else if (req.query.type === "video") {
      if (!req.query.videoId) {
        return res.status(200).json({ status: false, message: "videoId must be requried." });
      }

      let now = dayjs();

      const userId = new mongoose.Types.ObjectId(req.query.userId);
      const videoId = new mongoose.Types.ObjectId(req.query.videoId);

      const [user, video, postOrVideoComment] = await Promise.all([
        User.findOne({ _id: userId }).lean(),
        Video.findOne({ _id: videoId }).lean(),
        PostOrVideoComment.aggregate([
          {
            $match: { videoId: videoId, postId: null },
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
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideocomments",
              localField: "_id",
              foreignField: "postOrvideoCommentId",
              as: "totalLikes",
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideocomments",
              let: {
                postOrvideoCommentId: "$_id",
                userId: userId,
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$postOrvideoCommentId", "$$postOrvideoCommentId"] }, { $eq: ["$userId", "$$userId"] }],
                    },
                  },
                },
              ],
              as: "likeHistory",
            },
          },
          {
            $project: {
              userId: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              userImage: "$user.image",
              commentText: 1,
              createdAt: 1,
              totalLikes: { $size: "$totalLikes" },
              isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
              time: {
                $let: {
                  vars: {
                    timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                  },
                  in: {
                    $concat: [
                      {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$timeDiff", 31536000000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 2592000000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 604800000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 86400000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 3600000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 60000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                            },
                            {
                              case: { $gte: ["$$timeDiff", 1000] },
                              then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                            },
                            { case: true, then: "Just now" },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          { $sort: { createdAt: -1 } },
        ]),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      if (!video) {
        return res.status(200).json({ status: false, message: "video does not found." });
      }

      return res.status(200).json({ status: true, message: "Comments for particular video.", postOrVideoComment: postOrVideoComment });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
