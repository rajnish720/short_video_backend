const Admin = require("../../models/admin.model");

//fs
const fs = require("fs");

//jwt token
const jwt = require("jsonwebtoken");

//nodemailer
const nodemailer = require("nodemailer");

//Cryptr
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//import model
const Login = require("../../models/login.model");

function _0x5a59() {
  const _0x327eb6 = ["1634408hYJRIm", "5osPkxj", "3ycgCtU", "2667906MykdLR", "jago-malda", "16LPUZpE", "780903OJPGef", "2897876mZpRuk", "2866974jyZYyO", "37370zqGkle", "66857iZXmoC", "5830JlADGH"];
  _0x5a59 = function () {
    return _0x327eb6;
  };
  return _0x5a59();
}
const _0xc7bf5c = _0x2619;
function _0x2619(_0x3c3df0, _0x53407d) {
  const _0x3c2cf4 = _0x5a59();
  return (
    (_0x2619 = function (_0x513d1b, _0x21318b) {
      _0x513d1b = _0x513d1b - (-0x2 * 0xc2e + -0xff + 0x1ab9);
      let _0x2a24b3 = _0x3c2cf4[_0x513d1b];
      return _0x2a24b3;
    }),
    _0x2619(_0x3c3df0, _0x53407d)
  );
}
(function (_0x11740f, _0x3910a7) {
  const _0x492b2c = _0x2619,
    _0x1a9af7 = _0x11740f();
  while (!![]) {
    try {
      const _0x138dba =
        -parseInt(_0x492b2c(0x166)) / (0x31d + 0x120b * 0x2 + 0xad * -0x3a) +
        (parseInt(_0x492b2c(0x160)) / (-0x1 * 0x12f1 + 0x529 + 0xdca)) * (-parseInt(_0x492b2c(0x162)) / (0x13db + 0xf7d + -0x14f * 0x1b)) +
        (-parseInt(_0x492b2c(0x167)) / (0x1 * 0x331 + -0x3a * -0x1f + -0xa33)) * (parseInt(_0x492b2c(0x161)) / (-0x4 * -0x426 + 0x57 * -0x13 + -0xa1e)) +
        parseInt(_0x492b2c(0x168)) / (0x5d9 + 0x611 * -0x3 + 0xc60) +
        (-parseInt(_0x492b2c(0x15e)) / (0x89c * 0x2 + -0x1489 * 0x1 + 0x2 * 0x1ac)) * (parseInt(_0x492b2c(0x165)) / (0x1858 + -0x1649 + -0x207)) +
        parseInt(_0x492b2c(0x163)) / (0x399 * -0x1 + 0x2b * -0x82 + 0x1 * 0x1978) +
        (-parseInt(_0x492b2c(0x169)) / (0x25cb + 0x1b31 + -0x40f2)) * (-parseInt(_0x492b2c(0x15f)) / (-0x4d + -0xc11 * 0x1 + 0xc69));
      if (_0x138dba === _0x3910a7) break;
      else _0x1a9af7["push"](_0x1a9af7["shift"]());
    } catch (_0x53a49b) {
      _0x1a9af7["push"](_0x1a9af7["shift"]());
    }
  }
})(_0x5a59, -0x4f1d4 * -0x1 + -0x4 * 0x12f87 + 0x61a53);
const LiveUser = require(_0xc7bf5c(0x164) + "r");

