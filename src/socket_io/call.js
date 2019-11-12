import uuid from "uuid/v1";

export class Call {
    constructor(socket, eventHandlers) {
        this._socket = socket;
        this._sid = null;
        this._eventHandlers = eventHandlers;

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
                    case "initiate_call": {
                        if (this._eventHandlers["initiate_call"]) {
                            this._eventHandlers["initiate_call"](jsonObj);
                        }
                        break;
                    }
                    case "await_for_call": {
                        if (this._eventHandlers["await_for_call"]) {
                            this._eventHandlers["await_for_call"](jsonObj);
                        }
                        break;
                    }
                    case "incoming_call": {
                        if (this._eventHandlers["incoming_call"]) {
                            this._sid = jsonObj.session_id;
                            this._eventHandlers["incoming_call"](jsonObj);
                        }
                        break;
                    }
                    case "hangup": {
                        if (this._eventHandlers["hangup"]) {
                            this._sid = jsonObj.session_id;
                            this._eventHandlers["hangup"](jsonObj);
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

        if (!(event === "init" || event === "offer" || event === "accept" || event === "answer" || event === "trickle" || event === "trickle_end" || event === "hangup")) {
            return new Error("Unsupported Event Type");
        }
        this._socket.emit("call", sessionEvent, ackData => {
            if (event === "init" && ackData && ackData.session_id) {
                this._sid = ackData.session_id;
                if (this._eventHandlers["init_result"]) {
                    this._eventHandlers["init_result"](ackData);
                }
            }
        });
        return sessionEvent;
    }
}