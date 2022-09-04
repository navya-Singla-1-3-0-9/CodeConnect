if(process.env.NODE_ENV!=="production"){
	require('dotenv').config();
}

const express= require('express');
let app= express();
app.set("view engine","ejs");

const { v4: uuidv4}= require('uuid');
const server= require('http').Server(app);
const io= require('socket.io')(server);
const { ExpressPeerServer }= require('peer');
const port= process.env.PORT||5000;
const peerServer= ExpressPeerServer(server,{
	debug:true
})


const session = require('express-session')
const flash = require('connect-flash');
const passport= require('passport');
const localStrategy= require('passport-local'); 
app.use('/peerjs',peerServer);
const path = require('path')
app.use(express.static("public"));



 const sessionConfig={
	secret: 'Thisisasecret',
	resave: false,
	saveUninitialized: true,
	cookie:{
		httpOnly: true,
		expires: Date.now()+1000*60*60*24*7,
		maxAge: 1000*60*60*24*7
	}
}


const  User = require("./models/user");
const  Space = require("./models/space");
const  Post = require("./models/post");
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
//handling login
passport.serializeUser(User.serializeUser());
//handling logout
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{
	//console.log(req.session);
	res.locals.currUser= req.user;
	res.locals.success=  req.flash('success');
	res.locals.error= req.flash('error');
	next();
})
const  mongoose  = require("mongoose");
//const  url  = process.env.DB_URL;
const url = "mongodb+srv://navya1309:D5X723rdXGhsGNcd@cluster0.r4yme.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const  connect  =  mongoose.connect(url, { useNewUrlParser: true  });


app.use(express.urlencoded({extended:true}));
app.set('views',path.join(__dirname,'views'));

io.on("connection", (socket) => {
  	socket.on("join-room", (roomId, userId, userName) => {
	    socket.join(roomId);
		const user = { userId, userName, roomId };
		console.log("new Joinee")
		console.log(userName)
	   
	    

	   socket.on("disconnect", () => {
	      socket.to(roomId).emit("user-disconnected", userId);
	      
    });
	socket.to(roomId).emit("user-connected", userId);
	    socket.on("drawing", data => socket.to(roomId).emit("drawing", data));

	    
  });





});




let name="";

const isLoggedIn= async (req,res,next)=>{
	if(!req.isAuthenticated()){
		
		req.flash('error','You must be logged in');
		return res.redirect('/login');

	}
	
	next();
}

let landing= async (req,res)=>{
	//await User.deleteMany({})
	res.render('index.ejs',{user:(req.user?req.user.username:undefined)});
};

let loginPg=(req,res)=>{
 	res.render('login.ejs');
}
let registerPg=(req,res)=>{
 	res.render('register.ejs');
}
let handleLogin=(req,res)=>{
	if(req.session.returnTo){
		res.redirect(req.session.returnTo);
		delete req.session.returnTo;
	}else{
		req.flash('success', 'Successfully logged in');
		res.redirect('/spaces');
		
		//res.redirect('/room')
	}
}


app.get('/room',isLoggedIn,(req,res)=>{
	const room_id = uuidv4();
	res.redirect(`/${room_id}`);
	
});

app.post('/addspace',isLoggedIn,async (req,res)=>{
	//await Space.deleteMany({});
	let space = new Space({name:req.body.name, image: req.body.image, content: req.body.content});
	await space.save();
	res.redirect('/spaces')
  })
  app.get("/spaces",isLoggedIn, async (req, res) => {
	let spaces= await Space.find({});
	console.log(spaces);
	res.render('spaces.ejs',{spaces: spaces});

  });
  app.get('/newSpace',isLoggedIn,async (req,res)=>{
//	  await Space.findByIdAndDelete("6208a0b97ffb352751040af5");
	
	  res.render('newSpace');
  })

  app.post('/addpost/:id',isLoggedIn,async (req,res)=>{
	  //console.log(req.params.id);
	//let space= await Space.findByIdAndUpdate(req.params.id,{$push:{posts:[req.body.question]}});
	let post = new Post({question:req.body.question,creator: "Navya Singla",linkedspace:req.params.id});
	await post.save();
	res.redirect(`/space/${req.params.id}`)
  })
  app.get('/createPost/:id', isLoggedIn,async (req,res)=>{
	//let p = await Post.deleteMany({});
  
	  res.render('newPost',{id: req.params.id});
  })
  app.get("/space/:id", isLoggedIn,async (req, res) => {
   let space= await Space.findOne({_id:req.params.id});
   let posts= await Post.find({linkedspace: space.id});
   console.log(posts)
	res.render('space-pg.ejs',{ space: space, posts: posts});
  });
  
  app.get("/post/:id",isLoggedIn,async (req,res)=>{
	let post = await Post.findOne({_id:req.params.id});
	//console.log(post)
	res.render('post.ejs',{post:post, user: req.user});
	
  })
  app.post('/send-email', (req,res)=>{
	const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  const msg = {
    to: 'fun.crazy.joker@gmail.com', // Change to your recipient
    from: 'navyasingla1309git@gmail.com', 
	subject: 'Sending with SendGrid is Fun',
	text: 'and easy to do anywhere, even with Node.js',
	html: '<strong>and easy to do anywhere, even with Node.js</strong>',
	template_id: 'd-a92705d7ff424927b7fedd9aa6ce726b' 
  }
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
	  res.redirect('/mentors');
    })
    .catch((error) => {
      console.error(error)
    })
	
  })
  app.post('/add-comment/:postid/:username',isLoggedIn,async (req,res)=>{
	let comment= {commentor: req.params.username, content: req.body.comment}
	//await Post.findOneAndUpdate({id:req.params.postid},{$push:{comments: [comment]}});
	let post = await Post.findById(req.params.postid);
	post.comments.push(comment);
	await post.save();
	console.log(post);
	res.redirect(`/post/${req.params.postid}`);
  });


let handleRegister=async (req,res)=>{
 	const {email, username, password}= req.body;
	const nu = new User({email, username});
	const regdUser= await User.register(nu, password);
	req.flash('success','Successfully registered')
	res.redirect('/login')
}


let logout = (req,res)=>{
	req.logout();
	req.flash('success', 'logged out')
	res.redirect('/login');
}
app.get('/',landing);
app.get('/techBlogs', async (req,res)=>{
	let blogs=[];
	search.json({
		q: "Technology, computer science Blogs", 
	   }, (result) => {
		// console.log(result.jobs_results);
		//console.log(result);
		for(let r of result.organic_results){
			blogs.push({link:r.link, title:r.title});
		}
		res.render('blogs',{results: blogs});
	   })
	   //res.render('blogs')
});
const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch("ce7c80a7c8504548a69c61139e38d2655655220df68e551cd49228178bdfda51")
app.get('/mentors', (req,res)=>{
	res.render('mentor')
});
app.get('/resources', (req,res)=>{
	res.render('resources')
});
app.get('/resources/:title', (req,res)=>{
	res.render('resource')
});
app.get('/login',loginPg)
app.get('/register',registerPg)
app.post('/login',passport.authenticate('local',{failureFlash:'Invalid username or password', failureRedirect:'/login'}),handleLogin);
app.post('/register',handleRegister);
app.get('/logout',logout);
app.get('/visualize',async(req,res)=>{
	res.render('visualize');
})

app.get('/:id',isLoggedIn,(req,res)=>{
	res.render('room.ejs',{roomid:req.params.id,username:req.user.username});
});


server.listen(port,(req,res)=>{
	console.log('HELLOOO!');
});