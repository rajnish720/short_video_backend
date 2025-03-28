const VerificationRequest = require("../../models/verificationRequest.model");

//import model
const User = require("../../models/user.model");

//private key
const admin = require("../../util/privateKey");

//verificationRequest accept by the admin
exports.verificationRequestAccept = async (req, res) => {
  try {
    if (!req.query.verificationRequestId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const verificationRequest = await VerificationRequest.findOne({ _id: req.query.verificationRequestId });
    if (!verificationRequest) {
      return res.status(200).json({ status: true, message: "verificationRequest does not found!" });
    }

    const user = await User.findById(verificationRequest.userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "user dose not found." });
    }

    if (verificationRequest.isAccepted === true) {
      return res.status(200).json({ status: false, message: "VerificationRequest already has been accepted by the admin." });
    }

    if (verificationRequest.isRejected === true) {
      return res.status(200).json({ status: false, message: "VerificationRequest already has been rejected by the admin." });
    }

    verificationRequest.isAccepted = true;
    user.isVerified = true;

    await Promise.all([verificationRequest.save(), user.save()]);

    res.status(200).json({ status: true, message: "VerificationRequest has been accepted by the admin.", data: verificationRequest });

    //checks if the user has an fcmToken
    if (user.fcmToken && user.fcmToken !== null) {
      const adminPromise = await admin;

      const payload = {
        token: user.fcmToken,
        notification: {
          title: "✅ Verification Request Accepted! ✅",
          body: "Congratulations! Your verification request has been accepted. Thank you for verifying your account.",
        },
        data: {
          type: "VERIFICATIONREQUEST",
        },
      };

      adminPromise
        .messaging()
        .send(payload)
        .then((response) => {
          console.log("Successfully sent with response: ", response);
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//verificationRequest decline by the admin
exports.verificationRequestDecline = async (req, res) => {
  try {
    if (!req.query.verificationRequestId) {
      return res.status(200).json({ status: false, message: "verificationRequestId must be requried!" });
    }

    if (!req.body.reason) {
      return res.status(200).json({ status: false, message: "reason must be passed by the admin." });
    }

    const verificationRequest = await VerificationRequest.findOne({ _id: req.query.verificationRequestId });
    if (!verificationRequest) {
      return res.status(200).json({ status: true, message: "verificationRequest does not found!" });
    }

    if (verificationRequest.isAccepted === true) {
      return res.status(200).json({ status: false, message: "VerificationRequest already has been accepted by the admin." });
    }

    if (verificationRequest.isRejected === true) {
      return res.status(200).json({ status: false, message: "VerificationRequest already has been rejected by the admin." });
    }

    verificationRequest.isRejected = true;
    verificationRequest.reason = req.body.reason;
    await verificationRequest.save();

    res.status(200).json({ status: true, message: "verificationRequest has been declined by the admin!", data: verificationRequest });

    const user = await User.findById(verificationRequest?.userId);

    //checks if the user has an fcmToken
    if (user.fcmToken && user.fcmToken !== null) {
      const adminPromise = await admin;

      const payload = {
        token: user.fcmToken,
        notification: {
          title: "❌ Verification Request Declined! ❌",
          body: "We're sorry, but your verification request has been declined. Please contact support for more information.",
        },
        data: {
          type: "VERIFICATIONREQUEST",
        },
      };

      adminPromise
        .messaging()
        .send(payload)
        .then((response) => {
          console.log("Successfully sent with response: ", response);
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get all verificationRequest
exports.getAll = async (req, res) => {
  try {
    if (!req.query.type) {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (req.query.type === "pending") {
      const [total, data] = await Promise.all([
        VerificationRequest.countDocuments({ isAccepted: false, isRejected: false }),
        VerificationRequest.find({ isAccepted: false, isRejected: false })
          .populate("userId", "image name userName country")
          .sort({ createdAt: -1 })
          .skip((start - 1) * limit)
          .limit(limit),
      ]);

      return res.status(200).json({
        status: true,
        message: "all verificationRequests has been retrieved by the admin.",
        total: total,
        data: data,
      });
    } else if (req.query.type === "accepted") {
      const [total, data] = await Promise.all([
        VerificationRequest.countDocuments({ isAccepted: true, isRejected: false }),
        VerificationRequest.find({ isAccepted: true, isRejected: false })
          .populate("userId", "image name userName country")
          .sort({ createdAt: -1 })
          .skip((start - 1) * limit)
          .limit(limit),
      ]);

      return res.status(200).json({
        status: true,
        message: "all verificationRequests has been retrieved by the admin.",
        total: total,
        data: data,
      });
    } else if (req.query.type === "declined") {
      const [total, data] = await Promise.all([
        VerificationRequest.countDocuments({ isAccepted: false, isRejected: true }),
        VerificationRequest.find({ isAccepted: false, isRejected: true })
          .populate("userId", "image name userName country")
          .sort({ createdAt: -1 })
          .skip((start - 1) * limit)
          .limit(limit),
      ]);

      return res.status(200).json({
        status: true,
        message: "all verificationRequests has been retrieved by the admin.",
        total: total,
        data: data,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error",
    });
  }
};
