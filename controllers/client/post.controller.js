const Post = require("../../models/post.model");

//fs
const fs = require("fs");

//mongoose
const mongoose = require("mongoose");

//import model
const User = require("../../models/user.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const HashTag = require("../../models/hashTag.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const Report = require("../../models/report.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Notification = require("../../models/notification.model");

//deleteFiles
const { deleteFiles } = require("../../util/deletefile");

//generateUniqueVideoOrPostId
const { generateUniqueVideoOrPostId } = require("../../util/generateUniqueVideoOrPostId");

//day.js
const dayjs = require("dayjs");

//private key
const admin = require("../../util/privateKey");

//upload post by particular user
exports.uploadPost = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (!req.files) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [uniquePostId, user] = await Promise.all([generateUniqueVideoOrPostId(), User.findOne({ _id: req.query.userId, isFake: false })]);

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
    post.caption = req?.body?.caption ? req.body.caption : "";

    if (req?.body?.hashTagId) {
      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      post.hashTagId = multipleHashTag;

      //create history for each hashtag used
      await multipleHashTag.map(async (hashTagId) => {
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
    }

    //multiple postImage
    let postImageData = [];
    if (req?.files?.postImage) {
      postImageData = await Promise.all(req?.files?.postImage.map(async (data) => data.path));

      post.mainPostImage = postImageData[0];
      post.postImage = postImageData;
    }

    post.uniquePostId = uniquePostId;
    await post.save();

    return res.status(200).json({
      status: true,
      message: "Post has been uploaded by the user.",
      post: post,
    });
  } catch (error) {
    console.log(error);
    if (req.files) deleteFiles(req.files);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error",
    });
  }
};

