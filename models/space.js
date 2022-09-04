const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  spaceSchema  =  new Schema({
   name: String,
   image: String,
   posts:[String],
   content:String

},{timestamps:true});


let  Space =  mongoose.model("Space", spaceSchema);
module.exports  = Space;