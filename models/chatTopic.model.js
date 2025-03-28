const mongoose = require("mongoose");

const chatTopicSchema = new mongoose.Schema(
  {
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", default: null },
    isAccepted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

chatTopicSchema.index({ receiverUserId: 1 });
chatTopicSchema.index({ chatId: 1 });
chatTopicSchema.index({ createdAt: -1 });
chatTopicSchema.index({ senderUserId: 1, isAccepted: 1 });

module.exports = mongoose.model("ChatTopic", chatTopicSchema);
