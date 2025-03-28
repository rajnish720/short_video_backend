const ChatRequest = require("../../models/chatRequest.model");

//import model
const User = require("../../models/user.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");

//private key
const admin = require("../../util/privateKey");

//day.js
const dayjs = require("dayjs");

//mongoose
const mongoose = require("mongoose");

//get thumblist of pending message requests
exports.getMessageRequestThumb = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "UserId is required." });
    }

    const now = dayjs();
    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [user, messageRequests] = await Promise.all([
      User.findById(userId),
      ChatRequestTopic.aggregate([
        {
          $match: {
            status: 1,
            receiverUserId: userId,
          },
        },
        {
          $lookup: {
            from: "users",
            let: {
              senderUserId: "$senderUserId",
              receiverUserId: "$receiverUserId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $cond: {
                      if: { $eq: ["$$senderUserId", userId] },
                      then: { $eq: ["$$receiverUserId", "$_id"] },
                      else: { $eq: ["$$senderUserId", "$_id"] },
                    },
                  },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "chatrequests",
            localField: "_id",
            foreignField: "chatRequestTopicId",
            as: "chatrequests",
          },
        },
        {
          $unwind: {
            path: "$chatrequests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { "chatrequests.createdAt": -1 },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$user.name" },
            userName: { $first: "$user.userName" },
            image: { $first: "$user.image" },
            isOnline: { $first: "$user.isOnline" },
            isVerified: { $first: "$user.isVerified" },
            isFake: { $first: "$user.isFake" },
            userId: { $first: "$user._id" },
            chatRequestTopicId: { $first: "$chatrequests.chatRequestTopicId" },
            senderUserId: { $first: "$chatrequests.senderUserId" },
            lastChatMessageTime: { $first: "$chatrequests.createdAt" },
            message: { $first: "$chatrequests.message" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $ne: ["$chatrequests.senderUserId", userId] }, { $eq: ["$chatrequests.isRead", false] }],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            chatRequestTopicId: 1,
            senderUserId: 1,
            message: 1,
            name: 1,
            userName: 1,
            image: 1,
            isOnline: 1,
            isVerified: 1,
            isFake: 1,
            userId: 1,
            unreadCount: 1,
            time: {
              $let: {
                vars: {
                  timeDiff: { $subtract: [now.toDate(), "$lastChatMessageTime"] },
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
        { $sort: { time: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Retrieved pending message requests.", data: messageRequests });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//accept OR decline message request by receiver
exports.handleMessageRequest = async (req, res) => {
  try {
    const { messageRequestTopicId, type } = req.query;

    if (!messageRequestTopicId || !type) {
      return res.status(200).json({ status: false, message: "messageRequestTopicId and type are required." });
    }

    const chatRequestTopicId = new mongoose.Types.ObjectId(messageRequestTopicId);

    const chatRequestTopic = await ChatRequestTopic.findOne({ _id: chatRequestTopicId });

    if (!chatRequestTopic) {
      return res.status(200).json({ status: false, message: "Message request topic not found." });
    }

    const [senderUser, receiverUser] = await Promise.all([User.findById(chatRequestTopic.senderUserId), User.findById(chatRequestTopic.receiverUserId)]);

    if (!senderUser || !receiverUser) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (type === "accept") {
      res.status(200).json({ status: true, message: "Message request accepted and chat created." });

      const foundChatTopic = await ChatTopic.findOne({
        $or: [
          { $and: [{ senderUserId: chatRequestTopic.senderUserId }, { receiverUserId: chatRequestTopic.receiverUserId }] },
          { $and: [{ senderUserId: chatRequestTopic.receiverUserId }, { receiverUserId: chatRequestTopic.senderUserId }] },
        ],
      });

      foundChatTopic.isAccepted = true;

      await Promise.all([
        foundChatTopic?.save(),
        Chat.updateMany({ isRead: true }),
        ChatRequest.deleteMany({ chatRequestTopicId: chatRequestTopicId }),
        ChatRequestTopic.findOneAndDelete({ _id: chatRequestTopicId }),
      ]);

      if (!receiverUser.isBlock && receiverUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `🗨️ New Message from ${senderUser.name}`,
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

      if (!senderUser.isBlock && senderUser.fcmToken !== null) {
        const adminPromise = await admin;

        const senderPayload = {
          token: senderUser.fcmToken,
          notification: {
            title: "✅ Message Request Accepted ✅",
            body: `🚀 ${receiverUser.name} is ready to chat! 💬 Start your conversation now!`,
          },
          data: {
            type: "CHAT_REQUEST",
          },
        };

        adminPromise
          .messaging()
          .send(senderPayload)
          .then((response) => {
            console.log("Sender notification sent successfully with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending sender notification: ", error);
          });
      }
    } else if (type === "decline") {
      res.status(200).json({ status: true, message: "Message request declined." });

      const foundChatTopic = await ChatTopic.findOne({
        isAccepted: false,
        $or: [
          { $and: [{ senderUserId: chatRequestTopic.senderUserId }, { receiverUserId: chatRequestTopic.receiverUserId }] },
          { $and: [{ senderUserId: chatRequestTopic.receiverUserId }, { receiverUserId: chatRequestTopic.senderUserId }] },
        ],
      });

      const [chatRequests, chats] = await Promise.all([ChatRequest.find({ chatRequestTopicId: chatRequestTopicId }), Chat.find({ chatTopicId: foundChatTopic._id })]);

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

      await Promise.all([
        Chat.deleteMany({ chatTopicId: foundChatTopic._id }),
        foundChatTopic.deleteOne(),
        ChatRequest.deleteMany({ chatRequestTopicId: chatRequestTopicId }),
        ChatRequestTopic.findOneAndDelete({ _id: chatRequestTopicId }),
      ]);

      if (!senderUser.isBlock && senderUser.fcmToken && senderUser.fcmToken !== null) {
        const adminPromise = await admin;
        const payload = {
          token: senderUser.fcmToken,
          notification: {
            title: "⚠️ Message Request Declined ❌",
            body: `😔 ${receiverUser.name} has declined your message request. Maybe next time!`,
          },
          data: {
            type: "CHAT_REQUEST",
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
    } else {
      return res.status(200).json({ status: false, message: "Invalid type provided. Use 'accept' or 'decline'." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get old chat of particular message request
exports.getOldMessageRequest = async (req, res) => {
  try {
    if (!req.query.topicId) {
      return res.status(200).json({ status: false, message: "topicId must be requried." });
    }

    const topicId = new mongoose.Types.ObjectId(req.query.topicId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [updatedIsRead, chat] = await Promise.all([
      ChatRequest.updateMany({ $and: [{ chatRequestTopicId: topicId }, { isRead: false }] }, { $set: { isRead: true } }, { new: true }),
      ChatRequest.find({ chatRequestTopicId: topicId })
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({ status: true, message: "Retrive old chat request's chat between the users.", chatTopic: topicId, chat: chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete all message request of particular receiver user
exports.deleteMessageRequest = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(200).json({ status: false, message: "userId must be required." });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    const [user, foundChatTopic, foundChatRequestTopic] = await Promise.all([
      User.findById(userObjId),
      ChatTopic.find({ $or: [{ senderUserId: userObjId }, { receiverUserId: userObjId }] }),
      ChatRequestTopic.find({ receiverUserId: userObjId }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    res.status(200).json({ status: true, message: "All message requests deleted." });

    const [chatRequests, chats] = await Promise.all([
      ChatRequest.find({ chatRequestTopicId: { $in: foundChatRequestTopic.map((topic) => topic._id) } }),
      Chat.find({ chatTopicId: { $in: foundChatTopic.map((topic) => topic._id) } }),
    ]);

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

    await Promise.all([
      Chat.deleteMany({ chatTopicId: foundChatTopic.map((topic) => topic._id) }),
      ChatTopic.deleteMany({ _id: foundChatTopic.map((topic) => topic._id) }),
      ChatRequest.deleteMany({ chatRequestTopicId: foundChatRequestTopic.map((topic) => topic._id) }),
      ChatRequestTopic.deleteMany({ receiverUserId: userObjId }),
    ]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
