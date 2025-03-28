const { LOGIN_TYPE } = require("../types/constant");

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Andraw Ainsley" },
    userName: { type: String, default: "@Andraw Ainsley" },
    image: { type: String, default: "storage/male.png" },
    gender: { type: String, default: "Female" },
    bio: { type: String, default: "" },
    age: { type: Number, default: 18 },

    countryFlagImage: { type: String, default: "" },
    country: { type: String, default: "" },
    ipAddress: { type: String, default: "" },

    coin: { type: Number, default: 0 },
    receivedCoin: { type: Number, default: 0 }, //receied coin when gift received through live and video
    purchasedCoin: { type: Number, default: 0 },
    receivedGift: { type: Number, default: 0 },

    totalWithdrawalCoin: { type: Number, default: 0 },
    totalWithdrawalAmount: { type: Number, default: 0 },

    uniqueId: { type: String, unique: true, default: "" },
    email: { type: String, default: "ShortieUser123@gmail.com" },
    mobileNumber: { type: String, default: "" },
    loginType: { type: Number, enum: LOGIN_TYPE }, //1.mobileNumber 2.google 3.quick(identity)
    identity: { type: String, default: "" },
    fcmToken: { type: String, default: null },
    date: { type: String, default: "" },
    lastlogin: { type: String, default: "" },

    isLive: { type: Boolean, default: false },
    liveHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveHistory", default: null },

    isBlock: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isFake: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ isBlock: 1 });
userSchema.index({ isFake: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
