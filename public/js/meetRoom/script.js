
const userList = document.getElementById('users');
let peers={}
var w = window.innerWidth;
let myvideo;
var h = window.innerHeight;
const grid=document.getElementById('all-videos');
const viewVideo= document.createElement('video');
let myuserid;

let mypeer= new Peer(undefined,{
	path: '/peerjs',
	host:'/',
	port:location.port || (location.protocol === 'https:' ? 443 :80)
});


mypeer.on('open',id=>{
	socket.emit('join-room',room_id,id,username);
})
viewVideo.muted= true;
navigator.mediaDevices.getUserMedia({
	video: true,
	audio: true
  
})
.then(stream=>{
	myvideo= stream;
	addVideoStream(viewVideo,stream);
  mypeer.on('call', call => {
    call.answer(stream)

    const video = document.createElement('video');
   
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })
   socket.on('user-connected',(userid)=>{
    myuserid= userid;
    
    connectToNewUser(userid,stream);
  })


  const connectToNewUser=(userid,stream)=>{
    const call= mypeer.call(userid,stream);
    const video= document.createElement('video');
    call.on('stream',userVideo=>{
      addVideoStream(video,userVideo);
    })
    call.on("close", () => {
      video.remove();
    });
    
   peers[userid] = call

    
  }
});

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play();
    grid.appendChild(video)
  })
}


socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})


