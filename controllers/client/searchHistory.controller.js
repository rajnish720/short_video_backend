const SearchHistory = require("../../models/searchHistory.model");

//import model
const User = require("../../models/user.model");
const HashTag = require("../../models/hashTag.model");

//mongoose
const mongoose = require("mongoose");

//search users
exports.searchUsers = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const userSearchString = req.query.userSearchString ? req.query.userSearchString.trim() : "";

    const userPromise = User.findOne({ _id: userId });
    const existSearchHistoryPromise = userSearchString
      ? SearchHistory.exists({
          userId: userId,
          userSearchString: userSearchString,
        })
      : Promise.resolve(false);

    const searchPromise = userSearchString
      ? User.find({
          _id: { $ne: userId },
          isBlock: false,
          $or: [{ name: { $regex: userSearchString, $options: "i" } }, { userName: { $regex: userSearchString, $options: "i" } }],
        }).select("name userName image isVerified isFake")
      : User.find({ _id: { $ne: userId }, isBlock: false })
          .select("name userName image isVerified isFake")
          .limit(20)
          .sort({ createdAt: -1 });

    const [user, existSearchHistory, response] = await Promise.all([userPromise, existSearchHistoryPromise, searchPromise]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!existSearchHistory && (userSearchString !== null || userSearchString !== "")) {
      const searchHistory = new SearchHistory();
      searchHistory.userId = userId;
      searchHistory.userSearchString = userSearchString;
      await searchHistory.save();
    }

    return res.status(200).json({ status: true, message: "Success", searchData: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get previous search data of users
exports.searchedDataOfUsers = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userPromise = User.findOne({ _id: req.query.userId });
    const searchHistoryPromise = SearchHistory.find({ userId: req.query.userId, hashTagSearchString: null })
      .select("userSearchString userId createdAt")
      .sort({ createdAt: -1 }) //Sort by most recently searched
      .limit(20);

    const [user, lastSearchedData] = await Promise.all([userPromise, searchHistoryPromise]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Success",
      lastSearchedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//search hashTag
exports.searchHashTag = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const hashTagSearchString = req.query.hashTagSearchString ? req.query.hashTagSearchString.trim() : "";

    const userPromise = User.findOne({ _id: userId });
    const existSearchHistoryPromise = hashTagSearchString
      ? SearchHistory.exists({
          userId: userId,
          hashTagSearchString: hashTagSearchString,
        })
      : Promise.resolve(false);

    const searchPromise = hashTagSearchString
      ? HashTag.aggregate([
          {
            $match: {
              hashTag: { $regex: hashTagSearchString, $options: "i" },
            },
          },
          {
            $lookup: {
              from: "hashtagusagehistories",
              localField: "_id",
              foreignField: "hashTagId",
              as: "usageHistory",
            },
          },
          {
            $project: {
              _id: 1,
              hashTag: 1,
              hashTagBanner: 1,
              hashTagIcon: 1,
              totalVideo: {
                $size: {
                  $filter: {
                    input: "$usageHistory",
                    as: "usage",
                    cond: { $ne: ["$$usage.videoId", null] },
                  },
                },
              },
              totalPost: {
                $size: {
                  $filter: {
                    input: "$usageHistory",
                    as: "usage",
                    cond: { $ne: ["$$usage.postId", null] },
                  },
                },
              },
            },
          },
          {
            $sort: {
              totalVideo: -1,
              totalPost: -1,
            },
          },
        ])
      : HashTag.aggregate([
          {
            $lookup: {
              from: "hashtagusagehistories",
              localField: "_id",
              foreignField: "hashTagId",
              as: "usageHistory",
            },
          },
          {
            $project: {
              _id: 1,
              hashTag: 1,
              hashTagBanner: 1,
              hashTagIcon: 1,
              totalVideo: {
                $size: {
                  $filter: {
                    input: "$usageHistory",
                    as: "usage",
                    cond: { $ne: ["$$usage.videoId", null] },
                  },
                },
              },
              totalPost: {
                $size: {
                  $filter: {
                    input: "$usageHistory",
                    as: "usage",
                    cond: { $ne: ["$$usage.postId", null] },
                  },
                },
              },
            },
          },
          {
            $sort: {
              totalVideo: -1,
              totalPost: -1,
            },
          },
        ]);

    const [user, response, existSearchHistory] = await Promise.all([userPromise, searchPromise, existSearchHistoryPromise]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (!existSearchHistory && (hashTagSearchString !== null || hashTagSearchString !== "")) {
      const searchHistory = new SearchHistory();
      searchHistory.userId = userId;
      searchHistory.hashTagSearchString = hashTagSearchString;
      await searchHistory.save();
    }

    return res.status(200).json({ status: true, message: "Success", searchData: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get previous search data of hasgTags
exports.searchedDataOfHashTags = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "userId must be requried.",
      });
    }

    const userPromise = User.findOne({ _id: req.query.userId });
    const searchHistoryPromise = SearchHistory.find({ userId: req.query.userId, userSearchString: null })
      .select("hashTagSearchString userId createdAt")
      .sort({ createdAt: -1 }) //Sort by most recently searched
      .limit(20);

    const [user, lastSearchedData] = await Promise.all([userPromise, searchHistoryPromise]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Success",
      lastSearchedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//clear all searchHistory for particular user
exports.clearAllSearchHistory = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.type) {
      return res.status(200).json({ status: false, message: "userId and type must be requried." });
    }

    const user = await User.findOne({ _id: req.query.userId });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (req.query.type === "userSearch") {
      const clearSearchHistory = await SearchHistory.deleteMany({ userId: user._id, userSearchString: { $ne: null } });

      if (clearSearchHistory.deletedCount > 0) {
        return res.status(200).json({
          status: true,
          message: "The search history associated with the user's search data has been successfully cleared.",
        });
      } else {
        return res.status(200).json({
          status: true,
          message: "No search history was found for the user with userSearch type.",
        });
      }
    } else if (req.query.type === "hashTagSearch") {
      const clearSearchHistory = await SearchHistory.deleteMany({ userId: user._id, hashTagSearchString: { $ne: null } });

      if (clearSearchHistory.deletedCount > 0) {
        return res.status(200).json({
          status: true,
          message: "The search history associated with the hashTag search data has been successfully cleared.",
        });
      } else {
        return res.status(200).json({
          status: true,
          message: "No search history was found for the user with hashTagSearch type.",
        });
      }
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
