const mongoose = require("mongoose");

const { STATUS_OF_COMPLAINT } = require("../types/constant");

const ComplaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    complaint: { type: String, default: "" },
    contact: { type: String, default: "" }, //Mobile Number Or Email
    image: { type: String, default: "" },
    date: { type: String, default: "" },
    status: { type: Number, enum: STATUS_OF_COMPLAINT, default: 1 }, // 1.pending 2.solved
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ userId: 1 });
ComplaintSchema.index({ status: 1 });

module.exports = mongoose.model("Complaint", ComplaintSchema);
