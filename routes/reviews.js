const validateReview = require("../middleware");
const isLoggedIn = require("../middleware");
//Breaking Out Review Routes
const express = require("express");
const router = express.Router({mergeParams: true}); // when we creating a router it separates params from it so we cannot access it through our predefined routes we will reviews of null for that we can use mergeParams:true
// for campground routes it we can access our params because we are prefixing it
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const Campground = require("../models/campground");
const Review = require("../models/review");

const reviews = require("../controllers/reviews");
const middleware = require("../middleware");
// const isReviewAuthor = require('../middleware');

//Creating Reviews //Reviews Permissions
router.post(
	"/",
	middleware.isLoggedIn,
	middleware.validateReview,
	catchAsync(reviews.createReview)
);

//Deleting Reviews
router.delete(
	"/:reviewId",
	middleware.isLoggedIn,
	middleware.isReviewAuthor,
	catchAsync(reviews.deleleReview)
);

module.exports = router;
