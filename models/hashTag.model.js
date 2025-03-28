const mongoose = require("mongoose");

//delete the HashTag model if it already exists
if (mongoose.models.HashTag) {
  delete mongoose.models.HashTag;
}

const hashTagSchema = new mongoose.Schema(
  {
    hashTag: { type: String, unique: true, trim: true, default: "" },
    hashTagIcon: { type: String, default: "" },
    hashTagBanner: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

hashTagSchema.index({ createdAt: -1 });

module.exports = mongoose.model("HashTag", hashTagSchema);
