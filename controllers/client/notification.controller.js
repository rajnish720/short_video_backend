const Notification = require("../../models/notification.model");

//import model
const User = require("../../models/user.model");

//mongoose
const mongoose = require("mongoose");

//get notification list for the particular user
exports.notificationList = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, notification] = await Promise.all([
      User.findById(userId),
      Notification.aggregate([
        {
          $match: { userId: userId },
        },
        {
          $lookup: {
            from: "users",
            localField: "otherUserId",
            foreignField: "_id",
            as: "otherUserId",
          },
        },
        {
          $unwind: {
            path: "$otherUserId",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            message: 1,
            date: 1,
            image: 1,
            name: "$otherUserId.name",
            userName: "$otherUserId.userName",
            otherUserId: "$otherUserId._id",
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

    return res.status(200).json({
      status: true,
      message: "Retrive the notification list by the user.",
      notification: notification,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//clear all notification for particular user
exports.clearNotificationHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, clearNotificationHistory] = await Promise.all([User.findOne({ _id: userId }), Notification.deleteMany({ userId: userId })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (clearNotificationHistory.deletedCount > 0) {
      return res.status(200).json({
        status: true,
        message: "Successfully cleared all Notification history for the user.",
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "Notification history not found for the user.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
