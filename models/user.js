//Creating Our User Model
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true, 
	},
	profilePic: {
		type: String,
		default:
			"https://res.cloudinary.com/dvc8kivbh/image/upload/v1745148979/Camply/profilePics/sy8kzc0y1kogaud4sds6.jpg",
	},
	fileName: {
		type: String,
		default: "Camply/profilePics/sy8kzc0y1kogaud4sds6",
	},
	about: {
		type: String,
		default: "Not provided",
	},
	followers: {
		type: [String],
		default: [],
	},
	location: {
		default: "N/A",
		type: String,
	},
	totalPosts: {
		type: Number,
		default: 0,
	},
	totalLikes: {
		default: 0,
		type: Number,
	},
	favourites: [
		{
			type: Schema.Types.ObjectId,
			ref: "Campground",
		},
	],
	lastLogin: {
		ip: String,
		time: Date,
		userAgent: String,
	},
});

UserSchema.plugin(passportLocalMongoose); 
module.exports = mongoose.model("User", UserSchema);
