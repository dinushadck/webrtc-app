import io from "socket.io-client";
import uuid from "uuid/v1";

export class Socket {
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
        let jsonObj = JSON.parse(message);
        this._eventHandlers["success"](jsonObj);
      }
    });

    this._socket.on("call", message => {
      let jsonObj = JSON.parse(message);

      if (jsonObj) {
        switch (jsonObj.event) {
          case "init": {
            this._sid = jsonObj.session_id;
            break;
          }
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

  send(channel, event, data, content, ack) {
    let sessionEvent = {
      mid: uuid(),
      channel: channel,
      event: event,
      timestamp: Date.now(),
      content: content,
      sid: this._sid
    };

    if (data) {
      sessionEvent.from = data.from;
      sessionEvent.to = data.to;
    }

    switch (channel) {
      case "call": {
        if (
          !(
            event === "init" ||
            event === "offer" ||
            event === "accept" ||
            event === "answer" ||
            event === "trickle" ||
            event === "trickle_end"
          )
        ) {
          return new Error("Unsupported Event Type");
        }
        break;
      }
      case "register":
        break;
      default: {
        return new Error("Unsupported Channel Type");
      }
    }
    this._socket.emit(channel, JSON.stringify(sessionEvent), ackData => {
      if (ack) {
        ack(ackData);
      }
    });
    return sessionEvent;
  }
}
