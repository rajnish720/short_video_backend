const User = require("../../models/user.model");

//generateUniqueId
const { generateUniqueId } = require("../../util/generateUniqueId");

//fs
const fs = require("fs");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//import model
const SearchHistory = require("../../models/searchHistory.model");
const Notification = require("../../models/notification.model");
const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const Video = require("../../models/video.model");
const Post = require("../../models/post.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideo = require("../../models/likeHistoryOfpostOrvideo.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Report = require("../../models/report.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const WatchHistory = require("../../models/watchHistory.model");
const Complaint = require("../../models/complaint.model");
const WithdrawRequest = require("../../models/withDrawRequest.model");
const VerificationRequest = require("../../models/verificationRequest.model");
const History = require("../../models/history.model");
const SongFavorite = require("../../models/songFavorite.model");
const LiveHistory = require("../../models/liveHistory.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const ChatRequest = require("../../models/chatRequest.model");
const Livevideo = require("../../models/livevideo.model");

//mongoose
const mongoose = require("mongoose");

//create user
exports.fakeUser = async (req, res) => {
  try {
    if (!req.body.name || !req.body.userName || !req.body.email || !req.body.gender || !req.body.age || !req.body.mobileNumber || !req.body.country || !req.file) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const user = new User();

    user.name = req?.body?.name;
    user.userName = req?.body?.userName;
    user.email = req?.body?.email;
    user.gender = req?.body?.gender;
    user.age = req?.body?.age;
    user.bio = req?.body?.bio;
    user.mobileNumber = req?.body?.mobileNumber;
    user.countryFlagImage = req?.body?.countryFlagImage;
    user.country = req?.body?.country;
    user.isFake = true;
    user.image = req.file ? req?.file?.path : "";

    const [uniqueId, currentDate] = await Promise.all([generateUniqueId(), new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })]);

    user.uniqueId = uniqueId;
    user.date = currentDate;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "User has been created by the user.",
      data: user,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//update profile of the user
exports.updateUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const user = await User.findOne({ _id: req.query.userId, isFake: true });
    if (!user) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (req?.file) {
      const image = user?.image.split("storage");
      if (image) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }

      user.image = req?.file?.path;
    }

    user.name = req.body.name ? req.body.name : user.name;
    user.email = req.body.email ? req.body.email : user.email;
    user.userName = req.body.userName ? req.body.userName : user.userName;
    user.mobileNumber = req.body.mobileNumber ? req.body.mobileNumber : user.mobileNumber;
    user.gender = req.body.gender ? req.body.gender : user.gender;
    user.age = req.body.age ? req.body.age : user.age;
    user.country = req.body.country ? req.body.country : user.country;
    await user.save();

    return res.status(200).json({ status: true, message: "Update profile of the user by the admin.", data: user });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get users (who is added by admin or real)
exports.getUsers = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const startDate = new Date(req?.query?.startDate);
      const endDate = new Date(req?.query?.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }
    //console.log("dateFilterQuery:   ", dateFilterQuery);

    if (req.query.type === "realUser") {
      const [totalUsers, users] = await Promise.all([
        User.countDocuments({ isFake: false, ...dateFilterQuery }),
        User.find({ isFake: false, ...dateFilterQuery })
          .select("name userName image email country loginType ipAddress gender age uniqueId isBlock isFake isVerified createdAt")
          .sort({ createdAt: -1 })
          .skip((start - 1) * limit)
          .limit(limit),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrive all the real users!",
        total: totalUsers,
        data: users,
      });
    } else if (req.query.type === "fakeUser") {
      const [totalUsersAddByAdmin, users] = await Promise.all([
        User.countDocuments({ isFake: true, ...dateFilterQuery }),
        User.find({ isFake: true, ...dateFilterQuery })
          .select("name userName image email country loginType ipAddress gender age uniqueId isBlock isFake isVerified createdAt")
          .sort({ createdAt: -1 })
          .skip((start - 1) * limit)
          .limit(limit),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrive the all users who has been added by admin!",
        total: totalUsersAddByAdmin,
        data: users,
      });
    } else if (req.query.type === "verifiedUser") {
      const [totalUsersAddByAdmin, users] = await Promise.all([
        User.countDocuments({ isVerified: true, ...dateFilterQuery }),
        User.find({ isVerified: true, ...dateFilterQuery })
          .select("name userName image email country loginType ipAddress gender age uniqueId isBlock isFake isVerified createdAt")
          .sort({ createdAt: -1 })
          .skip((start - 1) * limit)
          .limit(limit),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrive the all users who has been verified by admin!",
        total: totalUsersAddByAdmin,
        data: users,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//handle block of the users (multiple or single)
exports.isBlock = async (req, res) => {
  try {
    const userIds = req.query.userId.split(",");

    const users = await User.find({ _id: { $in: userIds } });

    if (users.length !== userIds.length) {
      return res.status(200).json({ status: false, message: "Oops ! Not all users found." });
    }

    for (const user of users) {
      user.isBlock = !user.isBlock;
      await user.save();
    }

    return res.status(200).json({ status: true, message: "block of the user handled by admin.", data: users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete the users (multiple or single)
exports.deleteUsers = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(200).json({ status: false, message: "No users found with the provided ID." });
    }

    res.status(200).json({ status: true, message: "User have been deleted by the admin." });

    if (user?.image) {
      const image = user?.image.split("storage");
      if (image) {
        const imagePath = "storage" + image[1];
        if (fs.existsSync(imagePath)) {
          const imageName = imagePath.split("/").pop();
          if (imageName !== "male.png" && imageName !== "female.png") {
            console.log("when male or female png not exist");
            fs.unlinkSync(imagePath);
          }
        }
      }
    }

    const [fakeLiveVideoDelete, videosToDelete, postsToDelete, chatRequests, chats, verificationRequests, reports] = await Promise.all([
      Livevideo.find({ userId: user?._id }),
      Video.find({ userId: user?._id }),
      Post.find({ userId: user?._id }),
      ChatRequest.find({ senderUserId: user?._id }),
      Chat.find({ senderUserId: user?._id }),
      VerificationRequest.find({ userId: user?._id }),
      Report.find({ $or: [{ userId: user?._id }, { toUserId: user?._id }] }),
    ]);

    await fakeLiveVideoDelete.map(async (video) => {
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
    });

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

    await postsToDelete.map(async (post) => {
      if (post?.mainPostImage) {
        const mainPostImage = post?.mainPostImage?.split("storage");
        if (mainPostImage) {
          if (fs.existsSync("storage" + mainPostImage[1])) {
            fs.unlinkSync("storage" + mainPostImage[1]);
          }
        }
      }

      if (post.postImage.length > 0) {
        for (var i = 0; i < post?.postImage.length; i++) {
          const postImage = post?.postImage[i].split("storage");
          if (postImage) {
            if (fs.existsSync("storage" + postImage[1])) {
              fs.unlinkSync("storage" + postImage[1]);
            }
          }
        }
      }

      await Promise.all([
        LikeHistoryOfpostOrvideo.deleteMany({ postId: post._id }),
        PostOrVideoComment.deleteMany({ postId: post._id }),
        LikeHistoryOfpostOrvideoComment.deleteMany({ postId: post._id }),
        HashTagUsageHistory.deleteMany({ postId: post._id }),
        Report.deleteMany({ postId: post._id }),
        Notification.deleteMany({ $or: [{ otherUserId: post?.userId }, { userId: post?.userId }] }),
        Post.deleteOne({ _id: post._id }),
      ]);
    });

    for (const chatRequest of chatRequests) {
      if (chatRequest?.image) {
        const image = chatRequest?.image?.split("storage");
        if (image) {
          if (fs.existsSync("storage" + image[1])) {
            fs.unlinkSync("storage" + image[1]);
          }
        }
      }

      if (chatRequest?.audio) {
        const audio = chatRequest?.audio?.split("storage");
        if (audio) {
          if (fs.existsSync("storage" + audio[1])) {
            fs.unlinkSync("storage" + audio[1]);
          }
        }
      }
    }

    for (const chat of chats) {
      if (chat?.image) {
        const image = chat?.image?.split("storage");
        if (image) {
          if (fs.existsSync("storage" + image[1])) {
            fs.unlinkSync("storage" + image[1]);
          }
        }
      }

      if (chat?.audio) {
        const audio = chat?.audio?.split("storage");
        if (audio) {
          if (fs.existsSync("storage" + audio[1])) {
            fs.unlinkSync("storage" + audio[1]);
          }
        }
      }
    }

    for (const verificationRequest of verificationRequests) {
      if (verificationRequest?.profileSelfie) {
        const profileSelfie = verificationRequest?.profileSelfie?.split("storage");
        if (profileSelfie) {
          if (fs.existsSync("storage" + profileSelfie[1])) {
            fs.unlinkSync("storage" + profileSelfie[1]);
          }
        }
      }

      if (verificationRequest?.document) {
        const document = verificationRequest?.document?.split("storage");
        if (document) {
          if (fs.existsSync("storage" + document[1])) {
            fs.unlinkSync("storage" + document[1]);
          }
        }
      }
    }

    if (reports.length > 0) {
      await reports.map(async (report) => {
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
            LikeHistoryOfpostOrvideo.deleteMany({ videoId: video._id }),
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
            LikeHistoryOfpostOrvideo.deleteMany({ postId: post._id }),
            PostOrVideoComment.deleteMany({ postId: post._id }),
            LikeHistoryOfpostOrvideoComment.deleteMany({ postId: post._id }),
            HashTagUsageHistory.deleteMany({ postId: post._id }),
            Notification.deleteMany({ $or: [{ otherUserId: post?.userId }, { userId: post?.userId }] }),
          ]);

          await Post.deleteOne({ _id: post?._id });
        }
      });
    }

    await Promise.all([
      ChatRequestTopic.deleteMany({ $or: [{ senderUserId: user?._id }, { receiverUserId: user?._id }] }),
      ChatRequest.deleteMany({ senderUserId: user?._id }),
      ChatTopic.deleteMany({ $or: [{ senderUserId: user?._id }, { receiverUserId: user?._id }] }),
      Chat.deleteMany({ senderUserId: user?._id }),
      Complaint.deleteMany({ userId: user?._id }),
      FollowerFollowing.deleteMany({ $or: [{ fromUserId: user?._id }, { toUserId: user?._id }] }),
      HashTagUsageHistory.deleteMany({ userId: user._id }),
      History.deleteMany({ $or: [{ userId: user?._id }, { otherUserId: user?._id }] }),
      LikeHistoryOfpostOrvideo.deleteMany({ userId: user?._id }),
      LikeHistoryOfpostOrvideoComment.deleteMany({ userId: user?._id }),
      Notification.deleteMany({ $or: [{ otherUserId: user?._id }, { userId: user?._id }] }),
      Post.deleteMany({ userId: user?._id }),
      PostOrVideoComment.deleteMany({ userId: user?._id }),
      Report.deleteMany({ $or: [{ userId: user?._id }, { toUserId: user?._id }] }),
      SearchHistory.deleteMany({ userId: user?._id }),
      SongFavorite.deleteMany({ userId: user?._id }),
      VerificationRequest.deleteMany({ userId: user?._id }),
      Video.deleteMany({ userId: user?._id }),
      WatchHistory.deleteMany({ userId: user?._id }),
      WithdrawRequest.deleteMany({ userId: user?._id }),
      LiveHistory.deleteMany({ userId: user?._id }),
    ]);

    await User.deleteOne({ _id: userId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get user profile
exports.getProfile = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const user = await User.findOne({ _id: req.query.userId });
    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "profile of the user get by the admin.", data: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};
