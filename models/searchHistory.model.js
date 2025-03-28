const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userSearchString: { type: String, default: null },
    hashTagSearchString: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

searchHistorySchema.index({ userId: 1 });
searchHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model("SearchHistory", searchHistorySchema);
