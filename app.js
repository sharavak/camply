if (process.env.Node_ENV !== "production") {
	require("dotenv").config();
}

console.log();
const express = require("express"); //Creating the Basic Express App
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); //A New EJS Tool For Layouts
const ExpressError = require("./utils/ExpressError");
const session = require("express-session");
const flash = require("connect-flash");
const {groq} = require("./chatbot");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
//Configuring Passport
const passport = require("passport");
const LocalStrategy = require("passport-local");
const middleware = require("./middleware");

const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize");

const helmet = require("helmet");

const MongoDBStore = require("connect-mongo");

let dbUrl = process.env.DB_URL || "mongodb://localhost:27017/camply";
mongoose.connect(dbUrl, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
	console.log("Database Connected");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());

app.use(express.urlencoded({extended: true})); // for parsing the body because default it is body
app.use(methodOverride("_method"));

//Serving Static Assets
app.use(express.static(path.join(__dirname, "public")));
app.use(
	mongoSanitize({
		replaceWith: "_",
	})
);

const store = new MongoDBStore({
	mongoUrl: dbUrl,
	secret: "thishouuldbebettersecret!",
	touchAfter: 24 * 60 * 60,
});

store.on("error", function (e) {
	console.log("Session Store Error", e);
});
//Configuring Session
const sessionConfig = {
	store,
	name: "session", // for security reasons
	secret: process.env.SECRET,
	// secure:true,// when we are doing this it breaks it tells that it should only work on https
	resave: false,
	saveUninitialized: true,
	cookie: {
		// it is in milliseconds
		httpOnly: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
};
app.use(session(sessionConfig));
app.use(flash());

const scriptSrcUrls = [
	"https://stackpath.bootstrapcdn.com/",
	"https://api.tiles.mapbox.com/",
	"https://api.mapbox.com/",
	"https://kit.fontawesome.com/",
	"https://cdnjs.cloudflare.com/",
	"https://cdn.jsdelivr.net",
];
//This is the array that needs added to
const styleSrcUrls = [
	"https://kit-free.fontawesome.com/",
	"https://api.mapbox.com/",
	"https://api.tiles.mapbox.com/",
	"https://fonts.googleapis.com/",
	"https://use.fontawesome.com/",
	"https://cdn.jsdelivr.net",
	"https://cdnjs.cloudflare.com/",
];
const connectSrcUrls = [
	"https://api.mapbox.com/",
	"https://a.tiles.mapbox.com/",
	"https://b.tiles.mapbox.com/",
	"https://events.mapbox.com/",
];
const fontSrcUrls = ["https://cdnjs.cloudflare.com/"];
const mediaSrcUrls = ["https://res.cloudinary.com/dvc8kivbh/"];
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: [],
			connectSrc: ["'self'", ...connectSrcUrls],
			scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
			styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
			workerSrc: ["'self'", "blob:"],
			objectSrc: [],
			imgSrc: [
				"'self'",
				"blob:",
				"data:",
				"https://res.cloudinary.com/dvc8kivbh/",
				"https://images.unsplash.com/",
				"https://cdn-icons-png.flaticon.com/",
				"https://img.freepik.com/",
			],
			fontSrc: ["'self'", ...fontSrcUrls],
			mediaSrc: ["'self'", ...mediaSrcUrls],
		},
	})
);

// use after the session
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

//storing and unstoring in the session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	res.locals.currentUser = req.user;
	res.locals.length = 0;
	const protocol = req.protocol;
	const host = req.get("host");
	res.locals.baseUrl = `${protocol}://${host}`;
	next();
});

app.post("/chat", async (req, res) => {
	let out = await groq.chat.completions.create({
		messages: [
			{
				role: "system",
				content: process.env.SYSTEM,
			},
			{
				role: "user",
				content: req.body.input,
			},
		],
		model: "llama3-8b-8192",
	});
	out = out.choices[0]?.message?.content || "";
	return res.json({output: out});
});

app.get("/", (req, res) => {
	res.render("home");
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.all("*", (req, res, next) => {
	next(new ExpressError("Page Not Found", 404));
});

//Basic Error Handler
app.use((err, req, res, next) => {
	const {statusCode = 500} = err;
	if (!err.message) err.message = "Oh No! Something went wrong";
	res.status(statusCode).render("error", {err});
});
app.listen(3000, () => {
	console.log("Serving on port 3000");
});
