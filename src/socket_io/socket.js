import io from "socket.io-client";

export class Socket {
    constructor(authToken, path, socketEventHandlers) {
        this.socket = io(path, {
            forceNew: true,
            query: `auth_token=${authToken}`
        });

        this.socket.on("open", message => {
            if (socketEventHandlers["open"]) {
                socketEventHandlers["open"](message);
            }
        });

        this.socket.on("connect_error", message => {
            console.log(`Socket connection error`);
            if (socketEventHandlers["connect_error"]) {
                socketEventHandlers["connect_error"](message);
            }
        });

        this.socket.on("connect_timeout", message => {
            console.log(`Socket connection timeout`);
            if (socketEventHandlers["connect_timeout"]) {
                socketEventHandlers["connect_timeout"](message);
            }
        });

        this.socket.on("reconnect", message => {
            console.log(`Socket reconnected after ${message} attempts`);
            if (socketEventHandlers["reconnect"]) {
                socketEventHandlers["reconnect"](message);
            }
        });

        this.socket.on("success", message => {
            if (socketEventHandlers["success"]) {
                socketEventHandlers["success"](message);
            }
            console.log("Socket initiation succsessfull");
        });
    }
}