/* import io from "socket.io-client";
import uuid from "uuid/v1"; */
import { Socket } from "./socket";
import { Call } from "./call";
import { Chat } from "./chat";

export class ChannelFactory {
  constructor(authToken, path, callEventHandlers, chatEventHandlers, socketEventHandlers) {
    this.socketClient = new Socket(authToken, path, socketEventHandlers);
    this.call = new Call(this.socketClient.socket, callEventHandlers);
    this.chat = new Chat(this.socketClient.socket, chatEventHandlers);
  }
}

/* export class Socket {
  constructor(authToken, path, handlers) {
    this._eventHandlers = handlers;
    this._socket = io(path, {
      forceNew: true,
      query: `auth_token=${authToken}`
    });
    this._sid = "N/A";

    this._socket.on("open", message => {
      console.log(`Socket connected`);
    });

    this._socket.on("connect_error", message => {
      console.log(`Socket connection error`);
    });

    this._socket.on("connect_timeout", message => {
      console.log(`Socket connection timeout`);
    });

    this._socket.on("reconnect", message => {
      console.log(`Socket reconnected after ${message} attempts`);
    });

    this._socket.on("success", message => {
      if (this._eventHandlers["success"]) {
        let jsonObj = message;
        this._eventHandlers["success"](jsonObj);
      }
    });

    this._socket.on("call", message => {
      let jsonObj = message;

      if (jsonObj) {
        switch (jsonObj.event) {
          case "call_answered": {
            if (this._eventHandlers["call_answered"]) {
              this._eventHandlers["call_answered"](jsonObj);
            }
            break;
          }
          case "incoming_call": {
            if (this._eventHandlers["incoming_call"]) {
              this._eventHandlers["incoming_call"](jsonObj);
            }
            break;
          }
          case "on_ice": {
            if (this._eventHandlers["on_ice"]) {
              this._eventHandlers["on_ice"](jsonObj);
            }
            break;
          }
          default:
            break;
        }
      }
    });
  }

  sendChatEvent(event, type, data, content) {
    let sessionEvent = {
      mid: uuid(),
      channel: "call",
      event: event,
      timestamp: Date.now(),
      content: content,
      sid: this._sid
    };

    if (data) {
      sessionEvent.from = data.from;
      sessionEvent.to = data.to;
    }

    if (!(event === "init" || event === "offer" || event === "accept" || event === "answer" || event === "trickle" || event === "trickle_end")) {
      return new Error("Unsupported Event Type");
    }
    this._socket.emit("call", sessionEvent, ackData => {
      if (event === "init" && ackData && ackData.session_id) {
        this._sid = ackData.session_id;
      }
    });
    return sessionEvent;
  }


  sendCallEvent(event, data, content) {
    let sessionEvent = {
      mid: uuid(),
      channel: "call",
      event: event,
      timestamp: Date.now(),
      content: content,
      sid: this._sid
    };

    if (data) {
      sessionEvent.from = data.from;
      sessionEvent.to = data.to;
    }

    if (!(event === "init" || event === "offer" || event === "accept" || event === "answer" || event === "trickle" || event === "trickle_end")) {
      return new Error("Unsupported Event Type");
    }
    this._socket.emit("call", sessionEvent, ackData => {
      if (event === "init" && ackData && ackData.session_id) {
        this._sid = ackData.session_id;
      }
    });
    return sessionEvent;
  }
} */