//update post by particular user
exports.updatePostByUser = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.postId) {
      return res.status(200).json({ status: false, message: "userId and postId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, postOfUser] = await Promise.all([User.findOne({ _id: userId }), Post.findOne({ _id: postId, userId: userId })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!postOfUser) {
      return res.status(200).json({ status: false, message: "post does not found for this user." });
    }

    if (req?.body?.hashTagId) {
      const existingHistory = await HashTagUsageHistory.find({ userId: user._id, postId: postOfUser._id });

      if (existingHistory.length > 0) {
        console.log("Check if a history record already exists for the user and post");

        await HashTagUsageHistory.deleteMany({ userId: user._id, postId: postOfUser._id });
      }

      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      postOfUser.hashTagId = multipleHashTag.length > 0 ? multipleHashTag : [];

      await Promise.all(
        multipleHashTag.map(async (hashTagId) => {
          const hashTag = await HashTag.findById(hashTagId);

          if (hashTag) {
            console.log("Create a new history record if it doesn't exist");

            const hashTagUsageHistory = new HashTagUsageHistory({
              userId: user._id,
              postId: postOfUser._id,
              hashTagId: hashTagId,
            });
            await hashTagUsageHistory.save();
          }
        })
      );
    }

    postOfUser.location = req.body.location ? req.body.location : postOfUser.location;
    postOfUser.locationCoordinates.latitude = req.body.latitude ? req.body.latitude : postOfUser.latitude;
    postOfUser.locationCoordinates.longitude = req.body.longitude ? req.body.longitude : postOfUser.longitude;
    postOfUser.caption = req.body.caption ? req.body.caption : postOfUser.caption;
    await postOfUser.save();

    return res.status(200).json({ status: true, message: "Post has been updated.", data: postOfUser });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//if isFakeData on then real+fake posts otherwise fake posts
exports.getAllPosts = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    let now = dayjs();

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const userId = new mongoose.Types.ObjectId(req.query.userId);

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (req.query.postId) {
      const postId = new mongoose.Types.ObjectId(req.query.postId);

      const [user, post] = await Promise.all([User.findOne({ _id: userId }), Post.findById(postId)]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      if (!post) {
        return res.status(200).json({ status: false, message: "No post found with the provided ID." });
      }

      const data = [
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
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "postId",
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "postId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { postId: "$_id", userId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$postId", "$$postId"] }, { $eq: ["$userId", "$$userId"] }],
                  },
                },
              },
            ],
            as: "likeHistory",
          },
        },
        {
          $lookup: {
            from: "followerfollowings",
            let: { postUserId: "$userId", requestingUserId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                  },
                },
              },
            ],
            as: "isFollow",
          },
        },
        {
          $project: {
            caption: 1,
            postImage: 1,
            shareCount: 1,
            isFake: 1,
            createdAt: 1,
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            hashTag: "$hashTag.hashTag",
            isLike: {
              $cond: {
                if: { $gt: [{ $size: "$likeHistory" }, 0] },
                then: true,
                else: false,
              },
            },
            isFollow: {
              $cond: {
                if: { $gt: [{ $size: "$isFollow" }, 0] },
                then: true,
                else: false,
              },
            },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$totalComments" },
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
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 31536000000],
                                    },
                                  },
                                },
                                " years ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 2592000000],
                                    },
                                  },
                                },
                                " months ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 604800000],
                                    },
                                  },
                                },
                                " weeks ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 86400000],
                                    },
                                  },
                                },
                                " days ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 3600000],
                                    },
                                  },
                                },
                                " hours ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 60000] },
                                  },
                                },
                                " minutes ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 1000] },
                                  },
                                },
                                " seconds ago",
                              ],
                            },
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
      ];

      if (settingJSON.isFakeData) {
        const [realPostOfUser, fakePostOfUser] = await Promise.all([Post.aggregate([{ $match: { isFake: false } }, ...data]), Post.aggregate([{ $match: { isFake: true } }, ...data])]);

        let allPosts = [...realPostOfUser, ...fakePostOfUser];

        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());

        const postIndex = allPosts.findIndex((post) => post._id.toString() === postId.toString());

        //If the postId is found, move it to the 0th index
        if (postIndex !== -1) {
          const [movedVideo] = allPosts.splice(postIndex, 1);
          allPosts.unshift(movedVideo);
        }

        const adjustedStart = postIndex !== -1 ? 1 : start;

        allPosts = allPosts.slice(adjustedStart - 1, adjustedStart - 1 + limit);

        return res.status(200).json({
          status: true,
          message: "Retrieve the posts uploaded by users.",
          post: allPosts,
        });
      } else {
        let realPostOfUser = await Post.aggregate([{ $match: { isFake: false } }, ...data]);

        //realPostOfUser.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        realPostOfUser = realPostOfUser.sort(() => 0.5 - Math.random());

        const videoIndex = realPostOfUser.findIndex((short) => short._id.toString() === postId.toString());

        //If the postId is found, move it to the 0th index
        if (videoIndex !== -1) {
          const [movedVideo] = realPostOfUser.splice(videoIndex, 1);
          realPostOfUser.unshift(movedVideo);
        }

        const adjustedStart = videoIndex !== -1 ? 1 : start;

        realPostOfUser = realPostOfUser.slice(adjustedStart - 1, adjustedStart - 1 + limit);

        return res.status(200).json({
          status: true,
          message: "Retrieve the posts uploaded by users.",
          post: realPostOfUser,
        });
      }
    } else {
      const user = await User.findOne({ _id: userId });

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      const data = [
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
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "postId",
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "postId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { postId: "$_id", userId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$postId", "$$postId"] }, { $eq: ["$userId", "$$userId"] }],
                  },
                },
              },
            ],
            as: "likeHistory",
          },
        },
        {
          $lookup: {
            from: "followerfollowings",
            let: { postUserId: "$userId", requestingUserId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                  },
                },
              },
            ],
            as: "isFollow",
          },
        },
        {
          $project: {
            caption: 1,
            postImage: 1,
            shareCount: 1,
            isFake: 1,
            createdAt: 1,
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            hashTag: "$hashTag.hashTag",
            isLike: {
              $cond: {
                if: { $gt: [{ $size: "$likeHistory" }, 0] },
                then: true,
                else: false,
              },
            },
            isFollow: {
              $cond: {
                if: { $gt: [{ $size: "$isFollow" }, 0] },
                then: true,
                else: false,
              },
            },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$totalComments" },
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
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 31536000000],
                                    },
                                  },
                                },
                                " years ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 2592000000],
                                    },
                                  },
                                },
                                " months ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 604800000],
                                    },
                                  },
                                },
                                " weeks ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 86400000],
                                    },
                                  },
                                },
                                " days ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 3600000],
                                    },
                                  },
                                },
                                " hours ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 60000] },
                                  },
                                },
                                " minutes ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 1000] },
                                  },
                                },
                                " seconds ago",
                              ],
                            },
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
      ];

      let allPosts;
      if (settingJSON.isFakeData) {
        const [realPostOfUser, fakePostOfUser] = await Promise.all([Post.aggregate([{ $match: { isFake: false } }, ...data]), Post.aggregate([{ $match: { isFake: true } }, ...data])]);

        allPosts = [...realPostOfUser, ...fakePostOfUser];
        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());
      } else {
        allPosts = await Post.aggregate([{ $match: { isFake: false } }, ...data]);
        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());
      }

      const paginatedPosts = allPosts.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrieve the posts uploaded by users.",
        post: paginatedPosts,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get particular user's posts
