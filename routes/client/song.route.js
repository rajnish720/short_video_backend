//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const SongController = require("../../controllers/client/song.controller");

//song favorite by the particular user
route.post("/favoriteSongByUser", checkAccessWithSecretKey(), SongController.favoriteSongByUser);

//get all songs when upload video by the user
route.get("/getSongsByUser", checkAccessWithSecretKey(), SongController.getSongsByUser);

//get all favorite songs when upload video by the user (favorite by particular user)
route.get("/getFavoriteSongs", checkAccessWithSecretKey(), SongController.getFavoriteSongs);

//search songs by thse user
route.get("/searchSongs", checkAccessWithSecretKey(), SongController.searchSongs);

module.exports = route;
