const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    uniquePostId: { type: String, unique: true, trim: true, default: "" },
    caption: { type: String, default: "" },
    mainPostImage: { type: String, default: "" },
    postImage: { type: Array, default: [] },

    location: { type: String, default: "" },
    locationCoordinates: {
      latitude: { type: String, default: "" },
      longitude: { type: String, default: "" },
    },

    hashTagId: [{ type: mongoose.Schema.Types.ObjectId, ref: "HashTag", default: [] }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    shareCount: { type: Number, default: 0 }, //when user share the post then shareCount increased
    isFake: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

postSchema.index({ uniquePostId: 1 });
postSchema.index({ userId: 1 });
postSchema.index({ hashTagId: 1 });
postSchema.index({ isFake: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
