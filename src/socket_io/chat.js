import uuid from "uuid/v1";
export class Chat {
    constructor(socket, eventHandlers) {
        this._socket = socket;
        this.replyMap = {};
        this._eventHandlers = eventHandlers;

        this._socket.on("chat", message => {
            if (this._eventHandlers["chat_received"]) {
                if (message.from && message.from.id) {
                    this.replyMap[message.from.id] = message.replyId;
                }
                this._eventHandlers["chat_received"](message);
            }
        });

        this._socket.on("chat status", message => {
            if (this._eventHandlers["chat_status_received"]) {
                this._eventHandlers["chat_status_received"](message);
            }
        });
    }

    setEventHandlers(evtHandlers) {
        this._eventHandlers = evtHandlers;
    }

    sendMessage(type, data, content) {
        let messageEvent = {
            mid: uuid(),
            sid: uuid(), //not being used for now
            type: type, //2
            timestamp: Date.now(),
            content: content
        };

        if (data && data.from && data.to && data.from.id && data.from.name && data.to.id && data.to.name) {
            messageEvent.from = data.from;
            messageEvent.to = data.to;
        } else {
            return { Exception: new Error("Invalid data object"), IsSuccess: true, Result: messageEvent };
        }

        if (!(type === 2)) {
            return { Exception: new Error("Unsupported event type"), IsSuccess: true, Result: messageEvent };
        }
        this._socket.emit("chat", messageEvent, ackData => {
            if (ackData && ackData.replyId) {
                this.replyMap[data.to.id] = ackData.replyId;
            }
        });
        return messageEvent;
    }

    sendChatStatus(type, data) {

        let statusEvent = {
            status: type //2
        }

        if (data && data.from && data.to && data.from.id && data.from.name && data.to.id && data.to.name) {
            statusEvent.from = data.from;
            statusEvent.to = data.to;
        } else {
            return { Exception: new Error("Invalid data object"), IsSuccess: true, Result: statusEvent };
        }

        statusEvent.replyId = this.replyMap[data.to.id];

        this._socket.emit("chat status", statusEvent, ackData => {

        });
        return statusEvent;

    }
}