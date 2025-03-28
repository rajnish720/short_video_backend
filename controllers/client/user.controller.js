const User = require("../../models/user.model");

//import model
const FollowerFollowing = require("../../models/followerFollowing.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const History = require("../../models/history.model");
const SearchHistory = require("../../models/searchHistory.model");
const Notification = require("../../models/notification.model");
const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");
const Video = require("../../models/video.model");
const Post = require("../../models/post.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Report = require("../../models/report.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const WatchHistory = require("../../models/watchHistory.model");
const Complaint = require("../../models/complaint.model");
const WithdrawRequest = require("../../models/withDrawRequest.model");
const VerificationRequest = require("../../models/verificationRequest.model");
const SongFavorite = require("../../models/songFavorite.model");
const LiveHistory = require("../../models/liveHistory.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const ChatRequest = require("../../models/chatRequest.model");

//mongoose
const mongoose = require("mongoose");

//fs
const fs = require("fs");

//Cryptr
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//generateUniqueId
const { generateUniqueId } = require("../../util/generateUniqueId");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//private key
const admin = require("../../util/privateKey");

//user function
const userFunction = async (user, data_) => {
  const data = data_.body;
  const file = data_.file;

  user.name = data?.name ? data?.name?.trim() : user.name;
  user.userName = data?.userName ? data?.userName?.trim() : user.userName;
  user.gender = data?.gender ? data?.gender?.toLowerCase().trim() : user.gender;
  user.bio = data?.bio ? data?.bio?.trim() : user.bio;
  user.age = data?.age ? data?.age : user.age;

  if (file) {
    user.image = file.path;
  } else if (user.gender?.toLowerCase()?.trim() === "male") {
    user.image = "storage/male.png";
  } else if (user.gender?.toLowerCase()?.trim() === "female") {
    user.image = "storage/female.png";
  } else {
    user.image = user.image;
  }

  user.email = data?.email ? data?.email?.trim() : user.email;
  user.mobileNumber = data.mobileNumber ? data.mobileNumber : user.mobileNumber;

  user.countryFlagImage = data.countryFlagImage ? data.countryFlagImage : user.countryFlagImage;
  user.country = data.country ? data.country : user.country;
  user.ipAddress = data.ipAddress ? data.ipAddress : user.ipAddress;

  user.loginType = data.loginType ? data.loginType : user.loginType;
  user.identity = data.identity ? data.identity : user.identity;
  user.fcmToken = data.fcmToken ? data.fcmToken : user.fcmToken;
  user.uniqueId = !user.uniqueId ? await generateUniqueId() : user.uniqueId;

  await user.save();
  return user;
};

//check the user is exists or not with loginType 3 quick(identity)
exports.checkUser = async (req, res) => {
  try {
    if (!req.query.identity) {
      return res.status(200).json({ status: false, message: "identity must be requried." });
    }

    const user = await User.findOne({ identity: req.query.identity, loginType: 3 });
    if (user) {
      return res.status(200).json({
        status: true,
        message: "User login Successfully.",
        isLogin: true,
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "User must have to sign up.",
        isLogin: false,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error",
    });
  }
};

//user login and sign up
exports.loginOrSignUp = async (req, res) => {
  try {
    if (!req.body.identity || req.body.loginType === undefined || !req.body.fcmToken) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    let userQuery;

    const loginType = req?.body?.loginType;
    const identity = req?.body?.identity;

    if (loginType === 1) {
      if (!req.body.mobileNumber) {
        return res.status(200).json({ status: false, message: "mobileNumber must be required." });
      }

      userQuery = await User.findOne({ mobileNumber: req.body.mobileNumber?.trim() });
    } else if (loginType === 2) {
      if (!req.body.email) {
        return res.status(200).json({ status: false, message: "email must be required." });
      }

      userQuery = await User.findOne({ email: req?.body?.email?.trim() });
    } else if (loginType === 3) {
      if (!req.body.identity) {
        return res.status(200).json({ status: false, message: "identity must be required." });
      }

      userQuery = await User.findOne({ identity: identity, email: req?.body?.email?.trim() }); //email field always be identity
    } else {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "loginType must be passed valid." });
    }

    const user = userQuery;

    if (user) {
      console.log("User is already exist ............");

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "You are blocked by the admin." });
      }

      user.fcmToken = req.body.fcmToken ? req.body.fcmToken : user.fcmToken;
      user.lastlogin = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

      if (loginType === 3) {
        const user_ = await userFunction(user, req);

        return res.status(200).json({
          status: true,
          message: "The user has successfully logged in.",
          user: user_,
          signUp: false,
        });
      }

      return res.status(200).json({
        status: true,
        message: "The user has successfully logged in.",
        user: user,
        signUp: false,
      });
    } else {
      console.log("User signup:    ");

      const uniqueId = generateHistoryUniqueId();
      const bonusCoins = settingJSON.loginBonus ? settingJSON.loginBonus : 5000;

      const newUser = new User();
      newUser.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      newUser.coin = bonusCoins;

      const user = await userFunction(newUser, req);

      res.status(200).json({
        status: true,
        message: "A new user has registered an account.",
        signUp: true,
        user: user,
      });

      await History.create({
        otherUserId: newUser._id,
        coin: bonusCoins,
        uniqueId: uniqueId,
        type: 5,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      if (user.fcmToken && user.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🎁 Welcome Bonus! 🎁",
            body: "✨ Congratulations! You have received a login bonus. Thank you for joining us.",
          },
          data: {
            type: "LOGINBONUS",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    }
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//update profile of the user
exports.update = async (req, res) => {
  try {
    if (!req.query.userId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const user = await User.findOne({ _id: req.query.userId });
    if (!user) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (req?.file) {
      const image = user?.image.split("storage");
      if (image) {
        const imagePath = "storage" + image[1];
        if (fs.existsSync(imagePath)) {
          const imageName = imagePath.split("/").pop();
          if (imageName !== "male.png" && imageName !== "female.png") {
            console.log("come");
            fs.unlinkSync(imagePath);
          }
        }
      }

      user.image = req?.file?.path;
    }

    user.name = req.body.name ? req.body.name : user.name;
    user.userName = req.body.userName ? req.body.userName : user.userName;
    user.mobileNumber = req.body.mobileNumber ? req.body.mobileNumber : user.mobileNumber;
    user.gender = req.body.gender ? req.body.gender?.toLowerCase()?.trim() : user.gender;
    user.bio = req.body.bio ? req.body.bio : user.bio;
    user.countryFlagImage = req.body.countryFlagImage ? req.body.countryFlagImage : user.countryFlagImage;
    user.country = req.body.country ? req.body.country : user.country;
    await user.save();

    return res.status(200).json({ status: true, message: "The user's profile has been modified.", user: user });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get user profile who login
exports.getProfile = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const user = await User.findOne({ _id: req.query.userId }).lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "The user has retrieved their profile.", user: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get user profile with total count of followers, total count of following and total count of videos and posts's likes (for own user profile)
exports.getUserProfile = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.toUserId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const userIdOfPostOrVideo = new mongoose.Types.ObjectId(req.query.toUserId);

    const [user, isFollow, totalFollowers, totalFollowing, totalLikesOfVideoPost] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      FollowerFollowing.findOne({ fromUserId: userIdOfPostOrVideo, toUserId: userId }).lean(),
      FollowerFollowing.countDocuments({ toUserId: userId }),
      FollowerFollowing.countDocuments({ fromUserId: userId }),
      LikeHistoryOfPostOrVideo.countDocuments({ uploaderId: userId }),
    ]);

    const userProfileData = {
      user: {
        name: user.name,
        userName: user.userName,
        gender: user.gender,
        image: user.image,
        countryFlagImage: user.countryFlagImage,
        country: user.country,
        isVerified: user.isVerified,
        isFollow: !!isFollow,
        isFake: user.isFake,
      },
      totalFollowers,
      totalFollowing,
      totalLikesOfVideoPost,
    };

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrieve the profile information.",
      userProfileData: userProfileData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get user's coin
exports.getUserCoin = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const user = await User.findOne({ _id: req.query.userId }).lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "The user has retrieved their profile.", userCoin: user.coin });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get all reveived gift by user
exports.receviedGiftByUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, history] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      History.aggregate([
        {
          $match: {
            $and: [{ otherUserId: userId }, { type: 1 }, { giftId: { $ne: null } }],
          },
        },
        {
          $lookup: {
            from: "gifts",
            localField: "giftId",
            foreignField: "_id",
            as: "gift",
          },
        },
        {
          $unwind: {
            path: "$gift",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$gift",
            total: { $sum: 1 }, //total of particular gift received by particular user
            giftCoin: { $first: "$gift.coin" },
            giftImage: { $first: "$gift.image" },
            giftType: { $first: "$gift.type" },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            giftCoin: 1,
            giftImage: 1,
            giftType: 1,
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
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Retrieve all gifts that have been received.", data: history });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

//update password
exports.updatePassword = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (!req.body.oldPass || !req.body.newPass || !req.body.confirmPass) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const user = await User.findOne({ _id: req.query.userId });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (cryptr.decrypt(user.password) !== req.body.oldPass) {
      return res.status(200).json({ status: false, message: "Oops ! Password doesn't match." });
    }

    if (req.body.newPass !== req.body.confirmPass) {
      return res.status(200).json({ status: false, message: "Oops ! New Password and Confirm Password doesn't match." });
    } else {
      user.password = cryptr.encrypt(req?.body?.newPass);
      await user.save();

      return res.status(200).json({
        status: true,
        message: "The user has successfully changed their password.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//set Password
exports.setPassword = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "Email must be required." });
    }

    if (!req.body.newPassword || !req.body.confirmPassword) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const userPromise = User.findOne({ email: req.query.email });
    const cryptrEncryptPromise = cryptr.encrypt(req.body.newPassword);

    const [user, encryptedPassword] = await Promise.all([userPromise, cryptrEncryptPromise]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found with that email." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (encryptedPassword === req.body.confirmPassword) {
      user.password = encryptedPassword;
      await user.save();

      //I want to decrypt the password for response
      user.password = await cryptr.decrypt(user.password);

      return res.status(200).json({
        status: true,
        message: "The user has successfully changed their password.",
        user: user,
      });
    } else {
      return res.status(200).json({ status: false, message: "Password does not match." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete user account
exports.deleteUserAccount = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    res.status(200).json({ status: true, message: "User account has been deleted." });

    const [videosToDelete, postsToDelete, chatRequests, chats, verificationRequests, reports] = await Promise.all([
      Video.find({ userId: user?._id }),
      Post.find({ userId: user?._id }),
      ChatRequest.find({ senderUserId: user?._id }),
      Chat.find({ senderUserId: user?._id }),
      VerificationRequest.find({ userId: user?._id }),
      Report.find({ $or: [{ userId: user?._id }, { toUserId: user?._id }] }),
    ]);

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

    if (videosToDelete.length > 0) {
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
          LikeHistoryOfPostOrVideo.deleteMany({ videoId: video._id }),
          PostOrVideoComment.deleteMany({ videoId: video._id }),
          LikeHistoryOfpostOrvideoComment.deleteMany({ videoId: video._id }),
          WatchHistory.deleteMany({ videoId: video._id }),
          HashTagUsageHistory.deleteMany({ videoId: video._id }),
          Notification.deleteMany({ $or: [{ otherUserId: video?.userId }, { userId: video?.userId }] }),
          Report.deleteMany({ videoId: video._id }),
          Video.deleteOne({ _id: video._id }),
        ]);
      });
    }

    if (postsToDelete.length > 0) {
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
          LikeHistoryOfPostOrVideo.deleteMany({ postId: post._id }),
          PostOrVideoComment.deleteMany({ postId: post._id }),
          LikeHistoryOfpostOrvideoComment.deleteMany({ postId: post._id }),
          HashTagUsageHistory.deleteMany({ postId: post._id }),
          Report.deleteMany({ postId: post._id }),
          Notification.deleteMany({ $or: [{ otherUserId: post?.userId }, { userId: post?.userId }] }),
          Post.deleteOne({ _id: post._id }),
        ]);
      });
    }

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
            LikeHistoryOfPostOrVideo.deleteMany({ videoId: video._id }),
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
            LikeHistoryOfPostOrVideo.deleteMany({ postId: post._id }),
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
      LikeHistoryOfPostOrVideo.deleteMany({ userId: user?._id }),
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

    await User.deleteOne({ _id: user?._id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
