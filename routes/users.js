//Register Form

const express = require("express");
const passport = require("passport");
const router = express.Router();
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const users = require("../controllers/users");
const user = require("../models/user");

const multer = require("multer");

const {profilePicStorage} = require("../cloudinary"); // adjust path as needed

const uploadProfilePic = multer({storage: profilePicStorage});

router
	.route("/register")
	.get(users.renderRegister)
	.post(catchAsync(users.register));

router.route("/link").get(users.getLink).post(catchAsync(users.sendLink));
router.route("/verify").get(users.changePass).post(users.postChangePass);

router
	.route("/profile/:username")
	.get(users.renderProfile)
	.post(uploadProfilePic.single("profilePic"), users.updateProfile);

router.route("/profile/:username/follower").post(users.updateFollowers);
router
	.route("/login")
	.get(users.renderLogin)
	.post(
		passport.authenticate("local", {
			failureFlash: true,
			failureRedirect: "/login",
		}),
		users.login
	);
// router.get('/login', users.renderLogin)
// router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),users.login)

router.get("/logout", users.logout);
module.exports = router;
