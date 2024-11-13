var mongoose = require("mongoose");
var mensclothesSchema = new mongoose.Schema({
	head: String,
	name: String,
	disc: String,
   	url: String,
   	price: Number,
   	
});

// menclothesSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Mens", mensclothesSchema);