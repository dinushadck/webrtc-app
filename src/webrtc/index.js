import { ChannelFactory, Initialize } from "../socket_io";
export function UILoaded() {
  const startButton = document.getElementById("startButton");
  const callButton = document.getElementById("callButton");
  const hangupButton = document.getElementById("hangupButton");
  const customVideoButton = document.getElementById("customVideoButton");
  const createSessionButton = document.getElementById("createSession");
  const createSocketButton = document.getElementById("createSocket");
  const createSessionSIPButton = document.getElementById("createSessionSIP");
  const callAudioButton = document.getElementById("callAudioButton");
  const upgradeButton = document.getElementById("upgradeButton");
  const startUpgradeButton = document.getElementById("startUpgradeButton");


  let startTime;
  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo");

  localVideo.addEventListener("loadedmetadata", function () {
    console.log(
      `Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`
    );
  });

  remoteVideo.addEventListener("loadedmetadata", function () {
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

  const caller = document.getElementById("caller");
  const callee = document.getElementById("callee");
  const token = document.getElementById("token");

  startButton.addEventListener("click", start);
  callButton.addEventListener("click", call);
  hangupButton.addEventListener("click", hangup);
  createSessionButton.addEventListener("click", createSession);
  callAudioButton.addEventListener("click", callAudio);
  createSocketButton.addEventListener("click", createSocket);

  let localStream;
  let pc = null;
  const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1,
    iceRestart: true
  };

  let factory = null;

  let callEvtOb = {
    init_result: onInit,
    call_answered: onAnswer,
    incoming_call: onIncomingCall,
    on_ice: onIce
  };

  let socketEvtOb = {
    success: onSuccess,
    open: () => {/*on socket open*/ },
    connect_error: () => {/*on socket connect_error*/ },
    connect_timeout: () => {/*on socket connect_timeout*/ },
    reconnect: () => {/*on socket reconnect*/ }
  }

  async function createSocket() {
    Initialize(token.value, "192.168.1.9:3000", callEvtOb, {}, socketEvtOb);
    //factory = new ChannelFactory();
  }

  async function onSuccess(event) {
    //if socket connection is successfull
    startButton.disabled = false;
    createSessionButton.disabled = false;
  }

  async function onInit(event) {
    //handle init event
  }

  async function onAnswer(event) {
    let descAccepted = {
      type: "answer",
      sdp: event.sdp
    };
    acceptCall(descAccepted);
  }

  let acceptCall = async function (desc) {
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

  async function onIncomingCall(event) {
    let descIncoming = {
      type: "offer",
      sdp: event.sdp
    };
    answerCall(descIncoming);
  }

  let answerCall = async function (desc) {
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

  async function onIce(event) {
    await pc.addIceCandidate(event.candidate);
    onAddIceCandidateSuccess(pc);
  }

  ///AUDIO ONLY CALL IMPLEMENTATION
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

  async function createSession() {

    let user = {
      from: {
        id: caller.value,
        name: caller.value
      },
      to: {
        id: callee.value,
        name: callee.value
      }
    };

    ChannelFactory.call.sendCallEvent("init", user, null);
  }

  async function start() {
    console.log("Requesting local stream");
    //startButton.disabled = true;

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
    callButton.disabled = false;
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

    try {
      console.log("pc createOffer start");
      const offer = await pc.createOffer(offerOptions);
      await onCreateOfferSuccess(offer);
    } catch (e) {
      onCreateSessionDescriptionError(e);
    }
  }



  function onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }

  function sendOfferViaSocket(sdp) {

    let user = {
      from: {
        id: caller.value,
        name: caller.value
      },
      to: {
        id: callee.value,
        name: callee.value
      }
    };

    ChannelFactory.call.sendCallEvent("offer", user, sdp);
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
    console.log(`setLocalDescription complete`);
  }

  function onSetRemoteSuccess(pc) {
    console.log(`setRemoteDescription complete`);
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
      /* if (receiveVideo.srcObject !== e.streams[1]) {
        receiveVideo.srcObject = e.streams[1];
        console.log("pc received remote stream");
      } */
    }
  }

  async function onCreateAnswerSuccess(desc) {
    console.log(`Answer from pc:\n${desc.sdp}`);
    console.log("pc setLocalDescription start");
    try {
      await pc.setLocalDescription(desc);

      ChannelFactory.call.sendCallEvent("accept", null, desc.sdp);
      onSetLocalSuccess(pc);
    } catch (e) {
      onSetSessionDescriptionError(e);
    }
  }

  async function onIceCandidate(pc, event) {
    try {
      if (event.candidate) {

        ChannelFactory.call.sendCallEvent("trickle", null, event.candidate);
      } else {

        ChannelFactory.call.sendCallEvent("trickle_end", null, null);
      }
    } catch (e) { }
    console.log(
      `ICE candidate:\n${
      event.candidate ? event.candidate.candidate : "(null)"
      }`
    );
  }

  function onAddIceCandidateSuccess(pc) {
    console.log(` addIceCandidate success`);
  }

  function onIceStateChange(pc, event) {
    if (pc) {
      console.log(`ICE state: ${pc.iceConnectionState}`);
      console.log("ICE state change event: ", event);
    }
  }

  function hangup() {
    console.log("Ending call");
    pc.close();
    pc = null;

    let user = {
      from: {
        id: caller.value,
        name: caller.value
      },
      to: {
        id: callee.value,
        name: callee.value
      }
    };
    ChannelFactory.call.sendCallEvent("hangup", user, null);
  }
}
