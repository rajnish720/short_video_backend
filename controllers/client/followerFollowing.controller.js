const FollowerFollowing = require("../../models/followerFollowing.model");

//import model
const User = require("../../models/user.model");
const Notification = require("../../models/notification.model");

//mongoose
const mongoose = require("mongoose");

//private key
const admin = require("../../util/privateKey");

//follow or unfollow the user
exports.followUnfollowUser = async (req, res) => {
  try {
    if (!req.query.fromUserId || !req.query.toUserId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const fromUserId = new mongoose.Types.ObjectId(req.query.fromUserId);
    const toUserId = new mongoose.Types.ObjectId(req.query.toUserId);

    const [fromUser, toUser, alreadyFollower] = await Promise.all([
      User.findOne({ _id: fromUserId }),
      User.findOne({ _id: toUserId }),
      FollowerFollowing.findOne({ fromUserId: fromUserId, toUserId: toUserId }),
    ]);

    if (!fromUser) {
      return res.status(200).json({ status: false, message: "fromUser does not found." });
    }

    if (fromUser.isBlock) {
      return res.status(200).json({ status: false, message: "fromUser blocked by the admin." });
    }

    if (!toUser) {
      return res.status(200).json({ status: false, message: "toUser does not found." });
    }

    if (toUser.isBlock) {
      return res.status(200).json({ status: false, message: "toUser blocked by the admin." });
    }

    if (fromUser._id.equals(toUser._id)) {
      return res.status(200).json({ status: false, message: "You can't follow your own account." });
    }

    if (alreadyFollower) {
      await FollowerFollowing.deleteOne({
        fromUserId: fromUser._id,
        toUserId: toUser._id,
      });

      return res.status(200).json({
        status: true,
        message: "Someone has just stopped following you",
        isFollow: false,
      });
    } else {
      console.log("else");

      const followerFollowing = new FollowerFollowing();
      followerFollowing.fromUserId = fromUser._id;
      followerFollowing.toUserId = toUser._id;
      await followerFollowing.save();

      res.status(200).json({
        status: true,
        message: "Someone Just followed You",
        isFollow: true,
      });

      if (!toUser.isBlock && toUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: toUser.fcmToken,
          notification: {
            title: "New Follower",
            body: `${fromUser.userName} started following you.`,
          },
          data: {
            type: "FOLLOW",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            const notification = new Notification();
            notification.userId = toUser._id; //login userId i.e, to whom notification send
            notification.otherUserId = fromUser._id;
            notification.title = "Following Notification";
            notification.message = `${fromUser.userName} started following you.`;
            notification.image = fromUser.image;
            notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            await notification.save();
          })
          .catch((error) => {
            console.log("Error sending message:      ", error);
          });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get follower or following list of the particular user
exports.followerFollowingList = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.type) {
      return res.status(200).json({ status: false, message: "userId and type must be required." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    if (req.query.type === "followerList") {
      const [user, followerList] = await Promise.all([
        User.findOne({ _id: userId }).lean(),
        FollowerFollowing.find({ toUserId: userId }).populate("fromUserId", "_id name userName image isVerified isFake").sort({ createdAt: -1 }),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      return res.status(200).json({
        status: true,
        message: `Retrive ${req.query.type} user for the particular user.`,
        followerFollowing: followerList,
      });
    } else if (req.query.type === "followingList") {
      const [user, followingList] = await Promise.all([
        User.findOne({ _id: userId }).lean(),
        FollowerFollowing.find({ fromUserId: userId }).populate("toUserId", "_id name userName image isVerified isFake").sort({ createdAt: -1 }),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      return res.status(200).json({
        status: true,
        message: `Retrive ${req.query.type} user for the particular user.`,
        followerFollowing: followingList,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
