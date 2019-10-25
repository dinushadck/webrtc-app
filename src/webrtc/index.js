export function UILoaded() {
  const startButton = document.getElementById("startButton");
  const callButton = document.getElementById("callButton");
  const hangupButton = document.getElementById("hangupButton");
  const customVideoButton = document.getElementById("customVideoButton");
  const createSessionButton = document.getElementById("createSession");
  const callAudioButton = document.getElementById("callAudioButton");
  const upgradeButton = document.getElementById("upgradeButton");
  const startUpgradeButton = document.getElementById("startUpgradeButton");
  const caller = document.getElementById("caller");
  const callee = document.getElementById("callee");
  callButton.disabled = true;
  hangupButton.disabled = true;
  startButton.addEventListener("click", start);
  callButton.addEventListener("click", call);
  customVideoButton.addEventListener("click", addCustomVideo);
  hangupButton.addEventListener("click", hangup);
  createSessionButton.addEventListener("click", createSession);
  callAudioButton.addEventListener("click", callAudio);
  upgradeButton.addEventListener("click", upgradeToVideo);
  startUpgradeButton.addEventListener("click", startUpgrade);

  let callerSessionId = "";
  let callerHandleId = "";

  let localStream;
  let customStream;
  let pc = null;
  const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
    //iceRestart: true
  };

  //==================WEB SOCKET===================//

  let socket = new WebSocket("wss://192.168.1.5:4000", "echo-protocol");
  socket.onopen = function(e) {
    //alert("[open] Connection established");
  };

  socket.onmessage = async function(event) {
    let jsonMessage = JSON.parse(event.data);
    switch (jsonMessage.type) {
      case "init":
        callerSessionId = jsonMessage.caller_session_id;
        callerHandleId = jsonMessage.caller_handle_id;
        //can offer message method
        break;
      case "call_answered":
        let descAccepted = {
          type: "answer",
          sdp: jsonMessage.callee_sdp
        };
        acceptCall(descAccepted);
        break;
      case "incoming_call":
        let descIncoming = {
          type: "offer",
          sdp: jsonMessage.caller_sdp
        };
        answerCall(descIncoming);
        break;
      case "on_ice":
        await pc.addIceCandidate(jsonMessage.candidate);
        onAddIceCandidateSuccess(pc);
        break;
    }
    alert(`[message] Data received from server: ${event.data}`);
  };

  async function addCustomVideo() {
    let customStream = customVideo.captureStream();
    customStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    //const offer = await pc.createOffer(offerOptions);
    //await pc.setLocalDescription(offer);
    //sendOfferViaSocket(offer.sdp);
  }

  async function upgradeToVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });
    console.log("Received local stream");
    localVideo.srcObject = null;
    localVideo.srcObject = stream;
    console.log("Starting call");
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      console.log(`Using video device: ${videoTracks[0].label}`);
    }
    videoTracks.getTracks().forEach(track => pc.addTrack(track, localStream));

    const offer = await pc.createOffer(offerOptions);
    await pc.setLocalDescription(offer);
    sendOfferViaSocket(offer.sdp);
  }

  async function startUpgrade() {
    console.log("Requesting local stream");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      console.log("Received local stream");
      localStream = stream;
    } catch (e) {
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

  async function callAudio() {
    const audioTracks = localStream.getAudioTracks();

    if (audioTracks.length > 0) {
      console.log(`Using audio device: ${audioTracks[0].label}`);
    }
    const configuration = getSelectedSdpSemantics();
    console.log("RTCPeerConnection configuration:", configuration);
    pc = new RTCPeerConnection(configuration);
    console.log("Created local peer connection object pc");
    pc.addEventListener("icecandidate", e => onIceCandidate(pc, e));
    console.log("Created remote peer connection object pc");
    pc.addEventListener("iceconnectionstatechange", e =>
      onIceStateChange(pc, e)
    );

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    console.log("Added local stream to pc");

    pc.addEventListener("track", gotRemoteStream);

    try {
      console.log("pc createOffer start");
      const offer = await pc.createOffer(offerOptions);
      await onCreateOfferSuccess(offer);
    } catch (e) {
      onCreateSessionDescriptionError(e);
    }
  }

  let answerCall = async function(desc) {
    if (pc === null) {
      const videoTracks = localStream.getVideoTracks();
      const audioTracks = localStream.getAudioTracks();
      if (videoTracks.length > 0) {
        console.log(`Using video device: ${videoTracks[0].label}`);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        console.log("Received local stream");
        localVideo.srcObject = null;
        localVideo.srcObject = stream;
      }
      if (audioTracks.length > 0) {
        console.log(`Using audio device: ${audioTracks[0].label}`);
      }
      const configuration = getSelectedSdpSemantics();
      console.log("RTCPeerConnection configuration:", configuration);
      pc = new RTCPeerConnection(configuration);
      console.log("Created remote peer connection object pc");
      pc.addEventListener("icecandidate", e => onIceCandidate(pc, e));

      pc.addEventListener("iceconnectionstatechange", e =>
        onIceStateChange(pc, e)
      );
      pc.addEventListener("track", gotRemoteStream);

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      console.log("Added local stream to pc");
      console.log("pc createAnswer start");
      // Since the 'remote' side has no media stream we need
      // to pass in the right constraints in order for it to
      // accept the incoming offer of audio and video.
      console.log("pc setRemoteDescription start");
    }

    try {
      await pc.setRemoteDescription(desc);
      onSetRemoteSuccess(pc);
    } catch (e) {
      onSetSessionDescriptionError(e);
    }
    try {
      const answer = await pc.createAnswer();
      await onCreateAnswerSuccess(answer);
    } catch (e) {
      onCreateSessionDescriptionError(e);
    }
  };

  let acceptCall = async function(desc) {
    console.log("pc createAnswer start");
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    console.log("pc setRemoteDescription start");
    try {
      await pc.setRemoteDescription(desc);
      onSetRemoteSuccess(pc);
    } catch (e) {
      onSetSessionDescriptionError();
    }
  };

  socket.onclose = function(event) {
    if (event.wasClean) {
      alert(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      alert("[close] Connection died");
    }
  };

  socket.onerror = function(error) {
    alert(`[error] ${error.message}`);
  };

  //===========================================//

  async function createSession() {
    let message = {
      type: "init",
      caller_username: caller.value
    };

    socket.send(JSON.stringify(message));
  }

  let startTime;
  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo");
  const customVideo = document.getElementById("customVideo");
  const receiveVideo = document.getElementById("receiveVideo");

  localVideo.addEventListener("loadedmetadata", function() {
    console.log(
      `Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`
    );
  });

  remoteVideo.addEventListener("loadedmetadata", function() {
    console.log(
      `Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`
    );
  });

  remoteVideo.addEventListener("resize", () => {
    console.log(
      `Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`
    );
    // We'll use the first onsize callback as an indication that video has started
    // playing out.
    if (startTime) {
      const elapsedTime = window.performance.now() - startTime;
      console.log("Setup time: " + elapsedTime.toFixed(3) + "ms");
      startTime = null;
    }
  });

  function getName(pc) {
    return pc === pc ? "pc" : "pc";
  }

  function getOtherPc(pc) {
    return pc === pc ? pc : pc;
  }

  async function start() {
    console.log("Requesting local stream");
    startButton.disabled = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      console.log("Received local stream");
      localVideo.srcObject = stream;
      localStream = stream;
      callButton.disabled = false;
    } catch (e) {
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

  function getSelectedSdpSemantics() {
    return {
      SdpSemantics: "unified-plan",
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302"
        }
      ]
    };
  }

  async function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;
    console.log("Starting call");
    startTime = window.performance.now();
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
      console.log(`Using video device: ${videoTracks[0].label}`);
    }
    if (audioTracks.length > 0) {
      console.log(`Using audio device: ${audioTracks[0].label}`);
    }
    const configuration = getSelectedSdpSemantics();
    console.log("RTCPeerConnection configuration:", configuration);
    pc = new RTCPeerConnection(configuration);
    console.log("Created local peer connection object pc");
    pc.addEventListener("icecandidate", e => onIceCandidate(pc, e));
    console.log("Created remote peer connection object pc");
    pc.addEventListener("iceconnectionstatechange", e =>
      onIceStateChange(pc, e)
    );

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    console.log("Added local stream to pc");

    pc.addEventListener("track", gotRemoteStream);

    pc.addEventListener("negotiationneeded", onNegotiationNeeded, false);

    try {
      console.log("pc createOffer start");
      const offer = await pc.createOffer(offerOptions);
      await onCreateOfferSuccess(offer);
    } catch (e) {
      onCreateSessionDescriptionError(e);
    }
  }

  function onNegotiationNeeded() {
    pc.createOffer()
      .then(offer => {
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        let obj = {
          type: "offer_update",
          sdp: pc.localDescription
        };
        socket.send(JSON.stringify(obj));
      });
  }

  function onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }

  function sendOfferViaSocket(sdp) {
    let message = {
      type: "offer",
      sdp: sdp,
      callee_username: callee.value,
      caller_session_id: callerSessionId,
      caller_handle_id: callerHandleId
    };

    socket.send(JSON.stringify(message));
  }

  async function onCreateOfferSuccess(desc) {
    console.log(`Offer from pc\n${desc.sdp}`);
    console.log("pc setLocalDescription start");
    try {
      //Send Message
      await pc.setLocalDescription(desc);
      sendOfferViaSocket(desc.sdp);
      onSetLocalSuccess(pc);
    } catch (e) {
      onSetSessionDescriptionError();
    }
  }

  function onSetLocalSuccess(pc) {
    console.log(`${getName(pc)} setLocalDescription complete`);
  }

  function onSetRemoteSuccess(pc) {
    console.log(`${getName(pc)} setRemoteDescription complete`);
  }

  function onSetSessionDescriptionError(error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }

  function gotRemoteStream(e) {
    if (remoteVideo.srcObject !== e.streams[0]) {
      remoteVideo.srcObject = e.streams[0];
      console.log("pc received remote stream");
    }
    if (e.streams.length > 1) {
      if (receiveVideo.srcObject !== e.streams[1]) {
        receiveVideo.srcObject = e.streams[1];
        console.log("pc received remote stream");
      }
    }
  }

  async function onCreateAnswerSuccess(desc) {
    console.log(`Answer from pc:\n${desc.sdp}`);
    console.log("pc setLocalDescription start");
    try {
      await pc.setLocalDescription(desc);
      let message = {
        type: "accept",
        sdp: desc.sdp,
        caller_session_id: callerSessionId,
        caller_handle_id: callerHandleId
      };

      socket.send(JSON.stringify(message));
      onSetLocalSuccess(pc);
    } catch (e) {
      onSetSessionDescriptionError(e);
    }
  }

  async function onIceCandidate(pc, event) {
    try {
      if (event.candidate) {
        let iceCand = {
          type: "trickle",
          caller_session_id: callerSessionId,
          caller_handle_id: callerHandleId,
          candidate: event.candidate
        };

        socket.send(JSON.stringify(iceCand));
      } else {
        let iceCandEnd = {
          type: "trickle_end",
          caller_session_id: callerSessionId,
          caller_handle_id: callerHandleId
        };

        socket.send(JSON.stringify(iceCandEnd));
      }
    } catch (e) {}
    console.log(
      `${getName(pc)} ICE candidate:\n${
        event.candidate ? event.candidate.candidate : "(null)"
      }`
    );
  }

  function onAddIceCandidateSuccess(pc) {
    console.log(`${getName(pc)} addIceCandidate success`);
  }

  function onAddIceCandidateError(pc, error) {
    console.log(
      `${getName(pc)} failed to add ICE Candidate: ${error.toString()}`
    );
  }

  function onIceStateChange(pc, event) {
    if (pc) {
      console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
      console.log("ICE state change event: ", event);
    }
  }

  function hangup() {
    console.log("Ending call");
    pc.close();
    pc.close();
    pc = null;
    pc = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
  }
}
