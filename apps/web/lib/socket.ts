'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const WS_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001')
    : undefined;

export function getSocket(token: string | null): Socket | null {
  if (typeof window === 'undefined') return null;
  if (!WS_URL || !token) return null;
  if (socket && socket.connected) return socket;
  if (!socket) {
    socket = io(WS_URL, {
      path: '/socket.io',
      auth: { token },
    });
  } else {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

