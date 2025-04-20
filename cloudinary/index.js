//Uploading To Cloudinary Basics
const cloudinary = require("cloudinary").v2;
const {CloudinaryStorage} = require("multer-storage-cloudinary");

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_KEY,
	api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "Camply", // for storing folders in cloudinary
		allowedFormats: ["jpeg", "png", "jpg"],
	},
});

const profilePicStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "Camply/profilePics",
		allowedFormats: ["jpeg", "png", "jpg"],
		transformation: [{width: 150, height: 150, crop: "thumb", gravity: "face"}],
	},
});

module.exports = {
	cloudinary,
	storage,
	profilePicStorage,
};
