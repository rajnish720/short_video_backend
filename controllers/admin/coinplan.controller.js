const CoinPlan = require("../../models/coinplan.model");

//fs
const fs = require("fs");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//create coinplan
exports.store = async (req, res) => {
  try {
    if (!req.body.coin || !req.body.amount || !req.body.productKey || !req.file) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const { coin, amount, productKey } = req.body;

    const coinplan = new CoinPlan();
    coinplan.coin = coin;
    coinplan.amount = amount;
    coinplan.productKey = productKey;
    coinplan.icon = req.file ? req?.file?.path : "";
    await coinplan.save();

    return res.status(200).json({
      status: true,
      message: "coinplan create Successfully",
      data: coinplan,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

//update coinplan
exports.update = async (req, res) => {
  try {
    if (!req.query.coinPlanId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "coinPlanId must be needed." });
    }

    const coinplan = await CoinPlan.findById(req.query.coinPlanId);
    if (!coinplan) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "CoinPlan does not found." });
    }

    coinplan.coin = req.body.coin ? Number(req.body.coin) : coinplan.coin;
    coinplan.amount = req.body.amount ? Number(req.body.amount) : coinplan.amount;
    coinplan.productKey = req.body.productKey ? req.body.productKey : coinplan.productKey;

    if (req?.file) {
      const icon = coinplan?.icon.split("storage");
      if (icon) {
        if (fs.existsSync("storage" + icon[1])) {
          fs.unlinkSync("storage" + icon[1]);
        }
      }

      coinplan.icon = req?.file?.path;
    }

    await coinplan.save();

    return res.status(200).json({
      status: true,
      message: "Coinplan update Successfully",
      data: coinplan,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

//handle isActive switch
exports.handleSwitch = async (req, res) => {
  try {
    if (!req.query.coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId must be needed." });
    }

    const coinplan = await CoinPlan.findById(req.query.coinPlanId);
    if (!coinplan) {
      return res.status(200).json({ status: false, message: "CoinPlan does not found." });
    }

    coinplan.isActive = !coinplan.isActive;
    await coinplan.save();

    return res.status(200).json({ status: true, message: "Success", data: coinplan });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete coinplan
exports.delete = async (req, res) => {
  try {
    if (!req.query.coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId must be needed." });
    }

    const coinplan = await CoinPlan.findById(req.query.coinPlanId);
    if (!coinplan) {
      return res.status(200).json({ status: false, message: "CoinPlan does not found." });
    }

    const icon = coinplan?.icon.split("storage");
    if (icon) {
      if (fs.existsSync("storage" + icon[1])) {
        fs.unlinkSync("storage" + icon[1]);
      }
    }

    await coinplan.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Coinplan deleted Successfully",
      data: coinplan,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

//get coinPlan
exports.get = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.find().sort({ coin: 1, amount: 1 });

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
