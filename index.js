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

//Create Session
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

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
//handling login
passport.serializeUser(User.serializeUser());
//handling logout
passport.deserializeUser(User.deserializeUser());
// Set locals
app.use((req,res,next)=>{
	res.locals.currUser= req.user;
	res.locals.success=  req.flash('success');
	res.locals.error= req.flash('error');
	next();
})

//Connect with MongoDB
const  mongoose  = require("mongoose");
const  url  = process.env.DB_URL;
const  connect  =  mongoose.connect(url, { useNewUrlParser: true  });

app.use(express.urlencoded({extended:true}));
app.set('views',path.join(__dirname,'views'));

// Import models
const  User = require("./models/user");
const  Space = require("./models/space");
const  Post = require("./models/post");
/*
###################  SOCKET EVENTS  #################################################
*/

io.on("connection", (socket) => {
	//check for join room event.
  	socket.on("join-room", (roomId, userId, userName) => {
	    socket.join(roomId);
		//initialize user
		const user = { userId, userName, roomId};
		//Successful connection to socket has been established
		socket.to(roomId).emit("user-connected", userId);
		// While connection is still up, check for drawing event creation by user.
		socket.on("drawing", data => socket.to(roomId).emit("drawing", data));
		// check for disconnect event from client.
	   	socket.on("disconnect", () => {
			//broadcast to room if the user is disconnected.
	      	socket.to(roomId).emit("user-disconnected", userId)    
    	});
  	});
});


// Middleware to check if a user is logged in.
const isLoggedIn= async (req,res,next)=>{
	if(!req.isAuthenticated()){
		req.flash('error','You must be logged in');
		return res.redirect('/login');
	}
	next();
}

/*
###################  GET ROUTES  #################################################
*/

//Home page
app.get('/',(req,res)=>{
	res.render('index.ejs',{user:(req.user?req.user.username:undefined)});
});

// User creates new coding session.
app.get('/room',isLoggedIn,(req,res)=>{
	const room_id = uuidv4();
	// redirect to newly created room id
	res.redirect(`/${room_id}`);
});

// Login and Register pages.
app.get('/login',(req,res)=>{
	res.render('login.ejs');
})
app.get('/register',(req,res)=>{
	res.render('register.ejs');
})

//List of mentors.
app.get('/mentors', (req,res)=>{
	res.render('mentor')
});

//Learning resources
app.get('/resources', (req,res)=>{
	res.render('resources')
});
app.get('/resources/:title', (req,res)=>{
	res.render('resource')
});

// All Spaces 
app.get("/spaces",isLoggedIn, async (req, res) => {
	let spaces= await Space.find({});
	console.log(spaces);
	res.render('spaces.ejs',{spaces: spaces});

});

// Page to create a new Space
app.get('/newSpace',isLoggedIn,async (req,res)=>{	
	res.render('newSpace');
})

// Page to create a new Post in Space-id "id". 
app.get('/createPost/:id', isLoggedIn,async (req,res)=>{
	res.render('newPost',{id: req.params.id});
})

// Fetch all posts in Space-id "id".
app.get("/space/:id", isLoggedIn,async (req, res) => {
   	let space= await Space.findOne({_id:req.params.id});
   	let posts= await Post.find({linkedspace: space.id});
	res.render('space-pg.ejs',{ space: space, posts: posts});
});

// Open a post with post-id "id".
app.get("/post/:id",isLoggedIn,async (req,res)=>{
	let post = await Post.findOne({_id:req.params.id});
	res.render('post.ejs',{post:post, user: req.user});
})

//Access tech blogs
const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch("ce7c80a7c8504548a69c61139e38d2655655220df68e551cd49228178bdfda51")
app.get('/techBlogs', async (req,res)=>{
	let blogs=[];
	search.json({
		q: "Technology, computer science Blogs", 
	   }, (result) => {
		for(let r of result.organic_results){
			blogs.push({link:r.link, title:r.title});
		}
		res.render('blogs',{results: blogs});
	   })
});

// Algorithm Visualizer
app.get('/visualize',async(req,res)=>{
	res.render('visualize');
})

// Handle Logout
app.get('/logout',(req,res)=>{
	req.logout();
	req.flash('success', 'logged out')
	res.redirect('/login');
});

// Coding Session
app.get('/:id',isLoggedIn,(req,res)=>{
	res.render('room.ejs',{roomid:req.params.id,username:req.user.username});
});

/*
###################  POST ROUTES  #################################################
*/

//Post route - adding new Space
app.post('/addspace',isLoggedIn,async (req,res)=>{
	let space = new Space({name:req.body.name, image: req.body.image, content: req.body.content});
	await space.save();
	res.redirect('/spaces')
})

// Add a new Post
app.post('/addpost/:id',isLoggedIn,async (req,res)=>{
	let post = new Post({question:req.body.question,creator: "Navya Singla",linkedspace:req.params.id});
	await post.save();
	res.redirect(`/space/${req.params.id}`)
})

// Add comment to a post.
app.post('/add-comment/:postid/:username',isLoggedIn,async (req,res)=>{
	let comment= {commentor: req.params.username, content: req.body.comment}
	//await Post.findOneAndUpdate({id:req.params.postid},{$push:{comments: [comment]}});
	let post = await Post.findById(req.params.postid);
	post.comments.push(comment);
	await post.save();
	console.log(post);
	res.redirect(`/post/${req.params.postid}`);
});

// Login post route
app.post('/login',passport.authenticate('local',{failureFlash:'Invalid username or password', failureRedirect:'/login'}),(req,res)=>{
	if(req.session.returnTo){
		res.redirect(req.session.returnTo);
		delete req.session.returnTo;
	}else{
		req.flash('success', 'Successfully logged in');
		res.redirect('/spaces');
	}
});

//Register post route
app.post('/register',async (req,res)=>{
	const {email, username, password}= req.body;
	const nu = new User({email, username});
	const regdUser= await User.register(nu, password);
	req.flash('success','Successfully registered')
	res.redirect('/login')
});

server.listen(port,(req,res)=>{
	console.log('HELLOOO!');
});