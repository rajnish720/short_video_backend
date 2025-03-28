const mongoose = require("mongoose");

const liveUserSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    userName: { type: String, default: "" },
    image: { type: String, default: "" },
    isFake: { type: Boolean, default: false },
    view: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    liveHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveHistory" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

liveUserSchema.index({ userId: 1 });
liveUserSchema.index({ liveHistoryId: 1 });
liveUserSchema.index({ createdAt: -1 });

module.exports = mongoose.model("LiveUser", liveUserSchema);
