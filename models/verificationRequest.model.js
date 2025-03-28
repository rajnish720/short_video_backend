const mongoose = require("mongoose");

const verificationRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    profileSelfie: { type: String, default: "" },
    document: { type: String, default: "" },
    documentId: { type: String, default: "" },
    nameOnDocument: { type: String, default: "" },
    address: { type: String, default: "" },
    date: { type: String, default: "" },
    reason: { type: String, default: "" },
    isAccepted: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

verificationRequestSchema.index({ createdAt: -1 });
verificationRequestSchema.index({ userId: 1 });

module.exports = mongoose.model("VerificationRequest", verificationRequestSchema);
