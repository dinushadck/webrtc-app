import { Socket } from "./socket";
import { Call } from "./call";
import { Chat } from "./chat";

export const ChannelFactory = {
  socketClient: null,
  call: null,
  chat: null
};

export const Initialize = (authToken, path, callEventHandlers, chatEventHandlers, socketEventHandlers) => {
  ChannelFactory.socketClient = new Socket(authToken, path, socketEventHandlers);
  ChannelFactory.call = new Call(ChannelFactory.socketClient.socket, callEventHandlers);
  ChannelFactory.chat = new Chat(ChannelFactory.socketClient.socket, chatEventHandlers);
}
