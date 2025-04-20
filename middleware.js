const ExpressError = require("./utils/ExpressError");
const { campgroundSchema, reviewSchema } = require("./schemas");
const Campground = require("./models/campground");
const Review = require("./models/review");

//isLoggedIn Middleware
const isLoggedIn = (req, res, next) => {
	// console.log('req.user',req.user);// this method is coming from passport and it gives deserialize from the session.
	if (!req.isAuthenticated()) {
		// this method is coming from passport
		//ReturnTo Behavior
		req.session.returnTo = req.originalUrl;
		req.flash("error", "You must be signed in first!");
		return res.redirect("/login");
	}
	next();
};

const isLoggedInForAJAX = (req, res, next) => {
	if (!req.isAuthenticated()) {
		return res.json({ error: "You must be signed in first!" });
	}
	next();
};

//JOI Validation Middleware
const validateCampground = (req, res, next) => {
	const { error } = campgroundSchema.validate(req.body);
	// console.log(result)
	if (error) {
		const msg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};

//Authorization Middleware
const isAuthor = async (req, res, next) => {
	//Campground Permissions
	const { id } = req.params;
	const campground = await Campground.findById(id);
	if (!campground.author.equals(req.user._id)) {
		req.flash("error", "You do not have permission to do that");
		return res.redirect(`/campgrounds/${id}`);
	}
	next();
};

const isReviewAuthor = async (req, res, next) => {
	//Campground Permissions
	const { id, reviewId } = req.params;
	const review = await Review.findById(reviewId);
	if (!review.author.equals(req.user._id)) {
		req.flash("error", "You do not have permission to do that");
		return res.redirect(`/campgrounds/${id}`);
	}
	next();
};

//Validating Reviews
const validateReview = (req, res, next) => {
	const { error } = reviewSchema.validate(req.body);
	if (error) {
		const msg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};

const middleware = {
	isLoggedIn,
	validateCampground,
	isAuthor,
	isReviewAuthor,
	isLoggedInForAJAX,
	validateReview,
};
module.exports = middleware;
