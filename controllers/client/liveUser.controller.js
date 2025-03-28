const LiveUser = require("../../models/liveUser.model");

//import model
const User = require("../../models/user.model");
const LiveHistory = require("../../models/liveHistory.model");
const Livevideo = require("../../models/livevideo.model");

//private key
const admin = require("../../util/privateKey");

//momemt
const moment = require("moment");

//mongoose
const mongoose = require("mongoose");

const liveUserFunction = async (liveUser, data) => {
  liveUser.name = data.name;
  liveUser.userName = data.userName;
  liveUser.isFake = data.isFake;
  liveUser.image = data.image;
  liveUser.userId = data._id;

  await liveUser.save();
  return liveUser;
};

//live the user
exports.liveUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [existUser, existLiveUser] = await Promise.all([User.findOne({ _id: userId }), LiveUser.findOne({ userId: userId })]);

    if (!existUser) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (existUser.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (existLiveUser) {
      console.log("delete existLiveUser");
      await LiveUser.deleteOne({ userId: existUser._id });
    }

    //when user is live then create liveUser's history
    const liveHistory = new LiveHistory();
    liveHistory.userId = existUser._id;
    liveHistory.startTime = moment().format("HH:mm:ss");

    existUser.isLive = true;
    existUser.liveHistoryId = liveHistory._id;

    let liveUserData;
    const liveUser = new LiveUser();
    liveUser.liveHistoryId = liveHistory._id;
    liveUserData = await liveUserFunction(liveUser, existUser);

    await Promise.all([liveHistory.save(), existUser.save()]);

    res.status(200).json({
      status: true,
      message: "User is live Successfully.",
      data: liveUser,
    });

    //notification related
    const user = await User.find({
      isBlock: false,
      isLive: false,
      _id: { $ne: existUser._id },
    }).distinct("fcmToken");

    if (user.length !== 0) {
      const adminPromise = await admin;

      const payload = {
        tokens: user,
        notification: {
          title: `${existUser.name} is live now! 🚀✨`,
          body: "📺 Tap to join the live stream and catch the action! 👉🎥👀",
          image: existUser.image,
        },
        data: {
          type: "LIVE",
        },
      };

      adminPromise
        .messaging()
        .sendEachForMulticast(payload)
        .then((response) => {
          console.log("Successfully sent with response: ", response);

          if (response.failureCount > 0) {
            response.responses.forEach((res, index) => {
              if (!res.success) {
                console.error(`Error for token ${user[index]}:`, res.error.message);
              }
            });
          }
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get live user list
exports.getliveUserList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be needed." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (settingJSON.isFakeData) {
      console.log("fake data on");

      const [livevideo, realLive] = await Promise.all([
        Livevideo.aggregate([
          { $match: { isLive: true } },
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
            $addFields: {
              view: {
                $floor: {
                  $add: [
                    1,
                    {
                      $multiply: [50, { $rand: {} }],
                    },
                  ],
                },
              },
              liveHistoryId: null,
              isFollow: true,
            },
          },
          {
            $project: {
              _id: 1,
              isLive: 1,
              videoUrl: 1,
              name: "$user.name",
              userName: "$user.userName",
              image: "$user.image",
              isVerified: "$user.isVerified",
              countryFlagImage: "$user.countryFlagImage",
              isFake: "$user.isFake",
              liveHistoryId: 1,
              view: 1,
              isFollow: 1,
            },
          },
        ]),
        User.aggregate([
          {
            $match: {
              isBlock: false,
              isLive: true,
              _id: { $ne: userId },
            },
          },
          {
            $lookup: {
              from: "liveusers",
              let: { liveUserId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$$liveUserId", "$userId"],
                    },
                  },
                },
              ],
              as: "liveUser",
            },
          },
          {
            $unwind: {
              path: "$liveUser",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "followerfollowings",
              let: { liveUserId: "$_id", requestingUserId: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$toUserId", "$$liveUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                    },
                  },
                },
              ],
              as: "isFollow",
            },
          },
          {
            $addFields: {
              videoUrl: "",
            },
          },
          {
            $project: {
              _id: 1,
              isLive: 1,
              name: 1,
              userName: 1,
              image: 1,
              isVerified: 1,
              countryFlagImage: 1,
              videoUrl: 1,
              isFake: 1,
              liveHistoryId: { $cond: [{ $eq: ["$isLive", true] }, "$liveUser.liveHistoryId", null] },
              view: { $cond: [{ $eq: ["$isLive", true] }, "$liveUser.view", 0] },
              isFollow: { $cond: { if: { $gt: [{ $size: "$isFollow" }, 0] }, then: true, else: false } },
            },
          },
        ]),
      ]);

      const shuffledLiveVideo = livevideo.sort(() => Math.random() - 0.5);

      const combinedData = [...shuffledLiveVideo, ...realLive];

      const paginatedData = combinedData.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrive live user list.",
        liveUserList: paginatedData.length > 0 ? paginatedData : [],
      });
    } else {
      const data = await User.aggregate([
        {
          $match: {
            isBlock: false,
            isLive: true,
            _id: { $ne: userId },
          },
        },
        {
          $lookup: {
            from: "liveusers",
            let: { liveUserId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$liveUserId", "$userId"],
                  },
                },
              },
            ],
            as: "liveUser",
          },
        },
        {
          $unwind: {
            path: "$liveUser",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "followerfollowings",
            let: { liveUserId: "$_id", requestingUserId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$toUserId", "$$liveUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                  },
                },
              },
            ],
            as: "isFollow",
          },
        },
        {
          $addFields: {
            videoUrl: "",
          },
        },
        {
          $project: {
            _id: 1,
            isLive: 1,
            name: 1,
            userName: 1,
            image: 1,
            isVerified: 1,
            countryFlagImage: 1,
            videoUrl: 1,
            isFake: 1,
            liveHistoryId: { $cond: [{ $eq: ["$isLive", true] }, "$liveUser.liveHistoryId", null] },
            view: { $cond: [{ $eq: ["$isLive", true] }, "$liveUser.view", 0] },
            isFollow: { $cond: { if: { $gt: [{ $size: "$isFollow" }, 0] }, then: true, else: false } },
          },
        },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrive live user list.",
        liveUserList: data.length > 0 ? data : [],
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
