//Breaking Out Campground Routes
const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const campgrounds = require("../controllers/campgrounds");
// const isLoggedIn = require('../middleware');
// const validateCampground   = require('../middleware');
// const isAuthor  = require('../middleware');
const middleware = require("../middleware");
console.log(middleware);

const {storage} = require("../cloudinary"); // requiring a folder because we are using index.js

//The Multer Middleware
const multer = require("multer");
const upload = multer({storage}); // destination path for saving files locally whice we will do not
// dest: 'uploads/'

//A Fancy Way To Restructure Routes
//router.route(path)
// Returns an instance of a single route which you can then use to handle HTTP verbs with optional middleware. Use router.route() to avoid duplicate route naming and thus typing errors.

router
	.route("/likes")
	.post(middleware.isLoggedInForAJAX, campgrounds.campgroundLike);
router.route("/search").get(campgrounds.campgroundSearch);
router.route("/trending").get(campgrounds.trendingCampground);
router
	.route("/fav")
	.get(middleware.isLoggedIn, campgrounds.showFavCampground)
	.post(middleware.isLoggedInForAJAX, campgrounds.favouriteCampground);

router
	.route("/")
	.get(catchAsync(campgrounds.index))
	// first multer parses the image while uploading then ir sens is req.body and the files
	.post(
		middleware.isLoggedIn,
		upload.array("image"),
		middleware.validateCampground,
		catchAsync(campgrounds.createCampground)
	);
// image is the field name that it is we given in the name attribute
// for single image upload.single('image') for multiple images uploading
// .post(upload.array('image'), (req, res) => {
//     console.log(req.body,req.files)// coming form multer
//     // for single req.file
//     res.send(req.file);
// })

// router.get('/', catchAsync(campgrounds.index));

router.get("/new", middleware.isLoggedIn, campgrounds.renderNewForm); // order matters

router
	.route("/:id")
	.get(catchAsync(campgrounds.showCampground))
	.put(
		middleware.isLoggedIn,
		middleware.isAuthor,
		upload.array("image"),
		middleware.validateCampground,
		catchAsync(campgrounds.updateCampground)
	)
	.delete(
		middleware.isLoggedIn,
		middleware.isAuthor,
		catchAsync(campgrounds.deleteCampground)
	);
//Campground New & Create

// for ajax
// router.post('/',isLoggedIn,validateCampground, catchAsync(campgrounds.createCampground))

// Campground Show
// router.get('/:id', catchAsync(campgrounds.showCampground))

//Campground Edit & Update
router.get(
	"/:id/edit",
	middleware.isLoggedIn,
	middleware.isAuthor,
	catchAsync(campgrounds.renderEditForm)
);

// router.put('/:id',isLoggedIn,isAuthor,validateCampground, catchAsync(campgrounds.updateCampground))

//Campground Delete
// router.delete('/:id', isLoggedIn, catchAsync(campgrounds.deleteCampground));

module.exports = router;
