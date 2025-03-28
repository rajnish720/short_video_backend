const History = require("../../models/history.model");

//import model
const User = require("../../models/user.model");

//mongoose
const mongoose = require("mongoose");

//get coin history of particular user
exports.historyOfUser = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.startDate || !req.query.endDate) {
      return res.status(200).json({ status: false, message: "OOps ! Invalid details.." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    let dateFilterQuery = {};
    if (req.query.startDate !== "All" && req.query.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    const [user, history] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      History.aggregate([
        {
          $match: {
            $or: [{ userId: userId }, { otherUserId: userId }],
            ...dateFilterQuery,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { senderId: "$userId", otherUserId: "$otherUserId", queryUserId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $cond: {
                      if: { $eq: ["$$queryUserId", "$$senderId"] },
                      then: { $eq: ["$$senderId", "$_id"] },
                      else: { $eq: ["$$otherUserId", "$_id"] },
                    },
                  },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $unwind: { path: "$user", preserveNullAndEmptyArrays: false },
        },
        {
          $project: {
            _id: 1,
            type: 1,
            coin: 1,
            date: 1,
            createdAt: 1,
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isIncome: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: false,
                else: true,
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Retrieve all histories.", data: history });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};