exports.postsOfUser = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, posts] = await Promise.all([User.findOne({ _id: userId }).lean(), Post.find({ userId: userId }).select("mainPostImage postImage caption").lean().sort({ createdAt: -1 })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive posts of the particular user.",
      data: posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//delete post of the particular user
exports.deletePostOfUser = async (req, res) => {
  try {
    if (!req.query.postId || !req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "postId and userId must be requried.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, post] = await Promise.all([User.findOne({ _id: userId, isFake: false }), Post.findOne({ _id: postId, userId: userId, isFake: false })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!post) {
      return res.status(200).json({ status: false, message: "post does not found for that user." });
    }

    res.status(200).json({ status: true, message: "Post has been deleted by the user." });

    if (post?.mainPostImage) {
      const mainPostImage = post?.mainPostImage?.split("storage");
      if (mainPostImage) {
        if (fs.existsSync("storage" + mainPostImage[1])) {
          fs.unlinkSync("storage" + mainPostImage[1]);
        }
      }
    }

    if (post?.postImage?.length > 0) {
      for (var i = 0; i < post?.postImage?.length; i++) {
        const postImage = post?.postImage[i]?.split("storage");
        if (postImage) {
          if (fs.existsSync("storage" + postImage[1])) {
            fs.unlinkSync("storage" + postImage[1]);
          }
        }
      }
    }

    await Promise.all([
      LikeHistoryOfPostOrVideo.deleteMany({ postId: post._id }),
      PostOrVideoComment.deleteMany({ postId: post._id }),
      LikeHistoryOfpostOrvideoComment.deleteMany({ postId: post._id }),
      HashTagUsageHistory.deleteMany({ postId: post._id }),
      Report.deleteMany({ postId: post._id }),
      Notification.deleteMany({
        $or: [{ otherUserId: post?.userId }, { userId: post?.userId }],
      }),
      post.deleteOne(),
    ]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error",
    });
  }
};

//like or dislike of particular post by the particular user
exports.likeOrDislikeOfPost = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.postId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, post, alreadylikedPost] = await Promise.all([User.findOne({ _id: userId }), Post.findById(postId), LikeHistoryOfPostOrVideo.findOne({ userId: userId, postId: postId })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!post) {
      return res.status(200).json({ status: false, message: "post does not found." });
    }

    if (alreadylikedPost) {
      await LikeHistoryOfPostOrVideo.deleteOne({
        userId: user._id,
        postId: post._id,
      });

      return res.status(200).json({
        status: true,
        message: "The post was marked with a dislike by the user.",
        isLike: false,
      });
    } else {
      console.log("else");

      const likeHistory = new LikeHistoryOfPostOrVideo();

      likeHistory.userId = user._id;
      likeHistory.postId = post._id;
      likeHistory.uploaderId = post.userId;
      await likeHistory.save();

      res.status(200).json({
        status: true,
        message: "The post was marked with a like by the user.",
        isLike: true,
      });

      const postUser = await User.findOne({ _id: post?.userId }).lean();

      //checks if the user has an fcmToken
      if (postUser && postUser.fcmToken && postUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: postUser?.fcmToken,
          notification: {
            title: "🔔 Post Liked Alert! 🔔",
            body: "Hey there! A user has just liked your post. Check it out now!",
          },
          data: {
            type: "POSTLIKE",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            const notification = new Notification();
            notification.userId = userId; //login userId i.e, to whom notification send
            notification.otherUserId = postUser._id;
            notification.title = "🔔 Post Liked Alert! 🔔";
            notification.message = "Hey there! A user has just liked your post. Check it out now!";
            notification.image = post.mainPostImage;
            notification.date = new Date().toLocaleString("en-US", {
              timeZone: "Asia/Kolkata",
            });
            await notification.save();
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//when user share the post then shareCount of the particular post increased
exports.shareCountOfPost = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.postId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, post] = await Promise.all([User.findOne({ _id: userId }), Post.findById(postId)]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!post) {
      return res.status(200).json({ status: false, message: "post does not found." });
    }

    post.shareCount += 1;
    await post.save();

    return res.status(200).json({
      status: true,
      message: "post has been shared by the user then shareCount has been increased.",
      post: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete post
exports.deleteParticularPost = async (req, res) => {
  try {
    if (!req.query.postId) {
      return res.status(200).json({ status: false, message: "postId must be required." });
    }

    const post = await Post.findById(req.query.postId);
    if (!post) {
      return res.status(200).json({ status: false, message: "No post found with the provided ID." });
    }

    res.status(200).json({ status: true, message: "Success." });

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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
