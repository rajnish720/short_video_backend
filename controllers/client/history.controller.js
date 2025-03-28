const History = require("../../models/history.model");

//import model
const User = require("../../models/user.model");

//mongoose
const mongoose = require("mongoose");

//get coin history of particular user
exports.historyOfUser = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

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
            localField: "otherUserId",
            foreignField: "_id",
            as: "receiver",
          },
        },
        {
          $unwind: {
            path: "$receiver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $unwind: {
            path: "$sender",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            type: 1,
            payoutStatus: 1,
            coin: 1,
            uniqueId: 1,
            date: 1,
            reason: 1,
            createdAt: 1,
            senderName: { $ifNull: ["$sender.name", ""] },
            receiverName: { $ifNull: ["$receiver.name", ""] },

            // isIncome: {
            //   $cond: {
            //     if: { $eq: ["$userId", userId] },
            //     then: false,
            //     else: true,
            //   },
            // },

            isIncome: {
              $cond: {
                if: { $eq: ["$payoutStatus", 2] },
                then: true,
                else: {
                  $cond: {
                    if: { $eq: ["$userId", userId] },
                    then: false,
                    else: true,
                  },
                },
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
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
