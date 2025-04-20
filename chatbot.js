const GROQ = require("groq-sdk");
const groq = new GROQ({apiKey: process.env.CHATBOT_SECRET});
module.exports.groq = groq;
