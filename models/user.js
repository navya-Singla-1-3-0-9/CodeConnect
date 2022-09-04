const mongoose = require('mongoose');
const passportLocalMongoose= require('passport-local-mongoose');
const Schema = mongoose.Schema;
const userschema= new Schema({
	email:{
		type:String,
		required: true,
		unique: true
	},
	registered_as:{
		type:String,
	}
});
userschema.plugin(passportLocalMongoose);
module.exports= mongoose.model('User',userschema);
