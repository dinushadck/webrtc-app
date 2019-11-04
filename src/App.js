import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { UILoaded } from "./webrtc";
import myVideo from "./test_video_2.mkv";

function App() {
  useEffect(() => {
    UILoaded();
  }, []);

  return (
    <div className="row">
      <nav
        className="navbar navbar-expand-lg navbar-light"
        style={{ backgroundColor: "#563d7c" }}
      >
        <a className="navbar-brand" href="#">
          Web RTC
        </a>
      </nav>
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <div className="row">
          <div className="col-lg-3 col-md-3 col-sm-12 col-xs-12">
            <video
              id="localVideo"
              width="320"
              height="240"
              autoPlay
              playsInline
              muted
            ></video>
          </div>
          <div className="col-lg-3 col-md-3 col-sm-12 col-xs-12">
            <video
              id="remoteVideo"
              width="320"
              height="240"
              autoPlay
              playsInline
            ></video>
          </div>
          <div className="col-lg-3 col-md-3 col-sm-12 col-xs-12">
            <video
              id="customVideo"
              width="320"
              height="240"
              src={myVideo}
              type="video/mkv"
              autoPlay
            ></video>
          </div>
          <div className="col-lg-3 col-md-3 col-sm-12 col-xs-12">
            <video
              id="receiveVideo"
              width="320"
              height="240"
              autoPlay
              playsInline
            ></video>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <div className="row col-lg-12 col-md-12 col-sm-12 col-xs-12">
              <div className="col-lg-2 col-md-2 col-sm-3 col-xs-3">
                <lable>My Id : {"   "}</lable>
                <input id="caller" type="text"></input>
                <lable>Token : {"   "}</lable>
                <input id="token" type="text"></input>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-3 col-xs-3">
                <lable>Callee Id : {"   "}</lable>
                <input id="callee" type="text"></input>
              </div>
              <br />
              <br />
              <br />
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <button id="createSocket">Create Socket</button>
                <button id="createSession">Create Session WEBRTC</button>
                <button id="createSessionSIP">Create Session SIP</button>
              </div>
            </div>
            <br />
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
              <button id="startButton">Start</button> {" - "}
              <button id="callButton">Call</button> {" - "}
              <button id="customVideoButton">Send Custom Video</button> {" - "}
              <button id="hangupButton">Hang Up</button>
            </div>
            <br />
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
              <button id="startUpgradeButton">Start</button> {" - "}
              <button id="callAudioButton">Audio Call</button> {" - "}
              <button id="upgradeButton">Upgrade To Video</button>
            </div>
            <br />
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
              <lable>SDP Semantics: {"   "}</lable>
              <select id="sdpSemantics">
                <option selected value="">
                  Default
                </option>
                <option value="unified-plan">Unified Plan</option>
                <option value="plan-b">Plan B</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
