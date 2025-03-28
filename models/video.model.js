const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    uniqueVideoId: { type: String, unique: true, trim: true, default: "" },
    caption: { type: String, default: "" },

    videoTime: { type: Number, min: 0 }, //that value always save in seconds
    videoUrl: { type: String, default: "" },
    videoImage: { type: String, default: "" },

    location: { type: String, default: "" },
    locationCoordinates: {
      latitude: { type: String, default: "" },
      longitude: { type: String, default: "" },
    },

    hashTagId: [{ type: mongoose.Schema.Types.ObjectId, ref: "HashTag", default: [] }],
    songId: { type: mongoose.Schema.Types.ObjectId, ref: "Song", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    shareCount: { type: Number, default: 0 }, //when user share the video then shareCount increased
    isFake: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

videoSchema.index({ uniqueVideoId: 1 });
videoSchema.index({ hashTagId: 1 });
videoSchema.index({ userId: 1 });
videoSchema.index({ songId: 1 });
videoSchema.index({ isFake: 1 });
videoSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Video", videoSchema);
