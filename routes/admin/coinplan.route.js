const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

//Controller
const coinplanController = require("../../controllers/admin/coinplan.controller");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//create coinplan
route.post("/store", upload.single("icon"), checkAccessWithSecretKey(), coinplanController.store);

//update coinplan
route.patch("/update", upload.single("icon"), checkAccessWithSecretKey(), coinplanController.update);

//handle isActive switch
route.patch("/handleSwitch", checkAccessWithSecretKey(), coinplanController.handleSwitch);

//delete coinplan
route.delete("/delete", checkAccessWithSecretKey(), coinplanController.delete);

//get coinplan
route.get("/get", checkAccessWithSecretKey(), coinplanController.get);

module.exports = route;
