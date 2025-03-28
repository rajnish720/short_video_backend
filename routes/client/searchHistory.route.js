//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const SearchHistoryController = require("../../controllers/client/searchHistory.controller");

//search users
route.post("/searchUsers", checkAccessWithSecretKey(), SearchHistoryController.searchUsers);

//get previous search data of users
route.get("/searchedDataOfUsers", checkAccessWithSecretKey(), SearchHistoryController.searchedDataOfUsers);

//search hashTag
route.post("/searchHashTag", checkAccessWithSecretKey(), SearchHistoryController.searchHashTag);

//get previous search data of hasgTags
route.get("/searchedDataOfHashTags", checkAccessWithSecretKey(), SearchHistoryController.searchedDataOfHashTags);

//clear all searchHistory for particular user
route.delete("/clearAllSearchHistory", checkAccessWithSecretKey(), SearchHistoryController.clearAllSearchHistory);

module.exports = route;
