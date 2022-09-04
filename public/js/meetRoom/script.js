
const userList = document.getElementById('users');
let peers={}
var w = window.innerWidth;
let myvideo;
var h = window.innerHeight;
const grid=document.getElementById('all-videos');
const viewVideo= document.createElement('video');
let myuserid;


/*document.querySelector('.end-call').addEventListener('click',()=>{
  window.location.href ='/';
});
*/



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





/*let messages = document.querySelector(".messages");
let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('')
    }
  });
  socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<li class="message ${
          userName == username ? 'me' : 'other'
        }">
       <div><b> ${
          userName == username ? "me" : userName
        } </b></div>
        <span>${message}</span>
    </li>`;
});
*/
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})


