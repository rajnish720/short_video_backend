const VerificationRequest = require("../../models/verificationRequest.model");

//import model
const User = require("../../models/user.model");

//deleteFiles
const { deleteFiles } = require("../../util/deletefile");

//mongoose
const mongoose = require("mongoose");

//verification request created by the user
exports.verificationRequestByUser = async (req, res) => {
  try {
    if (!req.files || !req.body.userId || !req.body.documentId || !req.body.nameOnDocument || !req.body.address) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.body.userId);

    const [user, existRequest] = await Promise.all([User.findById(userId), VerificationRequest.findOne({ userId: userId })]);

    if (!user) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (existRequest?.isAccepted === true) {
      if (req.files) deleteFiles(req.files);

      const verifiedUser = await User.findOne({ _id: existRequest.userId });

      return res.status(200).json({
        status: false,
        message: "This user already become the verified user.",
        verificationRequest: verifiedUser,
      });
    } else if (existRequest?.isAccepted === false && existRequest.isRejected === true) {
      await existRequest.deleteOne();

      const verificationRequest = new VerificationRequest();

      if (req.files.profileSelfie) {
        verificationRequest.profileSelfie = req.files.profileSelfie[0].path;
      }

      if (req.files.document) {
        verificationRequest.document = req.files.document[0].path;
      }

      verificationRequest.documentId = req.body.documentId;
      verificationRequest.nameOnDocument = req.body.nameOnDocument;
      verificationRequest.address = req.body.address;
      verificationRequest.userId = user._id;
      verificationRequest.date = new Date().toLocaleString("en-US");
      await verificationRequest.save();

      return res.status(200).json({
        status: true,
        message: "Verified user request has been send to the admin.",
        verificationRequest: verificationRequest,
      });
    } else if (existRequest?.isAccepted === false && existRequest.isRejected === false) {
      if (req.files.profileSelfie) {
        existRequest.profileSelfie = req.files.profileSelfie[0].path;
      }

      if (req.files.document) {
        existRequest.document = req.files.document[0].path;
      }

      existRequest.documentId = req.body.documentId ? req.body.documentId : existRequest.documentId;
      existRequest.nameOnDocument = req.body.nameOnDocument ? req.body.nameOnDocument : existRequest.nameOnDocument;
      existRequest.address = req.body.address ? req.body.address : existRequest.address;
      await existRequest.save();

      return res.status(200).json({
        status: true,
        message: "Verified user request has been send to the admin.",
        verificationRequest: existRequest,
      });
    } else {
      const verificationRequest = new VerificationRequest();

      if (req.files.profileSelfie) {
        verificationRequest.profileSelfie = req.files.profileSelfie[0].path;
      }

      if (req.files.document) {
        verificationRequest.document = req.files.document[0].path;
      }

      verificationRequest.documentId = req.body.documentId;
      verificationRequest.nameOnDocument = req.body.nameOnDocument;
      verificationRequest.address = req.body.address;
      verificationRequest.userId = user._id;
      verificationRequest.date = new Date().toLocaleString("en-US");
      await verificationRequest.save();

      return res.status(200).json({
        status: true,
        message: "Verified user request has been send to the admin.",
        verificationRequest: verificationRequest,
      });
    }
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get particular user's verificationRequest
exports.verificationRequestOfUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const verificationRequest = await VerificationRequest.findOne({ userId: req.query.userId });
    if (!verificationRequest) {
      return res.status(200).json({ status: true, message: "verificationRequest does not belongs to that user!" });
    }

    if (verificationRequest.isAccepted === true) {
      return res.status(200).json({
        status: false,
        message: "this verificationRequest already has been accepted by the admin.",
        verificationRequest: verificationRequest,
      });
    }

    if (verificationRequest.isRejected === true) {
      return res.status(200).json({
        status: false,
        message: "this verificationRequest already has been rejected by the admin.",
        verificationRequest: verificationRequest,
      });
    }

    return res.status(200).json({
      status: true,
      message: "VerificationRequest for particular user get by the admin.",
      verificationRequest: verificationRequest,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
