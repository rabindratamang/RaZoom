const username = prompt("Please enter your name");

if (username) {
  const socket = io("/");
  const videoGrid = document.querySelector("#video-grid");

  const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "443",
    config: {
      iceServers: [
        {
          urls: "turn:13.234.239.38?transport=tcp",
          username: "user",
          credential: "root",
        },
        { urls: "stun:stun.l.google.com:19302" },
      ],
    },
  });

  let myVideoStream;
  const myVideo = document.createElement("video");
  myVideo.muted = true;
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then(
      (stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
          call.answer(stream);
          const video = document.createElement("video");
          call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
          });
        });

        socket.on("user-connected", (userId, userName) => {
          socket.emit("message", {type: "USER", user: userName });
          connectToNewUser(userId, stream);
        });
      },
      (err) => console.log(err)
    );

  const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });

    call.on("close", () => {
      video.remove();
    });
  };

  peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id, username);
  });

  function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
    videoGrid.append(video);
  }

  let text = document.querySelector("input");

  document.addEventListener("keydown", (e) => {
    if (e.which == 13 && text.value.length !== 0) {
      socket.emit("message", {type: "MESSAGE", user: username, text: text.value});
      text.value = "";
    }
  });

  socket.on("createMessage", (message) => {
    if(message.type === "MESSAGE"){
      $("ul").append(`<li class="message"><b>${message.user}</b><br/>${message.text}</li>`);
    } else {
      $("ul").append(`<li class="message"><b>${message.user} joined the room.</b>`);
    }
    scrollToBottom();
  });

  const scrollToBottom = () => {
    let chatWindow = $(".main__chat_window");
    chatWindow.scrollTop(chatWindow.prop("scrollHeight"));
  };

  const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
  };

  const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      setPlayVideo();
    } else {
      setStopVideo();
      myVideoStream.getVideoTracks()[0].enabled = true;
    }
  };

  const setMuteButton = () => {
    const html = `
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
    `;
    document.querySelector(".main__mute_button").innerHTML = html;
  };

  const setUnmuteButton = () => {
    const html = `
      <i class="unmute fas fa-microphone-slash"></i>
      <span>Unmute</span>
    `;
    document.querySelector(".main__mute_button").innerHTML = html;
  };

  const setStopVideo = () => {
    const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `;
    document.querySelector(".main__video_button").innerHTML = html;
  };

  const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `;
    document.querySelector(".main__video_button").innerHTML = html;
  };

  const leaveMeeting = () => {};
}
