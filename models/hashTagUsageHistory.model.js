const mongoose = require("mongoose");

const hashTagUsageHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hashTagId: { type: mongoose.Schema.Types.ObjectId, ref: "HashTag", default: null },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", default: null },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

hashTagUsageHistorySchema.index({ userId: 1 });
hashTagUsageHistorySchema.index({ hashTagId: 1 });
hashTagUsageHistorySchema.index({ videoId: 1 });
hashTagUsageHistorySchema.index({ postId: 1 });
hashTagUsageHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model("HashTagUsageHistory", hashTagUsageHistorySchema);
