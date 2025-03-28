const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    googlePlaySwitch: { type: Boolean, default: false },

    stripeSwitch: { type: Boolean, default: false },
    stripePublishableKey: { type: String, default: "STRIPE PUBLISHABLE KEY" },
    stripeSecretKey: { type: String, default: "STRIPE SECRET KEY" },

    razorPaySwitch: { type: Boolean, default: false },
    razorPayId: { type: String, default: "RAZOR PAY ID" },
    razorSecretKey: { type: String, default: "RAZOR SECRET KEY" },

    flutterWaveId: { type: String, default: "FLUTTER WAVE ID" },
    flutterWaveSwitch: { type: Boolean, default: false },

    privacyPolicyLink: { type: String, default: "PRIVACY POLICY LINK" },
    termsOfUsePolicyLink: { type: String, default: "TERMS OF USE POLICY LINK" },

    zegoAppId: { type: String, default: "ZEGO APP ID" },
    zegoAppSignIn: { type: String, default: "ZEGO APP SIGN IN" },

    paymentGateway: { type: Array, default: [] },
    isFakeData: { type: Boolean, default: false },

    durationOfShorts: { type: Number, default: 0 }, //that value always save in seconds
    minCoinForCashOut: { type: Number, default: 0 }, //min coin requried for convert coin to default currency i.e., 1000 coin = 1 $
    loginBonus: { type: Number, default: 5000 },

    minWithdrawalRequestedCoin: { type: Number, default: 0 },
    currency: {
      name: { type: String, default: "", unique: true },
      symbol: { type: String, default: "", unique: true },
      countryCode: { type: String, default: "" },
      currencyCode: { type: String, default: "" },
      isDefault: { type: Boolean, default: false },
    }, //default currency

    privateKey: { type: Object, default: {} }, //firebase.json handle notification

    //video banned setting
    videoBanned: { type: Array, default: [] },
    sightengineUser: { type: String, default: "API USER" },
    sightengineSecret: { type: String, default: "API SECRET" },

    //shorts effect setting
    isEffectActive: { type: Boolean, default: false },
    androidLicenseKey: { type: String, default: "LICENSE KEY" },
    iosLicenseKey: { type: String, default: "LICENSE KEY" },

    watermarkType: { type: Number, enum: [1, 2] }, //1.active 2.inactive
    isWatermarkOn: { type: Boolean, default: false },
    watermarkIcon: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

settingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Setting", settingSchema);
