var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var receiptSchema = new mongoose.Schema({
	
	quantity: Number,
	size: String,
	address: String,
});

module.exports = mongoose.model("Receipt", receiptSchema);