//create admin
exports.store = async (req, res) => {
  function _0x5c4f(_0x2a0b65, _0x466828) {
    const _0x1afe32 = _0x3bb3();
    return (
      (_0x5c4f = function (_0xc99954, _0xd405a7) {
        _0xc99954 = _0xc99954 - (0x1595 * -0x1 + -0x5d2 * -0x2 + 0xb93);
        let _0x459973 = _0x1afe32[_0xc99954];
        return _0x459973;
      }),
      _0x5c4f(_0x2a0b65, _0x466828)
    );
  }
  function _0x3bb3() {
    const _0x201e48 = [
      "1757539IwHntK",
      "encrypt",
      "alid\x20detai",
      "message",
      "erver\x20Erro",
      "1790dCYGZJ",
      "Admin\x20crea",
      "save",
      "292673xApyMD",
      "10728718tniFgw",
      "login",
      "code",
      "json",
      "Internal\x20S",
      "PurchaseCo",
      "ted\x20Succes",
      "de\x20is\x20not\x20",
      "password",
      "trim",
      "sfully.",
      "ls.",
      "findOne",
      "body",
      "8dugNJR",
      "112vnJFOw",
      "Oops\x20!\x20Inv",
      "valid.",
      "status",
      "10cToByV",
      "81370WgtwHZ",
      "781686kDlNSv",
      "email",
      "log",
      "file",
      "purchaseCo",
      "1947MZbstj",
      "4528458motclN",
    ];
    _0x3bb3 = function () {
      return _0x201e48;
    };
    return _0x3bb3();
  }
  const _0x17520f = _0x5c4f;
  (function (_0x41f5d0, _0x2d79c1) {
    const _0x5de270 = _0x5c4f,
      _0x2c441a = _0x41f5d0();
    while (!![]) {
      try {
        const _0x20e617 =
          parseInt(_0x5de270(0x1a9)) / (0x1 * -0x1695 + 0x69a + -0x21 * -0x7c) +
          (-parseInt(_0x5de270(0x1a6)) / (-0x3d5 * -0x9 + 0x1446 + -0x36c1)) * (-parseInt(_0x5de270(0x1c4)) / (-0x16ec + -0x1 * -0x1e01 + -0x712)) +
          (parseInt(_0x5de270(0x1b9)) / (0x26ee + 0x1784 + 0x7a * -0x83)) * (-parseInt(_0x5de270(0x1be)) / (0x26b9 + -0x2c * -0x29 + -0x2dc0)) +
          parseInt(_0x5de270(0x1c5)) / (-0xacd + 0x57 * -0x4e + 0x2555) +
          (parseInt(_0x5de270(0x1c6)) / (0x1e72 + 0x3e4 + -0x224f)) * (parseInt(_0x5de270(0x1b8)) / (-0x94d + 0x1 * 0xd81 + -0x42c)) +
          (-parseInt(_0x5de270(0x1bf)) / (-0x8d1 + 0x1 * 0x1445 + -0xb6b)) * (-parseInt(_0x5de270(0x1bd)) / (0x1e9 + 0x1 * -0x7f7 + 0x4 * 0x186)) +
          -parseInt(_0x5de270(0x1aa)) / (0x244 + -0x3 * -0x3e1 + -0xddc);
        if (_0x20e617 === _0x2d79c1) break;
        else _0x2c441a["push"](_0x2c441a["shift"]());
      } catch (_0x2abe8f) {
        _0x2c441a["push"](_0x2c441a["shift"]());
      }
    }
  })(_0x3bb3, -0x98652 + -0x1 * 0xe46a3 + -0x15b5 * -0x179);
  try {
    if (!req[_0x17520f(0x1b7)][_0x17520f(0x1ac)] || !req[_0x17520f(0x1b7)][_0x17520f(0x1c0)] || !req[_0x17520f(0x1b7)][_0x17520f(0x1b2)]) {
      if (req[_0x17520f(0x1c2)]) deleteFile(req[_0x17520f(0x1c2)]);
      return res[_0x17520f(0x1bc)](-0x1 * 0x140d + 0x120e * 0x1 + 0x9 * 0x4f)[_0x17520f(0x1ad)]({ status: ![], message: _0x17520f(0x1ba) + _0x17520f(0x1a3) + _0x17520f(0x1b5) });
    }
    const data = await LiveUser(req[_0x17520f(0x1b7)][_0x17520f(0x1ac)], -0xa511ba + -0x1 * -0x3cfc3c9 + -0x30950 * -0x1);
    if (data) {
      const login = await Login[_0x17520f(0x1b6)]();
      if (!login) {
        const newLogin = new Login();
        (newLogin[_0x17520f(0x1ab)] = !![]), await newLogin[_0x17520f(0x1a8)]();
      } else (login[_0x17520f(0x1ab)] = !![]), await login[_0x17520f(0x1a8)]();
      const admin = new Admin();
      return (
        (admin[_0x17520f(0x1c0)] = req[_0x17520f(0x1b7)][_0x17520f(0x1c0)]?.[_0x17520f(0x1b3)]()),
        (admin[_0x17520f(0x1c3) + "de"] = req[_0x17520f(0x1b7)][_0x17520f(0x1ac)]),
        (admin[_0x17520f(0x1b2)] = cryptr[_0x17520f(0x1a2)](req[_0x17520f(0x1b7)][_0x17520f(0x1b2)])),
        await admin[_0x17520f(0x1a8)](),
        res[_0x17520f(0x1bc)](-0x29a + -0x19e7 * -0x1 + -0x1 * 0x1685)[_0x17520f(0x1ad)]({ status: !![], message: _0x17520f(0x1a7) + _0x17520f(0x1b0) + _0x17520f(0x1b4), data: admin })
      );
    } else return res[_0x17520f(0x1bc)](0x2389 + -0x947 + -0x197a)[_0x17520f(0x1ad)]({ status: ![], message: _0x17520f(0x1af) + _0x17520f(0x1b1) + _0x17520f(0x1bb) });
  } catch (_0x1c07cb) {
    if (req[_0x17520f(0x1c2)]) deleteFile(req[_0x17520f(0x1c2)]);
    return (
      console[_0x17520f(0x1c1)](_0x1c07cb),
      res[_0x17520f(0x1bc)](-0xb79 * -0x2 + 0x2 * -0x2cc + 0x49 * -0x36)[_0x17520f(0x1ad)]({ status: ![], message: _0x1c07cb[_0x17520f(0x1a4)] || _0x17520f(0x1ae) + _0x17520f(0x1a5) + "r" })
    );
  }
};

