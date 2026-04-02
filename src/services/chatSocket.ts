import { io, Socket } from 'socket.io-client';

const CHAT_SOCKET_URL = import.meta.env.VITE_CHAT_SOCKET_URL || 'http://localhost:5200';

export const chatSocket: Socket = io(CHAT_SOCKET_URL, {
  autoConnect: false,
});

export const initializeChatSocket = (userId: string) => {
  if (!chatSocket.connected) {
    chatSocket.io.opts.query = { userId };
    chatSocket.connect();
  }
};

export const disconnectChatSocket = () => {
  if (chatSocket.connected) {
    chatSocket.disconnect();
  }
};

export default chatSocket;
