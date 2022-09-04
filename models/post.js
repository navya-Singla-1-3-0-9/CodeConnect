const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  postSchema  =  new Schema({
   question:String,
   creator: String,
   linkedspace:String,
   comments:[{
       commentor: String,
       content: String
   }]

},{timestamps:true});


let  Post=  mongoose.model("Post", postSchema);
module.exports  = Post;