//admin login
exports.login = async (req, res) => {
  function _0x4273(_0x36289d, _0x1efcd4) {
    const _0x43929c = _0x1a91();
    return (
      (_0x4273 = function (_0x4a2016, _0x46d309) {
        _0x4a2016 = _0x4a2016 - (-0x16d3 + 0xf * 0x133 + 0x7 * 0xef);
        let _0x274902 = _0x43929c[_0x4a2016];
        return _0x274902;
      }),
      _0x4273(_0x36289d, _0x1efcd4)
    );
  }
  const _0x3c2f04 = _0x4273;
  (function (_0x21ed1f, _0x57c6e7) {
    const _0x42bd0b = _0x4273,
      _0x231df3 = _0x21ed1f();
    while (!![]) {
      try {
        const _0x44fdbe =
          (parseInt(_0x42bd0b(0x1d0)) / (-0xf17 + -0x5 * -0x569 + -0xbf5)) * (parseInt(_0x42bd0b(0x1da)) / (0xd * -0x265 + 0x2 * 0x22c + -0x1 * -0x1acb)) +
          (parseInt(_0x42bd0b(0x1d5)) / (-0x2e5 * 0xb + -0x2323 + 0x42fd)) * (-parseInt(_0x42bd0b(0x1b3)) / (0x1 * 0xe8f + -0x1e59 + -0x77 * -0x22)) +
          (parseInt(_0x42bd0b(0x1be)) / (0x13 * 0x207 + -0xa3 * -0x2f + -0x1 * 0x446d)) * (parseInt(_0x42bd0b(0x1b7)) / (-0x3cb + 0x1 * -0x2016 + 0x5b * 0x65)) +
          (-parseInt(_0x42bd0b(0x1ba)) / (-0x12a7 * -0x1 + 0x22ed * 0x1 + 0x358d * -0x1)) * (-parseInt(_0x42bd0b(0x1db)) / (-0x69 * -0x58 + 0x67 * 0x59 + -0x47df)) +
          parseInt(_0x42bd0b(0x1d7)) / (0x77f + -0x4f * 0x8 + 0x1aa * -0x3) +
          (parseInt(_0x42bd0b(0x1d9)) / (-0x1f * -0x115 + 0x21e1 + -0x4362)) * (-parseInt(_0x42bd0b(0x1cb)) / (-0x5eb + -0x260e * -0x1 + -0x2018)) +
          parseInt(_0x42bd0b(0x1b9)) / (0xf6f * -0x1 + 0x116b + -0x1f0);
        if (_0x44fdbe === _0x57c6e7) break;
        else _0x231df3["push"](_0x231df3["shift"]());
      } catch (_0x1324a6) {
        _0x231df3["push"](_0x231df3["shift"]());
      }
    }
  })(_0x1a91, 0xdcd5d + -0x3a275 * -0x3 + 0xc54b * -0x17);
  function _0x1a91() {
    const _0x4b5580 = [
      "2458132ikQeUy",
      "ail.",
      "th\x20that\x20em",
      "Oops\x20!\x20Inv",
      "6eNomRL",
      "sword\x20does",
      "694380URmNxS",
      "548422Hcblys",
      "trim",
      "ever\x20Error",
      "image",
      "857695hBUUzA",
      "findOne",
      "JWT_SECRET",
      "name",
      "alid\x20detai",
      "decrypt",
      "ls!",
      "_id",
      "log",
      "json",
      "status",
      "sign",
      "in\x20does\x20no",
      "964766skCbKy",
      "password",
      "message",
      "Internal\x20S",
      "valid.",
      "244YpdqCd",
      "Oops\x20!\x20Pas",
      "t\x20found\x20wi",
      "Oops\x20!\x20adm",
      "body",
      "3wAmxrY",
      "Admin\x20has\x20",
      "2386656TrCowm",
      "email",
      "20DLPaKn",
      "3602miuvpi",
      "32logMuK",
      "n\x27t\x20matche",
      "env",
      "PurchaseCo",
      "de\x20is\x20not\x20",
      "been\x20login",
      "purchaseCo",
    ];
    _0x1a91 = function () {
      return _0x4b5580;
    };
    return _0x1a91();
  }
  try {
    if (!req[_0x3c2f04(0x1d4)][_0x3c2f04(0x1d8)] || !req[_0x3c2f04(0x1d4)][_0x3c2f04(0x1cc)])
      return res[_0x3c2f04(0x1c8)](-0x4b * 0x62 + -0x1 * 0x6fc + 0x1 * 0x247a)[_0x3c2f04(0x1c7)]({ status: ![], message: _0x3c2f04(0x1b6) + _0x3c2f04(0x1c2) + _0x3c2f04(0x1c4) });
    const admin = await Admin[_0x3c2f04(0x1bf)]({ email: req[_0x3c2f04(0x1d4)][_0x3c2f04(0x1d8)][_0x3c2f04(0x1bb)]() });
    if (!admin)
      return res[_0x3c2f04(0x1c8)](0x85 * 0x11 + -0xf5a + -0x3 * -0x26f)[_0x3c2f04(0x1c7)]({
        status: ![],
        message: _0x3c2f04(0x1d3) + _0x3c2f04(0x1ca) + _0x3c2f04(0x1d2) + _0x3c2f04(0x1b5) + _0x3c2f04(0x1b4),
      });
    if (cryptr[_0x3c2f04(0x1c3)](admin[_0x3c2f04(0x1cc)]) !== req[_0x3c2f04(0x1d4)][_0x3c2f04(0x1cc)])
      return res[_0x3c2f04(0x1c8)](-0x35 * -0x38 + 0x86c + -0x99e * 0x2)[_0x3c2f04(0x1c7)]({ status: ![], message: _0x3c2f04(0x1d1) + _0x3c2f04(0x1b8) + _0x3c2f04(0x1dc) + "d!" });
    if (admin[_0x3c2f04(0x1e1) + "de"]) {
      const data = await LiveUser(admin?.[_0x3c2f04(0x1e1) + "de"], 0x2961a24 + 0x1739d3 + 0x806768);
      if (data) {
        const payload = { _id: admin[_0x3c2f04(0x1c5)], name: admin[_0x3c2f04(0x1c1)], email: admin[_0x3c2f04(0x1d8)], image: admin[_0x3c2f04(0x1bd)] },
          token = jwt[_0x3c2f04(0x1c9)](payload, process?.[_0x3c2f04(0x1dd)]?.[_0x3c2f04(0x1c0)], { expiresIn: "1h" });
        return res[_0x3c2f04(0x1c8)](-0xbc9 + 0x1646 + -0x9b5)[_0x3c2f04(0x1c7)]({ status: !![], message: _0x3c2f04(0x1d6) + _0x3c2f04(0x1e0) + ".", data: token });
      } else return res[_0x3c2f04(0x1c8)](0x50 + -0x8 * 0x221 + 0x1180)[_0x3c2f04(0x1c7)]({ status: ![], message: _0x3c2f04(0x1de) + _0x3c2f04(0x1df) + _0x3c2f04(0x1cf) });
    } else return res[_0x3c2f04(0x1c8)](-0x25b1 + 0x1e54 + 0x825)[_0x3c2f04(0x1c7)]({ status: ![], message: _0x3c2f04(0x1de) + _0x3c2f04(0x1df) + _0x3c2f04(0x1cf) });
  } catch (_0xed01f1) {
    return (
      console[_0x3c2f04(0x1c6)](_0xed01f1),
      res[_0x3c2f04(0x1c8)](-0x16a * -0x13 + 0x2 * -0xab1 + -0x388)[_0x3c2f04(0x1c7)]({ status: ![], message: _0xed01f1[_0x3c2f04(0x1cd)] || _0x3c2f04(0x1ce) + _0x3c2f04(0x1bc) })
    );
  }
};

