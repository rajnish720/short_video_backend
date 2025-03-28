const { HISTORY_TYPE, WITHDRAWAL_STATUS } = require("../types/constant");

const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //sender
    otherUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //receiver
    giftId: { type: mongoose.Schema.Types.ObjectId, ref: "Gift", default: null },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", default: null }, //paticular video's _id for gift
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "CoinPlan", default: null }, //plan's _id which purchased by the user

    paymentGateway: { type: String, default: "" },
    payoutStatus: { type: Number, default: 0, enum: WITHDRAWAL_STATUS },
    reason: { type: String, default: "" },

    type: { type: Number, enum: HISTORY_TYPE },
    coin: { type: Number, default: 0 },
    uniqueId: { type: String, unique: true, trim: true, default: "" },
    date: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

historySchema.index({ createdAt: -1 });
historySchema.index({ userId: 1 });
historySchema.index({ otherUserId: 1 });
historySchema.index({ giftId: 1 });
historySchema.index({ videoId: 1 });

module.exports = new mongoose.model("History", historySchema);
