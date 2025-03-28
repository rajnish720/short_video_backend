const CoinPlan = require("../../models/coinplan.model");

//import models
const User = require("../../models/user.model");
const History = require("../../models/history.model");

//mongoose
const mongoose = require("mongoose");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//get coinPlan
exports.getCoinplan = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.find({ isActive: true }).sort({ coin: 1, amount: 1 });

    return res.status(200).json({
      status: true,
      message: "Retrive CoinPlan Successfully",
      data: coinPlan,
    });
  } catch {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

//when user purchase the coinPlan create coinPlan history by user
exports.createHistory = async (req, res) => {
  try {
    if (!req.body.userId || !req.body.coinPlanId || !req.body.paymentGateway) {
      return res.json({ status: false, message: "Oops ! Invalid details." });
    }

    const uniqueId = generateHistoryUniqueId();
    const userId = new mongoose.Types.ObjectId(req.body.userId);
    const coinPlanId = new mongoose.Types.ObjectId(req.body.coinPlanId);
    const paymentGateWay = req.body.paymentGateway.trim();

    const [user, coinPlan] = await Promise.all([User.findOne({ _id: userId }), CoinPlan.findById(coinPlanId)]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!coinPlan) {
      return res.status(200).json({ status: false, message: "CoinPlan does not found." });
    }

    await Promise.all([
      User.updateOne(
        { _id: userId },
        {
          $inc: { coin: coinPlan.coin },
        }
      ),

      History.create({
        userId: user._id,
        planId: coinPlan._id,
        coin: coinPlan.coin,
        paymentGateway: paymentGateWay,
        uniqueId: uniqueId,
        type: 2,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    return res.status(200).json({
      status: true,
      message: "When user purchase the coinPlan created coinPlan history!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
