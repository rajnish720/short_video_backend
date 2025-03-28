const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

bannerSchema.index({ isActive: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
