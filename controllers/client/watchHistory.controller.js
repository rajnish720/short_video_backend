const WatchHistory = require("../../models/watchHistory.model");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");

//when user view the video create watchHistory of the particular video
exports.createWatchHistory = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [user, video] = await Promise.all([User.findOne({ _id: req.query.userId }), Video.findOne({ _id: req.query.videoId })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }

    const watchHistory = new WatchHistory();
    watchHistory.userId = user._id;
    watchHistory.videoId = video._id;
    watchHistory.videoUserId = video.userId;
    await watchHistory.save();

    return res.status(200).json({ status: true, message: "When user view the video then created watchHistory for that video." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
