//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const songCategoryController = require("../../controllers/admin/songCategory.controller");

//create songCategory
route.post("/create", checkAccessWithSecretKey(), upload.single("image"), songCategoryController.create);

//update songCategory
route.patch("/update", checkAccessWithSecretKey(), upload.single("image"), songCategoryController.update);

//get all songCategory
route.get("/getSongCategory", checkAccessWithSecretKey(), songCategoryController.getSongCategory);

//delete songCategory
route.delete("/deleteSongCategory", checkAccessWithSecretKey(), songCategoryController.destroy);

module.exports = route;
