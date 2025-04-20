
const {cloudinary} = require("../cloudinary");
const Campground = require("../models/campground");
const User = require("../models/user");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({accessToken: mapBoxToken});
module.exports.index = async (req, res) => {
	let campgrounds,
		length,
		next = 0,
		prev = 0,
		idx = 0,
		rem = 0;
	if (!res.locals.length) {
		campgrounds = await Campground.find({});
		res.locals.length = campgrounds.length;
	}
	length = res.locals.length;

	let page = 0;
	if (req.query) page = parseInt(req.query.page);
	if (page) {
		idx = parseInt(page / 10); // 35 / 10  3
		rem = page % 10; //
		campgrounds = await Campground.find({})
			.skip(10 * (page - 1))
			.limit(10);
	} else campgrounds = await Campground.find({}).limit(10);
	prev = page - 1 >= 0 ? page - 1 : 0;
	if (!page) next = 1;
	else next = page < length / 10 ? page + 1 : length / 10 + 1;
	//

	next = page + 1 <= length / 10 ? page + 1 : 2;
	let user = undefined;
	if (req.user) user = await User.findById(req.user._id);
	res.render("campgrounds/index", {
		campgrounds,
		campgroundsLength: length,
		prev,
		next,
		idx,
		rem,
		user: req.user,
	});
};
module.exports.renderNewForm = (req, res) => {
	res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res, next) => {
    let geoData;
	if (!req.body.campground)
		throw new ExpressError("Invalid Campground Date", 400); // for ajax request or any api
	try {
		geoData = await geocoder
			.forwardGeocode({
				//Geocoding Our Locations
				query: req.body.campground.location,
				limit: 1,
			})
			.send();
	} catch (e) {
		req.flash("error", "Error in creating the campground!");
		return res.redirect("/new");
	}
	const campground = new Campground(req.body.campground);
	// console.log(req.files)
	// console.log('Before',campground)
	campground.geometry = geoData.body.features[0].geometry;
	campground.images = req.files.map((f) => ({
		url: f.path,
		filename: f.filename,
	}));
	campground.author = req.user._id;
	const user = await User.findById(req.user._id);
	user.totalPosts++;
	user.totalPosts = Math.max(user.totalPosts, 0);
	await user.save();
	await campground.save();
	req.flash("success", "Successfully made a new campground");
	res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.campgroundLike = async (req, res, next) => {
	const campground = await Campground.findById(req.body.id);
	console.log(req.xhr, "fsfd", req.headers.accept.indexOf("json"));
	if (!campground) return res.json({error: false}).status(404);
	let liked = null;
	if (campground.author !== req.user.id) {
		liked = campground.likes.includes(req.user.id);
		const user = await User.findById(campground.author);
		if (!liked) {
			campground.likes.push(req.user.id);
			user.totalLikes++;
		} else {
			campground.likes.pull(req.user.id);
			user.totalLikes--;
		}
		await user.save();
	}

	await campground.save();

	return res.json({success: campground.likes.length, liked: liked}).status(200);
};

module.exports.campgroundSearch = async function (req, res) {
	const {query} = req.query;
	let output = [];
	if (query) {
		const queryRegx = new RegExp(query.trim(), "i");
		output = await Campground.find({
			$or: [{title: {$regex: queryRegx}}, {description: {$regex: queryRegx}}],
		})
			.populate("images")
			.populate("author");
	}
	return res.render(`campgrounds/search`, {campgrounds: query ? output : []});
};

module.exports.trendingCampground = async (req, res) => {
	const campgrouds = await Campground.find({})
		.sort({likes: -1, views: -1})
		.populate("author")
		.limit(10);
	console.log(campgrouds, "fsfdsfg");
	return res.render("campgrounds/trending", {campgrounds: campgrouds});
};

module.exports.showFavCampground = async (req, res) => {
	let campgrounds = await User.findById(req.user._id).populate("favourites");
	console.log(campgrounds);

	return res.render("users/favourites", {campgrounds: campgrounds.favourites});
};
module.exports.favouriteCampground = async (req, res) => {
	const user = await User.findById(req.user._id);
	const idx = user.favourites.indexOf(req.body.id);
	let isFav = false;
	if (idx === -1) {
		user.favourites.push(req.body.id);
		isFav = !isFav;
	} else {
		user.favourites.splice(idx, 1);
	}
	await user.save();

	return res.json({success: true, isFav}).status(200);
};

module.exports.showCampground = async (req, res) => {
	const campground = await Campground.findById(req.params.id)
		.populate({
			path: "reviews",
			populate: {
				path: "author",
			},
		})
		.populate("author"); //Displaying Reviews
	// console.log(campground)
	if (!campground) {
		req.flash("error", "Cannot find that campground!");
		return res.redirect("/campgrounds");
	}

	const editDate = req.params.editDate;
	if (req.user && campground.author.username !== req.user.username) {
		campground.views++;
		await campground.save();
	} else if (!req.user) {
		campground.views++;
		await campground.save();
	}
	res.render("campgrounds/show", {campground});
};

module.exports.renderEditForm = async (req, res) => {
	const {id} = req.params;
	const campground = await Campground.findById(id);
	console.log(campground);
	const editDate = req.params.editDate;
	if (!campground) {
		req.flash("error", "Cannot find that campground!");
		return res.redirect("/campgrounds");
	}
	res.render("campgrounds/edit", {campground, editDate: campground.editDate()});
};

module.exports.updateCampground = async (req, res) => {
	const {id} = req.params;
	const campground = await Campground.findByIdAndUpdate(id, {
		...req.body.campground,
	});
	const imgs = req.files.map((f) => ({url: f.path, filename: f.filename}));
	campground.images.push(...imgs);
	await campground.save();
	//Deleting Images Backend
	if (req.body.deletedImages) {
		for (let filename of req.body.deletedImages) {
			await cloudinary.uploader.destroy(filename);
		}
		await campground.updateOne({
			$pull: {images: {filename: {$in: req.body.deletedImages}}},
		});
		// console.log('DELETED IMAGES', campground);
	}
	req.flash("success", "Successfully updated campground!");
	res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
	const {id} = req.params;
	const campground = await Campground.findByIdAndDelete(id);
	const user = await User.findById(campground.author);
	user.totalPosts--;
	await user.save();
	req.flash("success", "Successfully deleted campground");
	res.redirect("/campgrounds");
};
