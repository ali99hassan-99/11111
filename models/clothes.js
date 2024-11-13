var mongoose = require("mongoose");

var clothesSchema = new mongoose.Schema({

	garment: String,
	size: String,
	clothe: String,
   	addinfo: String,
	address: String,
	user: String
	   
});

module.exports = mongoose.model("Customizedclothing", clothesSchema);