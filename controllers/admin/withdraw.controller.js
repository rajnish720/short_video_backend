const Withdraw = require("../../models/withdraw.model");

//fs
const fs = require("fs");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//store Withdraw
exports.store = async (req, res) => {
  try {
    if (!req?.body?.name || !req?.body?.details || !req?.file) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const withdraw = new Withdraw();
    withdraw.name = req?.body?.name;
    withdraw.details = req?.body?.details?.split(",");
    withdraw.image = req.file ? req.file.path : "";
    await withdraw.save();

    return res.status(200).json({
      status: true,
      message: "Withdraw method created by the admin.",
      data: withdraw,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update Withdraw
exports.update = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Withdraw does not found." });
    }

    if (req?.file) {
      const image = withdraw.image.split("storage");
      if (image) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }

      withdraw.image = req.file ? req.file.path : withdraw.image;
    }

    withdraw.name = req?.body?.name ? req?.body?.name : withdraw.name;
    withdraw.details = req?.body?.details.toString() ? req?.body?.details.toString().split(",") : withdraw.details;
    await withdraw.save();

    return res.status(200).json({
      status: true,
      message: "withdraw method updated by the admin.",
      data: withdraw,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get Withdraw
exports.get = async (req, res) => {
  try {
    const withdraw = await Withdraw.find().sort({ createdAt: -1 });

    return res.status(200).json({ status: true, message: "Retrive Withdraw methods.", data: withdraw });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete Withdraw
exports.delete = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      return res.status(200).json({ status: false, message: "Withdraw does not found." });
    }

    const image = withdraw?.image.split("storage");
    if (image) {
      if (fs.existsSync("storage" + image[1])) {
        fs.unlinkSync("storage" + image[1]);
      }
    }

    await withdraw.deleteOne();

    return res.status(200).json({ status: true, message: "Withdraw method deleted by the admin." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//handle isActive switch
exports.handleSwitch = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      return res.status(200).json({ status: false, message: "Withdraw does not found." });
    }

    withdraw.isActive = !withdraw.isActive;
    await withdraw.save();

    return res.status(200).json({ status: true, message: "Success", data: withdraw });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
