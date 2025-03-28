const mongoose = require("mongoose");

const { MESSAGE_TYPE } = require("../types/constant");

const chatRequestSchema = new mongoose.Schema(
  {
    chatRequestTopicId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRequestTopic", default: null },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

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

chatRequestSchema.index({ createdAt: -1 });
chatRequestSchema.index({ chatRequestTopicId: 1 });
chatRequestSchema.index({ senderUserId: 1 });

module.exports = mongoose.model("ChatRequest", chatRequestSchema);
