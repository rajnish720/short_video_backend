const WithDrawRequest = require("../../models/withDrawRequest.model");

//import model
const User = require("../../models/user.model");
const History = require("../../models/history.model");

//mongoose
const mongoose = require("mongoose");

//private key
const admin = require("../../util/privateKey");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//convert coin into amount (in default currency)
exports.coinToAmount = async (req, res) => {
  try {
    if (!req.query.coin) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    const coin = Number(req.query.coin);
    const amount = parseFloat(coin / settingJSON.minCoinForCashOut).toFixed(2);

    return res.status(200).json({ status: false, message: "The Coin converted to the amount.", data: amount });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//Withdraw request made by particular user
exports.createWithdrawRequest = async (req, res) => {
  try {
    if (!req.body.userId || !req.body.paymentGateway || !req.body.paymentDetails || !req.body.coin) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const uniqueId = generateHistoryUniqueId();
    const userId = new mongoose.Types.ObjectId(req.body.userId);
    const coin = Number(req.body.coin);
    const paymentGateway = req.body.paymentGateway.trim();

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (coin > user.coin) {
      return res.status(200).json({ status: false, message: "The user does not have sufficient funds to make the withdrawal." });
    }

    if (coin < settingJSON.minWithdrawalRequestedCoin) {
      return res.status(200).json({ status: false, message: "Oops ! withdrawal requested coin must be greater than specified by the admin." });
    }

    const withdrawalAmount = parseFloat(coin / settingJSON.minCoinForCashOut).toFixed(2);

    const [pendingExistRequest, declinedExistRequest] = await Promise.all([WithDrawRequest.findOne({ userId: user._id, status: 1 }), WithDrawRequest.findOne({ userId: user._id, status: 3 })]);

    if (pendingExistRequest) {
      return res.status(200).json({
        status: true,
        message: "Your withdrawal request has already been sent to the admin.",
        withDrawRequest: pendingExistRequest,
      });
    } else if (declinedExistRequest) {
      await declinedExistRequest.deleteOne();

      const [saveRequest, history] = await Promise.all([
        WithDrawRequest.create({
          userId: user._id,
          coin: coin,
          amount: withdrawalAmount,
          paymentGateway: paymentGateway,
          paymentDetails: req.body.paymentDetails.map((detail) => detail.replace("[", "").replace("]", "")),
          uniqueId: uniqueId,
          requestDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),

        History.create({
          userId: user._id,
          uniqueId: uniqueId,
          coin: coin,
          payoutStatus: 1,
          type: 3,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
      ]);

      res.status(200).json({
        status: true,
        message: "Your withdrawal request has been declined by the admin, and a new request has been created.",
        withDrawRequest: saveRequest,
      });

      //checks if the user has an fcmToken
      if (user.fcmToken && user.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🔔 Withdrawal Request Submitted! 🔔",
            body: "Your withdrawal request has been successfully created. We will process it shortly. Thank you for using our service!",
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
    } else {
      const [saveRequest, history] = await Promise.all([
        WithDrawRequest.create({
          userId: user._id,
          coin: coin,
          amount: withdrawalAmount,
          paymentGateway: paymentGateway,
          paymentDetails: req.body.paymentDetails.map((detail) => detail.replace("[", "").replace("]", "")),
          uniqueId: uniqueId,
          requestDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),

        History.create({
          userId: user._id,
          uniqueId: uniqueId,
          coin: coin,
          payoutStatus: 1,
          type: 3,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
      ]);

      res.status(200).json({ status: true, message: "Your withdrawal request has been sent to the admin.", withDrawRequest: saveRequest });

      //checks if the user has an fcmToken
      if (user.fcmToken && user.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🔔 Withdrawal Request Submitted! 🔔",
            body: "Your withdrawal request has been successfully created. We will process it shortly. Thank you for using our service!",
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
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
