const mongoose = require("mongoose");

const likeHistoryOfpostOrvideoCommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    postOrvideoCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "PostOrVideoComment", default: null },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null }, //postId of video comment
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", default: null }, //videoId of video comment
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

likeHistoryOfpostOrvideoCommentSchema.index({ userId: 1 });
likeHistoryOfpostOrvideoCommentSchema.index({ postOrvideoCommentId: 1 });
likeHistoryOfpostOrvideoCommentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("LikeHistoryOfpostOrvideoComment", likeHistoryOfpostOrvideoCommentSchema);
