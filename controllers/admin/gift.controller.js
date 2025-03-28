const Gift = require("../../models/gift.model");
const History = require("../../models/history.model");

//fs
const fs = require("fs");

//deletefile
const { deleteFiles } = require("../../util/deletefile");

//create gift
exports.createGift = async (req, res, next) => {
  try {
    if (!req?.body?.type) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const gift = new Gift();

    gift.coin = req?.body?.coin;
    gift.type = req?.body?.type;
    gift.image = req.files ? req.files.image[0].path : gift.image;
    gift.svgaImage = req?.body?.type == 3 ? (req.files ? req.files.svgaImage[0].path : "") : "";
    await gift.save();

    return res.status(200).json({ status: true, message: "Gift has been created by the admin.", data: gift });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(200).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//update gift
exports.updateGift = async (req, res, next) => {
  try {
    if (!req.query.giftId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "giftId must be required." });
    }

    const gift = await Gift.findById(req.query.giftId);
    if (!gift) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "gift does not found." });
    }

    gift.type = req.body.type ? req.body.type : gift.type;
    gift.coin = req?.body?.coin ? req?.body?.coin : gift.coin;

    if (req.files.image) {
      const image = gift?.image.split("storage");
      if (image) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }

      gift.image = req.files ? req.files.image[0].path : gift.image;
    }

    if (req?.body?.type == 3 && req.files.svgaImage) {
      const svgaImage = gift?.svgaImage.split("storage");
      if (svgaImage) {
        if (fs.existsSync("storage" + svgaImage[1])) {
          fs.unlinkSync("storage" + svgaImage[1]);
        }
      }

      gift.svgaImage = req.files ? req.files.svgaImage[0].path : "";
    }

    await gift.save();

    return res.status(200).json({ status: true, message: "Gift has been updated by the admin.", data: gift });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.log(error);
    return res.status(200).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all gifts
exports.getGifts = async (req, res, next) => {
  try {
    const gift = await Gift.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      status: true,
      message: "Retrive gifts for the admin.",
      data: gift,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete gift
exports.deleteGift = async (req, res, next) => {
  try {
    if (!req.query.giftId) {
      return res.status(200).json({ status: false, message: "giftId must be required." });
    }

    const gift = await Gift.findById(req.query.giftId);
    if (!gift) {
      return res.status(200).json({ status: false, message: "gift does not found." });
    }

    const image = gift?.image.split("storage");
    if (image) {
      if (fs.existsSync("storage" + image[1])) {
        fs.unlinkSync("storage" + image[1]);
      }
    }

    const svgaImage = gift?.svgaImage.split("storage");
    if (svgaImage) {
      if (fs.existsSync("storage" + svgaImage[1])) {
        fs.unlinkSync("storage" + svgaImage[1]);
      }
    }

    res.status(200).json({ status: true, message: "Gift has been deleted by the admin." });

    await History.deleteMany({ giftId: gift._id });
    await gift.deleteOne();
  } catch (error) {
    return res.status(200).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
