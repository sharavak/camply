const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");
//Cross Site Scripting (XSS)
//Cross Site Scripting (XSS)
const extension = (joi) => ({
	type: "string",
	base: joi.string(),
	messages: {
		"string.escapeHTML": "{{#label}} must not include HTML!",
	},
	rules: {
		escapeHTML: {
			validate(value, helpers) {
				const clean = sanitizeHtml(value, {
					allowedTags: [],
					allowedAttributes: {},
				});
				if (clean !== value)
					return helpers.error("string.escapeHTML", { value });
				return clean;
			},
		},
	},
});

const Joi = BaseJoi.extend(extension);
module.exports.campgroundSchema = Joi.object({
	// for ajax request or any api
	//JOI Schema Validations
	campground: Joi.object({
		title: Joi.string().required().escapeHTML(),
		price: Joi.number().required().min(0),
		location: Joi.string().required().escapeHTML(),
		description: Joi.string().required().escapeHTML(),
		date: Joi.string().escapeHTML(),
	}).required(),
	deletedImages: Joi.array(),
	editDate: Joi.string().escapeHTML(),
});

//Validating Reviews
module.exports.reviewSchema = Joi.object({
	review: Joi.object({
		rating: Joi.number().required().min(1).max(5),
		body: Joi.string().required().escapeHTML(),
	}).required(),
});
