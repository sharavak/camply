const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");
const User = require("./user");

//Adding a Thumbnail Virtual Property
const ImageSchema = new Schema({
	url: String,
	filename: String,
});
ImageSchema.virtual("thumbnail").get(function () {
	console.log("Mongoose Virtual");
	console.log(this.url.replace("/upload", "/upload/w_200"));
	return this.url.replace("/upload", "/upload/w_200");
});

const opts = {toJSON: {virtuals: true}};
const CampgroundSchema = new Schema(
	{
		title: String,
		images: [
			{
				//Adding Images
				url: String,
				filename: String, //Storing Uploaded Image Links In Mongo
			},
		],
		geometry: {
			type: {
				//type: {'Point', coordinates: [80.148864, 13.118544]// this we get from Mapbox and It is called GeoJson,it is the specific format for storing the lat and long so the type should be point
				type: String,
				enum: ["Point"],
				required: true,
			},
			coordinates: {
				type: [Number],
				required: true,
			},
		}, // in Mongoose we can simliar like this and mongo supports lots of geocoding
		price: Number,
		description: String,
		location: String,
		likes: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
				default: [],
			},
		],
		views: {
			type: Number,
			default: 0,
		},
		//Adding an Author to Campground
		author: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		reviews: [
			{
				type: Schema.Types.ObjectId,
				ref: "Review",
			},
		],
		date: String,
	},
	opts
);

CampgroundSchema.post("findOneAndDelete", async function (doc) {
	if (doc) {
		await Review.deleteMany({
			_id: {
				$in: doc.reviews,
			},
		});
		const user = await User.findByIdAndUpdate(doc.author, {
			$inc: {
				totalPosts: -1,
				totalLikes: -doc.likes.length,
			},
			$pull: {
				favourites: doc._id,
			},
		});
	}
});

CampgroundSchema.virtual("properties.popUpMarkUp").get(function () {
	// mapbox preference and there is a issue bacause in index.ejs template we are converting campgrounds into JSON but virtual won't into it.So this is the issue
	return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
            <p>${this.description.substring(0, 25)}...</p>`;
});
CampgroundSchema.methods.editDate = function () {
	return new Date();
};
console.log(CampgroundSchema.editDate);

module.exports = mongoose.model("Campground", CampgroundSchema);