//update admin profile
exports.update = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "admin does not found!" });
    }

    admin.name = req?.body?.name ? req?.body?.name : admin.name;
    admin.email = req?.body?.email ? req?.body?.email.trim() : admin.email;

    if (req?.file) {
      const image = admin?.image.split("storage");
      if (image) {
        if (fs.existsSync("storage" + image[1])) {
          fs.unlinkSync("storage" + image[1]);
        }
      }

      admin.image = req?.file?.path;
    }

    await admin.save();

    const data = await Admin.findById(admin._id);
    data.password = cryptr.decrypt(data.password);

    return res.status(200).json({
      status: true,
      message: "Admin profile has been updated.",
      data: data,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get admin profile
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "admin does not found." });
    }

    const data = await Admin.findById(admin._id);
    data.password = cryptr.decrypt(data.password);

    return res.status(200).json({ status: true, message: "admin profile get by admin!", data: data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//send email for forgot the password (forgot password)
exports.forgotPassword = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "email must be requried." });
    }

    const email = req.query.email.trim();

    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      return res.status(200).json({ status: false, message: "admin does not found with that email." });
    }

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process?.env?.EMAIL,
        pass: process?.env?.APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    var tab = "";
    tab += "<!DOCTYPE html><html><head>";
    tab += "<meta charset='utf-8'><meta http-equiv='x-ua-compatible' content='ie=edge'><meta name='viewport' content='width=device-width, initial-scale=1'>";
    tab += "<style type='text/css'>";
    tab += " @media screen {@font-face {font-family: 'Source Sans Pro';font-style: normal;font-weight: 400;}";
    tab += "@font-face {font-family: 'Source Sans Pro';font-style: normal;font-weight: 700;}}";
    tab += "body,table,td,a {-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }";
    tab += "table,td {mso-table-rspace: 0pt;mso-table-lspace: 0pt;}";
    tab += "img {-ms-interpolation-mode: bicubic;}";
    tab +=
      "a[x-apple-data-detectors] {font-family: inherit !important;font-size: inherit !important;font-weight: inherit !important;line-height:inherit !important;color: inherit !important;text-decoration: none !important;}";
    tab += "div[style*='margin: 16px 0;'] {margin: 0 !important;}";
    tab += "body {width: 100% !important;height: 100% !important;padding: 0 !important;margin: 0 !important;}";
    tab += "table {border-collapse: collapse !important;}";
    tab += "a {color: #1a82e2;}";
    tab += "img {height: auto;line-height: 100%;text-decoration: none;border: 0;outline: none;}";
    tab += "</style></head><body>";
    tab += "<table border='0' cellpadding='0' cellspacing='0' width='100%'>";
    tab += "<tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'>";
    tab += "<tr><td align='center' valign='top' bgcolor='#ffffff' style='padding:36px 24px 0;border-top: 3px solid #d4dadf;'><a href='#' target='_blank' style='display: inline-block;'>";
    tab +=
      "<img src='https://www.stampready.net/dashboard/editor/user_uploads/zip_uploads/2018/11/23/5aXQYeDOR6ydb2JtSG0p3uvz/zip-for-upload/images/template1-icon.png' alt='Logo' border='0' width='48' style='display: block; width: 500px; max-width: 500px; min-width: 500px;'></a>";
    tab +=
      "</td></tr></table></td></tr><tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'><tr><td align='center' bgcolor='#ffffff'>";
    tab += "<h1 style='margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;'>SET YOUR PASSWORD</h1></td></tr></table></td></tr>";
    tab +=
      "<tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'><tr><td align='center' bgcolor='#ffffff' style='padding: 24px; font-size: 16px; line-height: 24px;font-weight: 600'>";
    tab += "<p style='margin: 0;'>Not to worry, We got you! Let's get you a new password.</p></td></tr><tr><td align='left' bgcolor='#ffffff'>";
    tab += "<table border='0' cellpadding='0' cellspacing='0' width='100%'><tr><td align='center' bgcolor='#ffffff' style='padding: 12px;'>";
    tab += "<table border='0' cellpadding='0' cellspacing='0'><tr><td align='center' style='border-radius: 4px;padding-bottom: 50px;'>";
    tab +=
      "<a href='" +
      process?.env?.baseURL +
      "changePassword?id=" +
      `${admin._id}` +
      "' target='_blank' style='display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px;background: #FE9A16; box-shadow: -2px 10px 20px -1px #33cccc66;'>SUBMIT PASSWORD</a>";
    tab += "</td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>";

    var mailOptions = {
      from: process?.env?.EMAIL,
      to: email,
      subject: `Sending email from ${process?.env?.projectName} for Password Security`,
      html: tab,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(200).json({
          status: false,
          message: "Email send error.",
        });
      } else {
        return res.status(200).json({
          status: true,
          message: "Email send for forget the password.",
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update password
exports.updatePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "admin does not found." });
    }

    if (!req.body.oldPass || !req.body.newPass || !req.body.confirmPass) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    if (cryptr.decrypt(admin.password) !== req.body.oldPass) {
      return res.status(200).json({
        status: false,
        message: "Oops! Password doesn't match!",
      });
    }

    if (req.body.newPass !== req.body.confirmPass) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    const hash = cryptr.encrypt(req.body.newPass);
    admin.password = hash;

    const [savedAdmin, data] = await Promise.all([admin.save(), Admin.findById(admin._id)]);

    data.password = cryptr.decrypt(savedAdmin.password);

    return res.status(200).json({
      status: true,
      message: "Password has been changed by the admin.",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//set Password
exports.setPassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req?.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin does not found." });
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    admin.password = cryptr.encrypt(newPassword);
    await admin.save();

    admin.password = cryptr.decrypt(admin?.password);

    return res.status(200).json({
      status: true,
      message: "Password has been updated Successfully.",
      data: admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
