const mongoose = require("mongoose");

const { STATUS_OF_MESSAGE_REQUEST_TOPIC } = require("../types/constant");

const chatRequestTopicSchema = new mongoose.Schema(
  {
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    chatRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "MessageRequest", default: null },
    status: { type: Number, enum: STATUS_OF_MESSAGE_REQUEST_TOPIC, default: 1 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

chatRequestTopicSchema.index({ senderUserId: 1 });
chatRequestTopicSchema.index({ receiverUserId: 1 });
chatRequestTopicSchema.index({ chatRequestId: 1 });
chatRequestTopicSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ChatRequestTopic", chatRequestTopicSchema);
