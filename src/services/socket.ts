import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3500';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const initializeSocket = (userId: string) => {
  if (!socket.connected) {
    socket.io.opts.query = { userId };
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
