const mongoose = require("mongoose");

const postOrvideoCommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", default: null },
    commentText: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

postOrvideoCommentSchema.index({ userId: -1 });
postOrvideoCommentSchema.index({ postId: -1 });
postOrvideoCommentSchema.index({ videoId: -1 });
postOrvideoCommentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PostOrVideoComment", postOrvideoCommentSchema);
