const mongoose = require("mongoose");

const liveHistory = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    totalGift: { type: Number, default: 0 }, //how many gift received during live [gift count]
    totalUser: { type: Number, default: 0 }, //how many user joined to view live [user count]
    totalLiveChat: { type: Number, default: 0 }, //how many liveChat passed in live [liveChat count]
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    duration: { type: String, default: "00:00:00" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

liveHistory.index({ createdAt: -1 });
liveHistory.index({ userId: 1 });

module.exports = mongoose.model("LiveHistory", liveHistory);
