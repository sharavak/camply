const User = require("../models/user");
const Campground = require("../models/campground");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const {cloudinary} = require("../cloudinary"); // requiring a folder because we are using index.js
const {model} = require("mongoose");
const {raw} = require("express");
const review = require("../models/review");

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL,
		pass: process.env.PASS,
	},
});

if (process.env.Node_ENV !== "production") {
	require("dotenv").config();
}

module.exports.renderRegister = (req, res) => {
	res.render("users/register");
};
module.exports.register = async (req, res, next) => {
	try {
		const {email, username, password} = req.body;
		const user = new User({email, username});
		const registerUser = await User.register(user, password);
		console.log(registerUser);

		const mailOptions = {
			from: `"Camply Team" <${process.env.EMAIL}>`,
			to: email,
			subject: "Welcome to Camply! 🎉",
			html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f9f9f9; text-align: center;">
                <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                  <h1 style="color: #4CAF50;">Welcome to <span style="color: #000;">Camply</span>!</h1>
                  <p style="font-size: 16px; color: #333;">
                    Hello 👋, thank you for joining Camply – your gateway to unforgettable camping experiences!
                  </p>
                  <img src="https://img.freepik.com/free-vector/camping-place-cartoon-composition-with-yellow-tent-lamp-pot-with-dinner-fire-night-sky_1284-54945.jpg" 
                       alt="Camply" style="width: 100%; max-width: 300px; border-radius: 8px; margin: 20px auto;">
                  <p style="font-size: 15px; color: #555;">
                    Start exploring camps, managing your trips, and connecting with nature today.
                  </p>
                  <a href="${res.locals.baseUrl}/campgrounds" 
                     style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
                    Go to Campgrounds
                  </a>
                  <p style="font-size: 12px; color: #aaa; margin-top: 40px;">Need help? Contact us at support@camply.com</p>
                  <hr style="margin: 30px 0;">
                  <p style="font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} Camply. All rights reserved.</p>
                </div>
              </div>
            `,
		};

		//Fixing Register Route
		req.login(registerUser, (err) => {
			if (err) return next(err);

			req.flash("success", "Welcome to Yelp Camp!");
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log("Email sent: " + info.response);
				}
			});

			res.redirect("/campgrounds");
		});
	} catch (e) {
		req.flash("error", e.message);
		res.redirect("/register");
	}
};

module.exports.renderLogin = (req, res) => {
	res.render("users/login");
};

module.exports.login = (req, res) => {
	req.flash("success", "Welcome back!");
	const redirectUrl = req.session.returnTo || "/campgrounds";
	delete req.session.returnTo;
	res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
	req.logout((err) => {
		if (err) {
		}
		req.flash("success", "Goodbye!");
		res.redirect("/campgrounds");
	});
};
module.exports.getLink = (req, res) => {
	console.log(req.get("host"));
	res.render("users/changePass");
};
module.exports.sendLink = async (req, res) => {
	const {email} = req.body;
	const user = await User.findOne({email: email});
	if (!user) {
		req.flash("error", "Accound not found!!!");
		return res.redirect("/register");
	}

	const payload = {email: email, username: user.username};
	const token = jwt.sign({data: payload}, process.env.SECRET_SIGN, {
		expiresIn: "120s",
	});

	const mailOptions = {
		from: `"Camply Support" <${process.env.EMAIL}>`,
		to: email,
		subject: "Reset your Camply password",
		html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <h2 style="color: #4CAF50;">Camply</h2>
            <p style="font-size: 16px;">You requested a password reset. Click the button below to reset your password:</p>
            <a href="${res.locals.baseUrl}/verify?token=${token}" 
               style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
            <p style="font-size: 14px; color: #777;">If you didn’t request this, you can safely ignore this email.</p>
            <hr style="margin-top: 40px;">
            <p style="font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} Camply. All rights reserved.</p>
          </div>
        `,
	};

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log("Email sent: " + info.response);
		}
	});
	req.flash("success", "Mail link has been sent");
	return res.redirect("/link");
};

module.exports.changePass = async (req, res) => {
	const {token} = req.query;
	try {
		const data = jwt.verify(token, process.env.SECRET_SIGN);
		return res.render("users/forgetPass", {token});
	} catch {
		req.flash("error", "Token is expired");
		return res.redirect("/link");
	}
};

module.exports.postChangePass = async (req, res) => {
	const {token} = req.query;
	const {newPassword} = req.body;

	const data = jwt.verify(token, process.env.SECRET_SIGN);
	const {username} = data.data;
	const user = await User.findByUsername(username);
	try {
		await user.setPassword(newPassword);
		await user.save();
		req.flash("success", "Password has been changed successfully");
		return res.redirect("/login");
	} catch (err) {
		req.flash("error", "Error in changing the password");
		return res.redirect("/link");
	}
};

module.exports.renderProfile = async (req, res) => {
	const user = await User.findByUsername(req.params.username);
	if (req.user) {
		const findFollowUser = user.followers.find(
			(user) => user === req.user.username
		);
		return res.render("users/profile", {
			user: user,
			currUser: findFollowUser,
			currUserProf: req.user,
		});
	}
	return res.render("users/profile", {
		error: false,
		user: user,
		currUser: "",
		currUserProf: "",
	});
};
module.exports.updateProfile = async (req, res) => {
	const user = await User.findById(req.user._id);
	user.about = req.body.about;
	if (req.file !== undefined) {
		console.log(req.file, "fsdfsdaf");
		await cloudinary.uploader.destroy(user.fileName);
		user.profilePic = req.file.path;
		user.fileName = req.file.filename;
	}
	await user.save();
	req.flash("success", "Profile has been updated successfully!!!");
	return res.redirect(`/profile/${req.user.username}`);
};

module.exports.updateFollowers = async (req, res) => {
	const {username, follow} = req.body;
	if (follow !== req.user.username) {
		const user = await User.findByUsername(follow);
		let del = true;
		if (!user.followers.includes(username)) {
			user.followers.push(username);
			del = !del;
		} else user.followers.splice(username, 1);

		await user.save();
		return res.json({followers: user.followers.length, del: del});
	}
	return res.json({error: false}).status(404);

};
