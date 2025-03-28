const Complaint = require("../../models/complaint.model");

//import model
const User = require("../../models/user.model");

//mongoose
const mongoose = require("mongoose");

//complaint or suggession by particular user
exports.complaintByUser = async (req, res) => {
  try {
    if (!req.body.userId || !req.body.complaint || !req.body.contact) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const { complaint, contact } = req.body;
    const userId = new mongoose.Types.ObjectId(req.body.userId);

    const [user, alreadyComplaintByUser] = await Promise.all([User.findById(userId), Complaint.findOne({ userId: userId })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (alreadyComplaintByUser) {
      return res.status(200).json({ status: false, message: "We've already received a complaint from you. Please wait for a response." });
    } else {
      const data = await Complaint.create({
        userId: user._id,
        complaint: complaint,
        contact: contact,
        image: req.file ? req?.file?.path : "",
        date: new Date().toLocaleString(),
      });

      return res.status(200).json({
        status: true,
        message: "Thank you for reaching out. Your complaint has been submitted successfully.",
        data: data,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
