const mongoose = require("mongoose");

const livevideoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    videoImage: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    videoTime: { type: Number, min: 0 }, //that value always save in seconds
    isLive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

livevideoSchema.index({ userId: 1 });
livevideoSchema.index({ createdAt: -1 });
livevideoSchema.index({ isLive: 1 });

module.exports = mongoose.model("Livevideo", livevideoSchema);
