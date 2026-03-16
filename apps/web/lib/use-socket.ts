'use client';

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from './socket';
import { useAuth } from './auth-context';

export function useSocket(): Socket | null {
  const { token } = useAuth();
  const [sock, setSock] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setSock(null);
      return;
    }
    const s = getSocket(token);
    setSock(s);
    return () => {
      // Keep global socket for reuse; do not disconnect here.
    };
  }, [token]);

  return sock;
}

