const WithdrawRequest = require("../../models/withDrawRequest.model");

//import model
const User = require("../../models/user.model");
const History = require("../../models/history.model");

//private key
const admin = require("../../util/privateKey");

//get all withdraw requests
exports.index = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let typeQuery = {};
    if (req.query.type !== "All") {
      typeQuery.status = parseInt(req.query.type);
    }

    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const startDate = new Date(req?.query?.startDate);
      const endDate = new Date(req?.query?.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    const [total, request] = await Promise.all([
      WithdrawRequest.countDocuments({
        ...dateFilterQuery,
        ...typeQuery,
      }),

      WithdrawRequest.find({
        ...dateFilterQuery,
        ...typeQuery,
      })
        .populate("userId", "name userName image")
        .skip((start - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      status: true,
      message: "Withdrawal requests fetch successfully!",
      total: total,
      data: request,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//accept withdraw request
exports.acceptWithdrawalRequest = async (req, res) => {
  try {
    if (!req.query.requestId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const request = await WithdrawRequest.findById(req.query.requestId);
    if (!request) {
      return res.status(200).json({ status: false, message: "Withdrawal Request does not found!" });
    }

    if (request.status == 2) {
      return res.status(200).json({ status: false, message: "Withdrawal request already accepted by the admin." });
    }

    if (request.status == 3) {
      return res.status(200).json({ status: false, message: "Withdrawal request already declined by the admin." });
    }

    const user = await User.findOne({ _id: request.userId });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const [updateUser, updateRequest, updateHistory] = await Promise.all([
      User.updateOne(
        { _id: request.userId, coin: { $gt: 0 } },
        {
          $inc: {
            coin: -request.coin,
            totalWithdrawalCoin: request.coin,
            totalWithdrawalAmount: request.amount,
          },
        }
      ),

      WithdrawRequest.updateOne(
        { _id: request._id },
        {
          $set: {
            status: 2,
            acceptOrDeclineDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          },
        }
      ),

      History.updateOne(
        { uniqueId: request.uniqueId, type: 3 },
        {
          $set: {
            payoutStatus: 2,
            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          },
        }
      ),
    ]);

    res.status(200).json({
      status: true,
      message: "Withdrawal request accepted and paid to particular user.",
      data: updateRequest,
    });

    //checks if the user has an fcmToken
    if (user.fcmToken && user.fcmToken !== null) {
      const adminPromise = await admin;

      const payload = {
        token: user.fcmToken,
        notification: {
          title: "🔔 Withdrawal Request Accepted! 🔔",
          body: "Good news! Your withdrawal request has been accepted and is being processed. Thank you for using our service!",
        },
        data: {
          type: "WITHDRAWREQUEST",
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
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//decline withdraw request
exports.declineWithdrawalRequest = async (req, res) => {
  try {
    if (!req.query.requestId || !req.query.reason) {
      return res.status(200).json({ status: false, message: "requestId and reason must be requried." });
    }

    const reason = req.query.reason.trim();
    const request = await WithdrawRequest.findById(req.query.requestId);
    if (!request) {
      return res.status(200).json({ status: false, message: "Withdrawal Request does not found!" });
    }

    if (request.status == 3) {
      return res.status(200).json({ status: false, message: "Withdrawal request already declined by the admin." });
    }

    if (request.status == 2) {
      return res.status(200).json({ status: false, message: "Withdrawal request already accepted by the admin." });
    }

    const user = await User.findOne({ _id: request.userId });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const [updateRequest, updateHistory] = await Promise.all([
      WithdrawRequest.updateOne(
        { _id: request._id },
        {
          $set: {
            status: 3,
            reason: reason,
            acceptOrDeclineDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          },
        }
      ),

      History.updateOne(
        { uniqueId: request.uniqueId, type: 3 },
        {
          $set: {
            payoutStatus: 3,
            reason: reason,
            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          },
        }
      ),
    ]);

    res.status(200).json({ status: true, message: "Withdrawal Request has been declined by the admin." });

    //checks if the user has an fcmToken
    if (user.fcmToken && user.fcmToken !== null) {
      const adminPromise = await admin;

      const payload = {
        token: user.fcmToken,
        notification: {
          title: "🔔 Withdrawal Request Declined! 🔔",
          body: "We're sorry, but your withdrawal request has been declined. Please contact support for more information.",
        },
        data: {
          type: "WITHDRAWREQUEST",
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
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
