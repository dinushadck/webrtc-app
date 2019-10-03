import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { UILoaded } from "./webrtc";

function App() {
  useEffect(() => {
    UILoaded();
  }, []);

  return (
    <div className="row">
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="#">
          Web RTC
        </a>
      </nav>
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <div className="row">
          <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <video id="localVideo" autoPlay playsInline muted></video>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <video id="remoteVideo" autoPlay playsInline></video>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <button id="startButton">Start</button>
            <button id="callButton">Call</button>
            <button id="hangupButton">Hang Up</button>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <span>SDP Semantics:</span>
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
  );
}

export default App;
