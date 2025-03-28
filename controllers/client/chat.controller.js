const Chat = require("../../models/chat.model");

//import models
const ChatTopic = require("../../models/chatTopic.model");
const User = require("../../models/user.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const ChatRequest = require("../../models/chatRequest.model");

//private key
const admin = require("../../util/privateKey");

//deleteFiles
const { deleteFiles } = require("../../util/deletefile");

//mongoose
const mongoose = require("mongoose");

//send a message or create a message request ( image or audio )
exports.createChat = async (req, res) => {
  try {
    if (!req.query.senderUserId || !req.query.receiverUserId || !req.query.messageType) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const messageType = Number(req.query.messageType);
    const senderUserId = new mongoose.Types.ObjectId(req.query.senderUserId);
    const receiverUserId = new mongoose.Types.ObjectId(req.query.receiverUserId);

    let chatTopic;
    const [follow, senderUser, receiverUser, foundChatTopic] = await Promise.all([
      FollowerFollowing.findOne({ fromUserId: senderUserId, toUserId: receiverUserId }),
      User.findById(senderUserId),
      User.findById(receiverUserId),
      ChatTopic.findOne({
        $or: [{ $and: [{ senderUserId: senderUserId }, { receiverUserId: receiverUserId }] }, { $and: [{ senderUserId: receiverUserId }, { receiverUserId: senderUserId }] }],
      }),
    ]);

    if (!senderUser) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "SenderUser does not found." });
    }

    if (!receiverUser) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "ReceiverUser dose not found." });
    }

    if (!follow && !foundChatTopic?.isAccepted) {
      console.log("Users do not follow each other.");

      let chatRequestTopic;
      const foundChatRequestTopic = await ChatRequestTopic.findOne({
        $or: [{ $and: [{ senderUserId: senderUserId }, { receiverUserId: receiverUserId }] }, { $and: [{ senderUserId: receiverUserId }, { receiverUserId: senderUserId }] }],
      });

      chatRequestTopic = foundChatRequestTopic;

      if (!chatRequestTopic) {
        chatRequestTopic = new ChatRequestTopic();

        chatRequestTopic.senderUserId = senderUser._id;
        chatRequestTopic.receiverUserId = receiverUser._id;
        chatRequestTopic.status = 1;
      }

      const messageRequest = new ChatRequest();

      messageRequest.senderUserId = senderUser._id;

      if (messageType == 2) {
        messageRequest.messageType = 2;
        messageRequest.message = "📸 Image";
        messageRequest.image = req.files ? req?.files?.image[0].path : "";
      } else if (messageType == 3) {
        messageRequest.messageType = 3;
        messageRequest.message = "🎤 Audio";
        messageRequest.audio = req.files ? req?.files?.audio[0].path : "";
      } else {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "messageType must be passed valid." });
      }

      messageRequest.chatRequestTopicId = chatRequestTopic._id;
      messageRequest.date = new Date().toLocaleString();

      chatRequestTopic.chatRequestId = messageRequest._id;

      chatTopic = foundChatTopic;

      if (!chatTopic) {
        chatTopic = new ChatTopic();

        chatTopic.senderUserId = senderUser._id;
        chatTopic.receiverUserId = receiverUser._id;
        isAccepted = false;
      }

      const chat = new Chat();
      chat.senderUserId = messageRequest.senderUserId;
      chat.messageType = messageRequest.messageType;
      chat.message = messageRequest.message;
      chat.image = messageRequest.image;
      chat.audio = messageRequest.audio;
      chat.chatTopicId = chatTopic._id;
      chat.date = new Date().toLocaleString();

      chatTopic.chatId = chat._id;

      await Promise.all([chatRequestTopic.save(), messageRequest.save(), chatTopic.save(), chat.save()]);

      res.status(200).json({
        status: true,
        message: "Message request created successfully.",
        chat: messageRequest,
      });

      if (!receiverUser.isBlock && receiverUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `New Message Request from ${senderUser.name}`,
            body: `${senderUser.name} sent a message request.`,
            image: senderUser.image,
          },
          data: {
            type: "CHAT_REQUEST",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent notification with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending notification: ", error);
          });
      }
    } else {
      console.log("Users follow each other.");

      chatTopic = foundChatTopic;

      if (!chatTopic) {
        chatTopic = new ChatTopic();

        chatTopic.senderUserId = senderUser._id;
        chatTopic.receiverUserId = receiverUser._id;
      }

      const chat = new Chat();

      chat.senderUserId = senderUser._id;

      if (messageType == 2) {
        chat.messageType = 2;
        chat.message = "📸 Image";
        chat.image = req.files ? req?.files?.image[0].path : "";
      } else if (messageType == 3) {
        chat.messageType = 3;
        chat.message = "🎤 Audio";
        chat.audio = req.files ? req?.files?.audio[0].path : "";
      } else {
        if (req.files) deleteFiles(req.files);
        return res.status(200).json({ status: false, message: "messageType must be passed valid." });
      }

      chat.chatTopicId = chatTopic._id;
      chat.date = new Date().toLocaleString();

      chatTopic.chatId = chat._id;
      chatTopic.isAccepted = true;

      await Promise.all([chat.save(), chatTopic.save()]);

      res.status(200).json({
        status: true,
        message: "Message sent successfully.",
        chat: chat,
      });

      if (!receiverUser.isBlock && receiverUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `🗨️ New Message from ${senderUser?.name}`,
            body: `${senderUser.name} sent you a message 📩`,
            image: senderUser.image,
          },
          data: {
            type: "CHAT",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message:      ", error);
          });
      }
    }
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get old chat between the users
exports.getOldChat = async (req, res) => {
  try {
    if (!req.query.senderUserId || !req.query.receiverUserId) {
      return res.status(200).json({ status: false, message: "senderUserId and receiverUserId must be requried." });
    }

    const senderUserId = new mongoose.Types.ObjectId(req.query.senderUserId);
    const receiverUserId = new mongoose.Types.ObjectId(req.query.receiverUserId);

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let chatTopic;
    const [senderUser, receiverUser, foundChatTopic] = await Promise.all([
      User.findById(senderUserId),
      User.findById(receiverUserId),
      ChatTopic.findOne({
        $or: [{ $and: [{ senderUserId: senderUserId }, { receiverUserId: receiverUserId }] }, { $and: [{ senderUserId: receiverUserId }, { receiverUserId: senderUserId }] }],
      }),
    ]);

    chatTopic = foundChatTopic;

    if (!senderUser) {
      return res.status(200).json({ status: false, message: "SenderUser does not found." });
    }

    if (!receiverUser) {
      return res.status(200).json({ status: false, message: "ReceiverUser dose not found." });
    }

    if (!chatTopic) {
      chatTopic = new ChatTopic();

      chatTopic.senderUserId = senderUser._id;
      chatTopic.receiverUserId = receiverUser._id;
    }

    const [savedChatTopic, updatedIsRead] = await Promise.all([
      chatTopic.save(),
      Chat.updateMany({ $and: [{ chatTopicId: chatTopic._id }, { isRead: false }] }, { $set: { isRead: true } }, { new: true }),
    ]);

    console.log("updatedIsRead  ", updatedIsRead);

    const chat = await Chat.find({ chatTopicId: chatTopic._id })
      .sort({ createdAt: -1 })
      .skip((start - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({ status: true, message: "Retrive old chat between the users.", chatTopic: chatTopic._id, chat: chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
