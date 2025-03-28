const mongoose = require("mongoose");

const { WITHDRAWAL_STATUS } = require("../types/constant");

const withdrawRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    amount: { type: Number, default: 0 },
    coin: { type: Number, default: 0 },
    status: { type: Number, default: 1, enum: WITHDRAWAL_STATUS },
    paymentGateway: { type: String, default: "" },
    paymentDetails: { type: Array, default: [] },
    reason: { type: String, default: "" },
    uniqueId: { type: String, default: "" },
    requestDate: { type: String, default: "" },
    acceptOrDeclineDate: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

withdrawRequestSchema.index({ userId: 1 });
withdrawRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);
