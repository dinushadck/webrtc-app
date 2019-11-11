import io from "socket.io-client";

export class Socket {
    constructor(authToken, path, socketEventHandlers) {
        this.socket = io(path, {
            forceNew: true,
            query: `auth_token=${authToken}`
        });

        this.socket.on("open", message => {
            console.log(`Socket connected`);
        });

        this.socket.on("connect_error", message => {
            console.log(`Socket connection error`);
        });

        this.socket.on("connect_timeout", message => {
            console.log(`Socket connection timeout`);
        });

        this.socket.on("reconnect", message => {
            console.log(`Socket reconnected after ${message} attempts`);
        });

        this.socket.on("success", message => {
            if (socketEventHandlers["success"]) {
                socketEventHandlers["success"](message);
            }
            console.log("Socket initiation succsessfull");
        });
    }
}