const Video = require("../../models/video.model");

//fs
const fs = require("fs");

//mongoose
const mongoose = require("mongoose");

//day.js
const dayjs = require("dayjs");

//import model
const User = require("../../models/user.model");
const Song = require("../../models/song.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const WatchHistory = require("../../models/watchHistory.model");
const HashTag = require("../../models/hashTag.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const Report = require("../../models/report.model");
const Notification = require("../../models/notification.model");

//private key
const admin = require("../../util/privateKey");

//deleteFiles
const { deleteFiles } = require("../../util/deletefile");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//generateUniqueVideoOrPostId
const { generateUniqueVideoOrPostId } = require("../../util/generateUniqueVideoOrPostId");

//upload video by particular user
exports.uploadvideo = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (!req.body.videoTime || !req.files) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [uniqueVideoId, user, song] = await Promise.all([generateUniqueVideoOrPostId(), User.findOne({ _id: req.query.userId, isFake: false }), Song.findById(req?.body?.songId)]);

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
      return res.status(200).json({ status: false, message: "setting does not found!" });
    }

    if (settingJSON.durationOfShorts < parseInt(req.body.videoTime)) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "your duration of Video greater than decided by the admin." });
    }

    if (req?.body?.songId) {
      if (!song) {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "Song does not found." });
      }
    }

    const video = new Video();

    video.userId = user._id;
    video.caption = req?.body?.caption ? req.body.caption : "";
    video.videoTime = req?.body?.videoTime;
    video.songId = req?.body?.songId ? song._id : video.songId;

    if (req?.body?.hashTagId) {
      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      video.hashTagId = req?.body?.hashTagId ? multipleHashTag : [];

      //create history for each hashtag used
      await multipleHashTag.map(async (hashTagId) => {
        const hashTag = await HashTag.findById(hashTagId);
        if (hashTag) {
          const hashTagUsageHistory = new HashTagUsageHistory({
            userId: user._id,
            hashTagId: hashTagId,
            videoId: video._id,
          });
          await hashTagUsageHistory.save();
        }
      });
    }

    if (req?.files?.videoImage) {
      video.videoImage = req.files.videoImage[0].path;
    }

    if (req?.files?.videoUrl) {
      video.videoUrl = req.files.videoUrl[0].path;
    }

    video.uniqueVideoId = uniqueVideoId;
    await video.save();

    res.status(200).json({ status: true, message: "Video has been uploaded by the user.", data: video });

    const videoUrl = process?.env?.baseURL + req?.files?.videoUrl[0]?.path;

    var sightengine = require("sightengine")(settingJSON.sightengineUser, settingJSON.sightengineSecret);

    const checks = [];
    if (settingJSON.videoBanned.includes("1")) checks.push("nudity-2.1");
    if (settingJSON.videoBanned.includes("2")) checks.push("offensive");
    if (settingJSON.videoBanned.includes("3")) checks.push("violence");
    if (settingJSON.videoBanned.includes("4")) checks.push("gore-2.0");
    if (settingJSON.videoBanned.includes("5")) checks.push("weapon");
    if (settingJSON.videoBanned.includes("6")) checks.push("tobacco");
    if (settingJSON.videoBanned.includes("7")) checks.push("recreational_drug,medical");
    if (settingJSON.videoBanned.includes("8")) checks.push("gambling");
    if (settingJSON.videoBanned.includes("9")) checks.push("alcohol");
    if (settingJSON.videoBanned.includes("10")) checks.push("money");
    if (settingJSON.videoBanned.includes("11")) checks.push("self-harm");

    console.log("checks ", checks);

    if (checks.length > 0 && videoUrl) {
      sightengine
        .check(checks)
        .video_sync(videoUrl)
        .then(async function (result) {
          // console.log("result ", result);

          if (result.status === "success") {
            const frames = result?.data?.frames;
            console.log("frames ", frames);

            if (frames) {
              let isBanned = false;

              for (const check of checks) {
                if (settingJSON.videoBanned.includes("1") && check === "nudity-2.1") {
                  const nudityBanned = frames.some((frame) => {
                    const { sexual_activity, sexual_display, erotica, very_suggestive, suggestive, mildly_suggestive } = frame.nudity;

                    return sexual_activity > 0.7 || sexual_display > 0.7 || erotica > 0.7 || very_suggestive > 0.7 || suggestive > 0.7 || mildly_suggestive > 0.7;
                  });

                  console.log("nudityBanned", nudityBanned);

                  if (nudityBanned) {
                    isBanned = true;

                    if (isBanned === true) {
                      console.log("video isBanned", isBanned);

                      video.isBanned = isBanned;
                      await video.save();
                    }
                  }
                }

                if (settingJSON.videoBanned.includes("2") && check === "offensive") {
                  const offensiveFrames = frames.map((frame) => frame.offensive?.prob);
                  const avgOffensiveProb = offensiveFrames.reduce((acc, prob) => acc + prob, 0) / offensiveFrames.length;

                  console.log("avgOffensiveProb ", avgOffensiveProb);
                  console.log("isBanned ", isBanned);

                  if (avgOffensiveProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }

                if (settingJSON.videoBanned.includes("3") && check === "violence") {
                  const violenceFrames = frames.map((frame) => frame.violence?.prob);
                  const avgViolenceProb = violenceFrames.reduce((acc, prob) => acc + prob, 0) / violenceFrames.length;

                  console.log("avgViolenceProb ", avgViolenceProb);
                  console.log("isBanned ", isBanned);

                  if (avgViolenceProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }

                if (settingJSON.videoBanned.includes("4") && check === "gore-2.0") {
                  const goreFrames = frames.map((frame) => frame.gore?.prob);
                  const avgGoreProb = goreFrames.reduce((acc, prob) => acc + prob, 0) / goreFrames.length;

                  console.log("avgGoreProb ", avgGoreProb);
                  console.log("isBanned ", isBanned);

                  if (avgGoreProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }

                if (settingJSON.videoBanned.includes("5") && check === "weapon") {
                  const weaponFrames = frames.flatMap((frame) => {
                    const classesProbs = frame.weapon?.classes ? Object.values(frame.weapon.classes).map((prob) => prob || 0) : [];
                    const firearmTypeProbs = frame.weapon?.firearm_type ? Object.values(frame.weapon.firearm_type).map((prob) => prob || 0) : [];
                    const firearmActionProbs = frame.weapon?.firearm_action ? Object.values(frame.weapon.firearm_action).map((prob) => prob || 0) : [];

                    return [...classesProbs, ...firearmTypeProbs, ...firearmActionProbs];
                  });

                  if (weaponFrames.length > 0) {
                    const avgWeaponProb = weaponFrames.reduce((acc, prob) => acc + prob, 0) / weaponFrames.length;
                    console.log("avgWeaponProb:", avgWeaponProb);

                    if (avgWeaponProb > 0.7) {
                      isBanned = true;
                      console.log("New isBanned:", isBanned);

                      if (isBanned) {
                        video.isBanned = isBanned;
                        console.log("Video isBanned:", video.isBanned);
                      }
                    }
                  } else {
                    console.log("No weapon probabilities found in frames.");
                  }
                }

                if (settingJSON.videoBanned.includes("6") && check === "tobacco") {
                  const tobaccoFrames = frames.map((frame) => frame.tobacco?.prob);
                  const avgTobaccoProb = tobaccoFrames.reduce((acc, prob) => acc + prob, 0) / tobaccoFrames.length;

                  console.log("avgTobaccoProb ", avgTobaccoProb);
                  console.log("isBanned ", isBanned);

                  if (avgTobaccoProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }

                if (settingJSON.videoBanned.includes("7") && check === "recreational_drug,medical") {
                  const recreationalDrugFrames = frames.map((frame) => frame.recreational_drug?.prob);
                  const avgRecreationalDrugProb = recreationalDrugFrames.reduce((acc, prob) => acc + prob, 0) / recreationalDrugFrames.length;

                  console.log("avgRecreationalDrugProb ", avgRecreationalDrugProb);
                  console.log("isBanned ", isBanned);

                  if (avgRecreationalDrugProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }

                if (settingJSON.videoBanned.includes("9") && check === "alcohol") {
                  const alcoholFrames = frames.map((frame) => frame.alcohol?.prob);
                  const avgAlcoholProb = alcoholFrames.reduce((acc, prob) => acc + prob, 0) / alcoholFrames.length;

                  console.log("avgAlcoholProb ", avgAlcoholProb);
                  console.log("isBanned ", isBanned);

                  if (avgAlcoholProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }

                if (settingJSON.videoBanned.includes("8") && check === "gambling") {
                  const gamblingFrames = frames.map((frame) => frame.gambling?.prob);
                  const avgGamblingProb = gamblingFrames.reduce((acc, prob) => acc + prob, 0) / gamblingFrames.length;

                  console.log("avgGamblingProb ", avgGamblingProb);
                  console.log("isBanned ", isBanned);

                  if (avgGamblingProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }

                if (settingJSON.videoBanned.includes("10") && check === "money") {
                  const moneyFrames = frames.map((frame) => frame.money?.prob);
                  const avgMoneyProb = moneyFrames.reduce((acc, prob) => acc + prob, 0) / moneyFrames.length;

                  console.log("avgMoneyProb ", avgMoneyProb);
                  console.log("isBanned ", isBanned);

                  if (avgMoneyProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }

                if (settingJSON.videoBanned.includes("11") && check === "self-harm") {
                  const selfHarmFrames = frames.map((frame) => frame["self-harm"]?.prob);
                  const avgSelfHarmProb = selfHarmFrames.reduce((acc, prob) => acc + prob, 0) / selfHarmFrames.length;

                  console.log("avgSelfHarmProb ", avgSelfHarmProb);
                  console.log("isBanned ", isBanned);

                  if (avgSelfHarmProb > 0.7) {
                    isBanned = true;

                    console.log("New isBanned ", isBanned);

                    if (isBanned === true) {
                      video.isBanned = isBanned;
                      await video.save();
                      console.log("Video isBanned ", video.isBanned);
                    }

                    break;
                  }
                }
              }
            }
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } else {
      console.log("No checks selected or no video URL provided.");
    }
  } catch (error) {
    console.log(error);
    if (req.files) deleteFiles(req.files);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//update video by particular user
exports.updateVideoByUser = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "userId and videoId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, videoOfUser, song] = await Promise.all([User.findOne({ _id: userId }), Video.findOne({ _id: videoId, userId: userId }), Song.findById(req?.body?.songId)]);

    if (!user) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!videoOfUser) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "video does not found for this user." });
    }

    if (req?.body?.songId) {
      if (!song) {
        if (req.file) deleteFile(req.file);
        return res.status(200).json({ status: false, message: "Song does not found." });
      }
    }

    if (req.file) {
      const videoImage = videoOfUser?.videoImage.split("storage");
      if (videoImage) {
        if (fs.existsSync("storage" + videoImage[1])) {
          fs.unlinkSync("storage" + videoImage[1]);
        }
      }

      videoOfUser.videoImage = req.file.path;
    }

    if (req?.body?.hashTagId) {
      const existingHistory = await HashTagUsageHistory.find({ userId: user._id, videoId: videoOfUser._id });

      if (existingHistory.length > 0) {
        console.log("Check if a history record already exists for the user and video");

        await HashTagUsageHistory.deleteMany({ userId: user._id, videoId: videoOfUser._id });
      }

      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      videoOfUser.hashTagId = multipleHashTag.length > 0 ? multipleHashTag : [];

      await Promise.all(
        multipleHashTag.map(async (hashTagId) => {
          const hashTag = await HashTag.findById(hashTagId);

          if (hashTag) {
            console.log("Create a new history record if it doesn't exist");

            const hashTagUsageHistory = new HashTagUsageHistory({
              userId: user._id,
              videoId: videoOfUser._id,
              hashTagId: hashTagId,
            });
            await hashTagUsageHistory.save();
          }
        })
      );
    }

    videoOfUser.songId = req?.body?.songId ? song._id : videoOfUser.songId;
    videoOfUser.caption = req.body.caption ? req.body.caption : videoOfUser.caption;
    await videoOfUser.save();

    return res.status(200).json({ status: true, message: "Video has been updated.", data: videoOfUser });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get particular user's videos
exports.videosOfUser = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.toUserId) {
      return res.status(200).json({ status: false, message: "Both userId and toUserId are required." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId); // Logged-in userId
    const userIdOfVideo = new mongoose.Types.ObjectId(req.query.toUserId); // userId of video

    const [user, videos] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      Video.aggregate([
        { $match: { userId: userIdOfVideo } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        {
          $unwind: {
            path: "$song",
            preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
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
            let: { videoId: "$_id" },
            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", userId] }] } } }],
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $addFields: {
            isLike: { $cond: { if: { $gt: [{ $size: "$likes" }, 0] }, then: true, else: false } },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$comments" },
            totalViews: { $size: "$views" },
          },
        },
        {
          $project: {
            videoImage: 1,
            songId: 1,
            videoUrl: 1,
            caption: 1,
            isBanned: 1,
            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            userIsFake: "$user.isFake",

            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",

            isLike: 1,
            totalLikes: 1,
            totalComments: 1,
            totalViews: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Videos of the particular user.",
      data: videos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//if isFakeData on then real+fake videos otherwise fake videos
exports.getAllVideos = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    let now = dayjs();

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (req.query.videoId) {
      const videoId = new mongoose.Types.ObjectId(req.query.videoId);

      const [user, video] = await Promise.all([User.findOne({ _id: userId }), Video.findById(videoId)]);

      if (!video) {
        return res.status(200).json({ status: false, message: "No video found with the provided ID." });
      }

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      const data = [
        {
          $match: { isBanned: false },
        },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        {
          $unwind: {
            path: "$song",
            preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
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
            foreignField: "videoId",
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { videoId: "$_id", userId: user._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
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
            let: { postUserId: "$userId", requestingUserId: user._id },
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
            videoImage: 1,
            videoUrl: 1,
            shareCount: 1,
            isFake: 1,
            songId: 1,
            createdAt: 1,
            userIsFake: "$user.isFake",

            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",

            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
            isFollow: { $cond: { if: { $gt: [{ $size: "$isFollow" }, 0] }, then: true, else: false } },
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
      ];

      if (settingJSON.isFakeData) {
        const [realVideoOfUser, fakeVideoOfUser] = await Promise.all([Video.aggregate([{ $match: { isFake: false } }, ...data]), Video.aggregate([{ $match: { isFake: true } }, ...data])]);

        let allVideos = [...realVideoOfUser, ...fakeVideoOfUser];

        //Sort allVideos by createdAt date
        //allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allVideos = allVideos.sort(() => 0.5 - Math.random());

        const videoIndex = allVideos.findIndex((short) => short._id.toString() === videoId.toString());

        //If the videoId is found, move it to the 0th index
        if (videoIndex !== -1) {
          const [movedVideo] = allVideos.splice(videoIndex, 1);
          allVideos.unshift(movedVideo);
        }

        const adjustedStart = videoIndex !== -1 ? 1 : start;

        allVideos = allVideos.slice(adjustedStart - 1, adjustedStart - 1 + limit);

        return res.status(200).json({
          status: true,
          message: "Retrieve the videos uploaded by users.",
          data: allVideos,
        });
      } else {
        let realVideoOfUser = await Video.aggregate([{ $match: { isFake: false } }, ...data]);

        //Sort videos by createdAt date
        //realVideoOfUser.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        realVideoOfUser = realVideoOfUser.sort(() => 0.5 - Math.random());

        const videoIndex = realVideoOfUser.findIndex((short) => short._id.toString() === videoId.toString());

        //If the videoId is found, move it to the 0th index
        if (videoIndex !== -1) {
          const [movedVideo] = realVideoOfUser.splice(videoIndex, 1);
          realVideoOfUser.unshift(movedVideo);
        }

        const adjustedStart = videoIndex !== -1 ? 1 : start;

        realVideoOfUser = realVideoOfUser.slice(adjustedStart - 1, adjustedStart - 1 + limit);

        return res.status(200).json({
          status: true,
          message: "Retrieve the videos uploaded by users.",
          data: realVideoOfUser,
        });
      }
    } else {
      const userId = new mongoose.Types.ObjectId(req.query.userId);

      const user = await User.findOne({ _id: userId });

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      const data = [
        {
          $match: { isBanned: false },
        },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        {
          $unwind: {
            path: "$song",
            preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
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
            foreignField: "videoId",
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { videoId: "$_id", userId: user._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
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
            let: { postUserId: "$userId", requestingUserId: user._id },
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
            videoImage: 1,
            videoUrl: 1,
            shareCount: 1,
            isFake: 1,
            songId: 1,
            createdAt: 1,

            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",

            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
            isFollow: { $cond: { if: { $gt: [{ $size: "$isFollow" }, 0] }, then: true, else: false } },
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
      ];

      let allVideos;
      if (settingJSON.isFakeData) {
        const [realVideoOfUser, fakeVideoOfUser] = await Promise.all([Video.aggregate([{ $match: { isFake: false } }, ...data]), Video.aggregate([{ $match: { isFake: true } }, ...data])]);

        allVideos = [...realVideoOfUser, ...fakeVideoOfUser];
        //allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allVideos = allVideos.sort(() => 0.5 - Math.random());
      } else {
        allVideos = await Video.aggregate([{ $match: { isFake: false } }, ...data]);
        //allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allVideos = allVideos.sort(() => 0.5 - Math.random());
      }

      const paginatedVideos = allVideos.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrieve the videos uploaded by users.",
        data: paginatedVideos,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//delete video of the particular user
exports.deleteVideoOfUser = async (req, res) => {
  try {
    if (!req.query.videoId || !req.query.userId) {
      return res.status(200).json({ status: false, message: "videoId and userId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, video] = await Promise.all([User.findOne({ _id: userId, isFake: false }), Video.findOne({ _id: videoId, userId: userId, isFake: false })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found for that user." });
    }

    res.status(200).json({ status: true, message: "Video has been deleted by the user." });

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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//like or dislike of particular video by the particular user
exports.likeOrDislikeOfVideo = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, video, alreadylikedVideo] = await Promise.all([
      User.findOne({ _id: userId }),
      Video.findById(videoId),
      LikeHistoryOfPostOrVideo.findOne({
        userId: userId,
        videoId: videoId,
      }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }

    if (alreadylikedVideo) {
      await LikeHistoryOfPostOrVideo.deleteOne({
        userId: user._id,
        videoId: video._id,
      });

      return res.status(200).json({
        status: true,
        message: "The Video was marked with a dislike by the user.",
        isLike: false,
      });
    } else {
      console.log("else");

      const likeHistory = new LikeHistoryOfPostOrVideo();

      likeHistory.userId = user._id;
      likeHistory.videoId = video._id;
      likeHistory.uploaderId = video.userId;
      await likeHistory.save();

      res.status(200).json({
        status: true,
        message: "The Video was marked with a like by the user.",
        isLike: true,
      });

      const videoUser = await User.findOne({ _id: video.userId }).lean();

      //checks if the user has an fcmToken
      if (videoUser && videoUser.fcmToken && videoUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: videoUser?.fcmToken,
          notification: {
            title: "🔔 Video Liked Alert! 🔔",
            body: "Hey there! A user has just liked your video. Check it out now!",
          },
          data: {
            type: "VIDEOLIKE",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            const notification = new Notification();
            notification.userId = userId; //login userId i.e, to whom notification send
            notification.otherUserId = videoUser._id;
            notification.title = "🔔 Video Liked Alert! 🔔";
            notification.message = "Hey there! A user has just liked your video. Check it out now!";
            notification.image = video.videoImage;
            notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            await notification.save();
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//when user share the video then shareCount of the particular video increased
exports.shareCountOfVideo = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, video] = await Promise.all([User.findOne({ _id: userId }), Video.findById(videoId)]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }

    video.shareCount += 1;
    await video.save();

    return res.status(200).json({ status: true, message: "video has been shared by the user then shareCount has been increased.", video });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete video
exports.deleteParticularVideo = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required." });
    }

    const video = await Video.findById(req.query.videoId);
    if (!video) {
      return res.status(200).json({ status: false, message: "No video found with the provided ID." });
    }

    res.status(200).json({ status: true, message: "Success." });

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
      Report.deleteMany({ videoId: video._id }),
      Notification.deleteMany({ otherUserId: video?.userId }),
      Video.deleteOne({ _id: video._id }),
    ]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get videos of the particular song by particular user
exports.fetchVideosOfParticularSong = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.songId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const songId = new mongoose.Types.ObjectId(req.query.songId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [user, song, totalVideosOfSong, videos] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      Song.findOne({ _id: songId }).lean(),
      Video.countDocuments({ songId: songId }),
      Video.aggregate([
        { $match: { songId: songId } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        { $unwind: { path: "$song", preserveNullAndEmptyArrays: false } },
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
            let: { videoId: "$_id" },
            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", userId] }] } } }],
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $addFields: {
            isLike: { $cond: { if: { $gt: [{ $size: "$likes" }, 0] }, then: true, else: false } },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$comments" },
            totalViews: { $size: "$views" },
          },
        },
        {
          $project: {
            videoImage: 1,
            videoUrl: 1,
            caption: 1,
            isBanned: 1,
            isLike: 1,
            totalLikes: 1,
            totalComments: 1,
            totalViews: 1,
            songId: 1,
            createdAt: 1,
            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",
            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            userIsFake: "$user.isFake",
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit }, //how many records you want to skip
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (!song) {
      return res.status(200).json({ status: false, message: "Song does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive videos with the use of that song.",
      totalVideosOfSong: totalVideosOfSong,
      videos: videos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
