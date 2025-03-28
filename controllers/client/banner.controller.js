const Banner = require("../../models/banner.model");

//get banner
exports.getBanner = async (req, res) => {
  try {
    const banner = await Banner.find({ isActive: true }).sort({ createdAt: -1 });

    return res.status(200).json({ status: true, message: "Retrive banner.", data: banner });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
