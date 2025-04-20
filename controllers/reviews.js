//Adding a Reviews Controller
const Campground = require("../models/campground");
const Review = require("../models/review");
module.exports.createReview = async (req, res) => {
	const campground = await Campground.findById(req.params.id);
	const review = new Review(req.body.review);
	review.author = req.user._id;
	campground.reviews.push(review);
	await review.save();
	await campground.save();
	req.flash("success", "Created new review");
	res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleleReview = async (req, res) => {
	const {id, reviewId} = req.params; // the pull removes it from the array with the given id for example
	await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
	await Review.findByIdAndDelete(reviewId); // this triggers findOneAndDelete middleware
	req.flash("success", "Successfully deleted review");
	res.redirect(`/campgrounds/${id}`);
};
