const mongoose = require("mongoose");

const { MESSAGE_TYPE } = require("../types/constant");

const chatSchema = mongoose.Schema(
  {
    chatTopicId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatTopic", default: null },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    messageType: { type: Number, enum: MESSAGE_TYPE }, //1.message 2.image 3.audio
    message: { type: String, default: "" },
    image: { type: String, default: "" },
    audio: { type: String, default: "" },

    isRead: { type: Boolean, default: false },
    date: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

chatSchema.index({ createdAt: -1 });
chatSchema.index({ chatTopicId: 1 });
chatSchema.index({ senderUserId: 1 });

module.exports = mongoose.model("Chat", chatSchema);
