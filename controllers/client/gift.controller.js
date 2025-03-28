const Gift = require("../../models/gift.model");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");
const History = require("../../models/history.model");
const Notification = require("../../models/notification.model");
const LiveVideo = require("../../models/livevideo.model");

//mongoose
const mongoose = require("mongoose");

//private key
const admin = require("../../util/privateKey");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//get gifts (when view live of another user OR send to particular user's video)
exports.getGiftsForUser = async (req, res) => {
  try {
    const gifts = await Gift.find().sort({ coin: 1 }).lean();

    return res.status(200).json({ status: true, message: "Retrive gifts.", data: gifts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//send gift to particular user's video
exports.sendGiftByUser = async (req, res) => {
  try {
    if (!req.query.videoId || !req.query.userId || !req.query.giftId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const uniqueId = generateHistoryUniqueId();
    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);
    const giftId = new mongoose.Types.ObjectId(req.query.giftId);

    const [senderUser, video, gift] = await Promise.all([User.findById(userId), Video.findById(videoId), Gift.findById(giftId)]);
    const coin = Number(gift.coin);

    if (!senderUser) {
      return res.status(200).json({ status: false, message: "Sender user does not found." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "Video does not found." });
    }

    if (!gift) {
      return res.status(200).json({ status: false, message: "Gift does not found." });
    }

    if (senderUser.coin < coin) {
      return res.status(200).json({ status: false, message: "You don't have sufficient funds to send the gift." });
    }

    const receiverUser = await User.findById(video.userId);
    if (!receiverUser) {
      return res.status(200).json({ status: false, message: "Recevier user of that video does not found." });
    }

    res.status(200).json({ status: true, message: "Send gift by user to particular video." });

    const [updatedReceiverUser, updatedSenderUser, saveHistory] = await Promise.all([
      User.updateOne(
        { _id: receiverUser._id },
        {
          $inc: {
            coin: coin,
            receivedCoin: coin,
            receivedGift: 1,
          },
        },
        { new: true }
      ),
      User.updateOne({ _id: senderUser._id }, { $inc: { coin: -coin } }, { new: true }),
      History.create({
        userId: senderUser._id,
        otherUserId: receiverUser._id,
        coin: coin,
        uniqueId: uniqueId,
        type: 1,
        giftId: gift._id,
        videoId: video._id,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    if (receiverUser.fcmToken && !receiverUser.isBlock && receiverUser.fcmToken !== null) {
      const adminPromise = await admin;

      const payload = {
        token: receiverUser.fcmToken,
        notification: {
          title: "New Gift Received",
          body: `You have received a gift from ${senderUser.name}`,
          image: gift?.image,
        },
        data: {
          type: "GIFT",
        },
      };

      adminPromise
        .messaging()
        .send(payload)
        .then(async (response) => {
          console.log("Successfully sent with response: ", response);

          const notification = new Notification();
          notification.userId = receiverUser._id; //login userId i.e, to whom notification send
          notification.otherUserId = senderUser._id;
          notification.title = "New Gift Received";
          notification.message = `You have received a gift from ${senderUser.name}`;
          notification.image = gift.image;
          notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
          await notification.save();
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

//send gift to fake live video
exports.sendGiftTolive = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.giftId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const uniqueId = generateHistoryUniqueId();
    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const giftId = new mongoose.Types.ObjectId(req.query.giftId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [senderUser, gift, video] = await Promise.all([User.findById(userId), Gift.findById(giftId), LiveVideo.findById(videoId)]);
    const coin = Number(gift.coin);

    const receiverUser = await User.findById(video.userId);
    if (!receiverUser) {
      return res.status(200).json({ status: false, message: "Recevier user of that video does not found." });
    }

    if (!senderUser) {
      return res.status(200).json({ status: false, message: "Sender user does not found." });
    }

    if (!gift) {
      return res.status(200).json({ status: false, message: "Gift does not found." });
    }

    if (senderUser.coin < coin) {
      return res.status(200).json({ status: false, message: "Insufficient funds to send the gift." });
    }

    res.status(200).json({ status: true, message: "Gift successfully sent to the user." });

    const [updatedSenderUser, saveHistory] = await Promise.all([
      User.updateOne({ _id: senderUser._id }, { $inc: { coin: -coin } }, { new: true }),
      History.create({
        userId: senderUser._id,
        otherUserId: receiverUser._id,
        coin: coin,
        uniqueId: uniqueId,
        type: 1,
        giftId: gift._id,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};
