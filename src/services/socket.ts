import { io, Socket } from 'socket.io-client';

// In dev: VITE_SOCKET_URL is unset → socket connects to the Vite dev server
// which proxies /socket.io to the real socket backend (see vite.config.ts).
// In production: set VITE_SOCKET_URL to the real backend URL.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
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
