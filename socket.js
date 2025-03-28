///import model
const User = require("./models/user.model");
const ChatTopic = require("./models/chatTopic.model");
const Chat = require("./models/chat.model");
const LiveUser = require("./models/liveUser.model");
const LiveView = require("./models/liveView.model");
const LiveHistory = require("./models/liveHistory.model");
const History = require("./models/history.model");
const FollowerFollowing = require("./models/followerFollowing.model");
const ChatRequestTopic = require("./models/chatRequestTopic.model");
const ChatRequest = require("./models/chatRequest.model");

//private key
const admin = require("./util/privateKey");

//moment
const moment = require("moment");

//mongoose
const mongoose = require("mongoose");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("./util/generateHistoryUniqueId");

io.on("connection", async (socket) => {
  console.log("Socket Connection done Client ID: ", socket.id);
  console.log("socket.connected:                 ", socket.connected);
  console.log("Current rooms:", socket.rooms);
  console.log("socket.handshake.query", socket.handshake.query);

  const { globalRoom } = socket.handshake.query;
  console.log("globalRoom", globalRoom);

  const id = globalRoom && globalRoom.split(":")[1];
  console.log("socket connected with userId:   ", id);

  socket.join(globalRoom);

  if (globalRoom) {
    const user = await User.findById(id);
    if (user) {
      user.isOnline = true;
      await user.save();
    }
  }

  //chat
  socket.on("message", async (data) => {
    console.log("data in message =====================================  ", data);

    const parseData = JSON.parse(data);
    console.log("parseData", parseData);

    const [follow, chatTopic] = await Promise.all([
      FollowerFollowing.findOne({ fromUserId: parseData?.senderUserId, toUserId: parseData?.receiverUserId }),
      ChatTopic.findById(parseData?.chatTopicId).populate("senderUserId", "_id name userName image fcmToken isBlock").populate("receiverUserId", "_id name userName image fcmToken isBlock"),
    ]);

    if (!follow && !chatTopic.isAccepted) {
      console.log("Users do not follow each other in message.");

      let chatRequestTopic;
      const foundChatTopic = await ChatRequestTopic.findOne({
        $or: [
          { $and: [{ senderUserId: parseData?.senderUserId }, { receiverUserId: parseData?.receiverUserId }] },
          { $and: [{ senderUserId: parseData?.receiverUserId }, { receiverUserId: parseData?.senderUserId }] },
        ],
      });

      chatRequestTopic = foundChatTopic;

      if (!chatRequestTopic) {
        chatRequestTopic = new ChatRequestTopic();

        chatRequestTopic.senderUserId = parseData?.senderUserId;
        chatRequestTopic.receiverUserId = parseData?.receiverUserId;
      }

      if (parseData?.messageType == 1) {
        const messageRequest = new ChatRequest();

        messageRequest.senderUserId = parseData?.senderUserId;
        messageRequest.messageType = 1;
        messageRequest.message = parseData?.message;
        messageRequest.image = "";
        messageRequest.chatRequestTopicId = chatRequestTopic._id;
        messageRequest.date = new Date().toLocaleString();

        chatRequestTopic.chatRequestId = messageRequest._id;

        const chat = new Chat();
        chat.senderUserId = messageRequest.senderUserId;
        chat.messageType = messageRequest.messageType;
        chat.message = messageRequest.message;
        chat.image = messageRequest.image;
        chat.chatTopicId = chatTopic?._id;
        chat.date = new Date().toLocaleString();

        chatTopic.chatId = chat?._id;

        await Promise.all([chatRequestTopic.save(), messageRequest.save(), chatTopic.save(), chat.save()]);

        io.in("globalRoom:" + chatTopic?.senderUserId?._id.toString()).emit("messageRequest", { data: data, messageId: messageRequest._id });
        io.in("globalRoom:" + chatTopic?.receiverUserId?._id.toString()).emit("messageRequest", { data: data, messageId: messageRequest._id });

        let receiverUser, senderUser;
        if (chatTopic.senderUserId._id.toString() === parseData.senderUserId.toString()) {
          senderUser = chatTopic.senderUserId;
          receiverUser = chatTopic.receiverUserId;
        } else if (chatTopic.receiverUserId._id) {
          senderUser = chatTopic.receiverUserId;
          receiverUser = chatTopic.senderUserId;
        }

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
        console.log("other messageType in messageRequest");

        io.in("globalRoom:" + chatTopic?.senderUserId?._id.toString()).emit("messageRequest", { data: data });
        io.in("globalRoom:" + chatTopic?.receiverUserId?._id.toString()).emit("messageRequest", { data: data });
      }
    } else {
      console.log("Users follow each other in message.");

      if (chatTopic && parseData?.messageType == 1) {
        const chat = new Chat();

        chat.senderUserId = parseData?.senderUserId;
        chat.messageType = 1;
        chat.message = parseData?.message;
        chat.image = "";
        chat.chatTopicId = chatTopic._id;
        chat.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        chatTopic.chatId = chat._id;
        chatTopic.isAccepted = true;

        await Promise.all([chat.save(), chatTopic.save()]);

        io.in("globalRoom:" + chatTopic?.senderUserId?._id.toString()).emit("message", { data: data, messageId: chat._id });
        io.in("globalRoom:" + chatTopic?.receiverUserId?._id.toString()).emit("message", { data: data, messageId: chat._id });

        let receiverUser, senderUser;
        if (chatTopic.senderUserId._id.toString() === parseData.senderUserId.toString()) {
          senderUser = chatTopic.senderUserId;
          receiverUser = chatTopic.receiverUserId;
        } else if (chatTopic.receiverUserId._id) {
          senderUser = chatTopic.receiverUserId;
          receiverUser = chatTopic.senderUserId;
        }

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
      } else {
        console.log("other messageType");

        io.in("globalRoom:" + chatTopic?.senderUserId?._id.toString()).emit("message", { data: data });
        io.in("globalRoom:" + chatTopic?.receiverUserId?._id.toString()).emit("message", { data: data });
      }
    }
  });

  socket.on("messageRead", async (data) => {
    try {
      console.log("Data in messageRead event:", data);

      const parsedData = JSON.parse(data);
      console.log("Data in messageRead event:", parsedData.messageId);

      const updated = await Chat.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(parsedData.messageId) }, { $set: { isRead: true } }, { new: true });

      if (!updated) {
        console.log(`No message found with ID ${parsedData.messageId}`);
      } else {
        console.log(`Updated isRead to true for message with ID: ${updated._id}`);
      }
    } catch (error) {
      console.error("Error updating messages:", error);
    }
  });

  socket.on("messageRequestRead", async (data) => {
    try {
      console.log("Data in messageRequestRead event:", data);

      const parsedData = JSON.parse(data);
      console.log("Data in messageRequestRead event:", parsedData.messageId);

      const updated = await ChatRequest.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(parsedData.messageId) }, { $set: { isRead: true } }, { new: true });

      if (!updated) {
        console.log(`No message found with ID ${parsedData.messageId}`);
      } else {
        console.log(`Updated isRead to true for message with ID: ${updated._id}`);
      }
    } catch (error) {
      console.error("Error updating messages:", error);
    }
  });

  //live-streaming
  socket.on("liveRoomConnect", async (data) => {
    console.log("liveRoomConnect  connected:   ");

    const parsedData = JSON.parse(data);
    console.log("liveRoomConnect connected (parsed):   ", parsedData);

    const sockets = await io.in(globalRoom).fetchSockets();
    sockets?.length ? sockets[0].join(parsedData.liveHistoryId) : console.log("sockets not able to emit");

    io.in(parsedData.liveHistoryId).emit("liveRoomConnect", data);
  });

  socket.on("addView", async (data) => {
    console.log("data in addView:  ", data);

    const dataOfaddView = JSON.parse(data);
    console.log("parsed data in addView:  ", dataOfaddView);

    const [sockets, user, liveUser, existLiveView] = await Promise.all([
      io.in(globalRoom).fetchSockets(),
      User.findById(dataOfaddView.userId),
      LiveUser.findOne({ liveHistoryId: dataOfaddView.liveHistoryId }),
      LiveView.findOne({
        userId: dataOfaddView.userId,
        liveHistoryId: dataOfaddView.liveHistoryId,
      }),
    ]);

    sockets?.length ? sockets[0].join(dataOfaddView.liveHistoryId) : console.log("sockets not able to emit");

    console.log("sockets in addView:  ", sockets?.length);
    console.log("existLiveView in addView:  ", existLiveView);

    const socket = await io.in(dataOfaddView.liveHistoryId).fetchSockets();
    console.log("liveHistoryId sockets in addView:  ", socket?.length);

    if (user && liveUser) {
      if (!existLiveView) {
        console.log("new liveView in addView ");

        const liveView = new LiveView();
        liveView.userId = dataOfaddView.userId;
        liveView.liveHistoryId = dataOfaddView.liveHistoryId;
        liveView.name = user.name;
        liveView.userName = user.userName;
        liveView.image = user.image;
        await liveView.save();
      }
    }

    const view = await LiveView.find({ liveHistoryId: dataOfaddView.liveHistoryId });
    console.log("view in addView: ", view.length);

    if (liveUser) {
      liveUser.view = view.length;
      await liveUser.save();
    }

    if (view.length === 0) {
      return io.in(dataOfaddView.liveHistoryId).emit("addView", view.length);
    }

    io.in(dataOfaddView.liveHistoryId).emit("addView", view.length);
  });

  socket.on("lessView", async (data) => {
    console.log("data in lessView:  ", data);

    const dataOflessView = JSON.parse(data);
    console.log("parsed data in lessView:  ", dataOflessView);

    const [sockets, liveUser, existLiveView] = await Promise.all([
      io.in(globalRoom).fetchSockets(),
      LiveUser.findOne({ liveHistoryId: dataOflessView.liveHistoryId }),
      LiveView.findOne({
        userId: dataOflessView.userId,
        liveHistoryId: dataOflessView.liveHistoryId,
      }),
    ]);

    sockets?.length ? sockets[0].leave(dataOflessView.liveHistoryId) : console.log("sockets not able to leave in lessView");
    console.log("sockets in lessView:  ", sockets?.length);

    const socket = await io.in(dataOflessView.liveHistoryId).fetchSockets();
    console.log("liveHistoryId sockets in lessView:  ", socket?.length);

    if (existLiveView) {
      console.log("existLiveView deleted in lessView for that liveHistoryId");
      await existLiveView.deleteOne();
    }

    const liveView = await LiveView.find({ liveHistoryId: dataOflessView.liveHistoryId });
    console.log("liveView in lessView:  ", liveView.length);

    if (liveUser) {
      liveUser.view = liveView.length;
      await liveUser.save();
    }

    if (liveView.length === 0) {
      return io.in(dataOflessView.liveHistoryId).emit("lessView", liveView.length);
    }

    io.in(dataOflessView?.liveHistoryId).emit("lessView", liveView.length);
  });

  socket.on("liveChat", async (data) => {
    console.log("data in liveChat: ", data);

    const dataOfComment = JSON.parse(data);
    console.log("parsed data in liveChat: ", dataOfComment);

    const sockets = await io.in(globalRoom).fetchSockets();
    console.log("sockets in liveChat:  ", sockets.length);

    sockets?.length ? sockets[0].join(dataOfComment.liveHistoryId) : console.log("sockets not able to emit liveChat");

    const socket = await io.in(dataOfComment.liveHistoryId).fetchSockets();
    console.log("liveHistoryId socket in comment:  ", socket.length);

    io.in(dataOfComment?.liveHistoryId).emit("liveChat", data);

    const liveHistory = await LiveHistory.findById(dataOfComment.liveHistoryId);
    if (liveHistory) {
      liveHistory.totalLiveChat += 1;
      await liveHistory.save();
    }
  });

  socket.on("gift", async (data) => {
    const giftData = JSON.parse(data);
    console.log("data in gift ===================", giftData);

    try {
      const uniqueId = generateHistoryUniqueId();

      const [senderUser, receiverUser] = await Promise.all([User.findById(giftData.senderUserId), User.findById(giftData.receiverUserId)]);

      if (!senderUser) {
        console.log("Sender user not found");
        io.in("globalRoom:" + giftData.senderUserId).emit("gift", "Sender user not found");
        return;
      }

      if (!receiverUser) {
        console.log("Receiver user not found");
        io.in("globalRoom:" + giftData.receiverUserId).emit("gift", "Receiver user not found");
        return;
      }

      //const totalCoin = giftData.giftCount * giftData.coin;
      const coin = Math.abs(giftData.coin);

      if (senderUser.coin < coin) {
        console.log("senderUser does not have sufficient coin ");
        io.in("globalRoom:" + giftData.senderUserId).emit("gift", "you don't have sufficient coin");
        return;
      }

      const [updatedSenderUser, updatedReceiverUser] = await Promise.all([
        User.findOneAndUpdate({ _id: senderUser._id }, { $inc: { coin: -coin } }, { new: true }),
        User.findOneAndUpdate(
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
      ]);

      const sockets = await io.in(globalRoom).fetchSockets();
      console.log("sockets in gift:  ", sockets.length);

      sockets?.length ? sockets[0].join(giftData.liveHistoryId) : console.log("sockets not able to emit gift");

      const socket = await io.in(giftData.liveHistoryId).fetchSockets();
      console.log("liveHistoryId socket in gift:  ", socket.length);

      const eventData = {
        giftData: giftData,
        senderUser: updatedSenderUser,
        receiverUser: updatedReceiverUser,
      };

      io.in(giftData.liveHistoryId).emit("gift", eventData);

      await Promise.all([
        History.create({
          userId: senderUser._id,
          otherUserId: receiverUser._id, // Assuming you want this to always be receiverUser._id (liveUser always be receiver)
          coin: coin,
          uniqueId: uniqueId,
          type: 1,
          giftId: giftData.giftId,
          videoId: null,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
        LiveHistory.findOneAndUpdate({ _id: giftData.liveHistoryId }, { $inc: { totalGift: 1 } }, { new: true }),
      ]);
    } catch (error) {
      console.error("Error in normalUserGift:", error);
    }
  });

  socket.on("endLive", async (data) => {
    console.log("data in endLive: ", data);

    const parsedData = JSON.parse(data);
    console.log("parsedData in endLive: ", parsedData);

    io.in(parsedData?.liveHistoryId).emit("endLive", data);

    try {
      const [user, liveHistory] = await Promise.all([User.findOne({ liveHistoryId: parsedData?.liveHistoryId }), LiveHistory.findById(parsedData?.liveHistoryId)]);

      if (user) {
        if (user.isLive) {
          liveHistory.endTime = moment().format("HH:mm:ss");

          var date1 = moment(liveHistory.startTime, "HH:mm:ss");
          var date2 = moment(liveHistory.endTime, "HH:mm:ss");

          var timeDifference = date2.diff(date1);
          var duration = moment.duration(timeDifference);
          var durationTime = moment.utc(duration.asMilliseconds()).format("HH:mm:ss");

          liveHistory.duration = durationTime;

          const [updateLiveHistory, userUpdate] = await Promise.all([
            liveHistory.save(),
            User.findOneAndUpdate({ _id: user._id }, { $set: { isLive: false, liveHistoryId: null } }, { new: true }),
            LiveUser.deleteOne({ userId: user._id }),
            LiveView.deleteMany({ liveHistoryId: liveHistory._id }),
          ]);

          console.log("userUpdate in endLive: ", userUpdate);
          console.log("liveUser and related liveView deleted in endLive");
        }

        const sockets = await io.in(parsedData?.liveHistoryId).fetchSockets();
        console.log("sockets.length: ", sockets.length);

        sockets?.length ? io.socketsLeave(parsedData?.liveHistoryId) : console.log("sockets not able to leave in endLive");
      }
    } catch (error) {
      console.error("Error in endLive:", error);
    }
  });

  socket.on("disconnect", async (reason) => {
    console.log(`socket disconnect ===============`, id, socket?.id, reason);

    if (globalRoom) {
      const socket = await io.in(globalRoom).fetchSockets();

      if (socket?.length == 0) {
        const userId = new mongoose.Types.ObjectId(id);

        const user = await User.findById(userId);
        if (user) {
          if (user.isLive) {
            const liveHistory = await LiveHistory.findById(user.liveHistoryId);
            console.log("liveHistory in disconnect globalRoom: ", liveHistory);

            liveHistory.endTime = moment().format("HH:mm:ss");

            var date1 = moment(liveHistory.startTime, "HH:mm:ss");
            var date2 = moment(liveHistory.endTime, "HH:mm:ss");
            var timeDifference = date2.diff(date1);
            var duration = moment.duration(timeDifference);
            var durationTime = moment.utc(duration.asMilliseconds()).format("HH:mm:ss");

            liveHistory.duration = durationTime;

            const [updateLiveHistory, userUpdate] = await Promise.all([
              liveHistory.save(),
              User.findOneAndUpdate({ _id: user._id }, { $set: { isOnline: false, isLive: false, liveHistoryId: null } }, { new: true }),
              LiveUser.deleteOne({ userId: user._id }),
              LiveView.deleteMany({ liveHistoryId: liveHistory._id }),
            ]);

            console.log("isOnline in disconnect:", userUpdate?.isOnline, "isLive in disconnect:", userUpdate?.isLive);
            console.log("liveUser and related liveView deleted in disconnect");
          }

          const sockets = await io.in(user?.liveHistoryId?.toString()).fetchSockets();
          console.log("sockets.length: ", sockets.length);

          sockets?.length ? io.socketsLeave(user?.liveHistoryId?.toString()) : console.log("sockets not able to leave in disconnect");
        }
      }
    }
  });
});
