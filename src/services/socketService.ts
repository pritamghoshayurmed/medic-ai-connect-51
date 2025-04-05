import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Set your backend URL where Socket.IO server is running
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  return socket;
};

export const connectSocket = (userId: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      query: { userId },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket?.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Fallback to using Supabase realtime
    });
  }
  
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// React hook to use Socket.IO
export const useSocket = (userId: string | null) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket(userId);

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Connection status
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [userId]);

  return { isConnected };
};

// Functions for chat
export const joinChatRoom = (roomId: string): void => {
  if (socket) {
    socket.emit('joinRoom', roomId);
  }
};

export const leaveChatRoom = (roomId: string): void => {
  if (socket) {
    socket.emit('leaveRoom', roomId);
  }
};

export const sendMessage = (message: {
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
}): void => {
  if (socket) {
    socket.emit('sendMessage', message);
  }
};

// Function to create a unique room ID for a conversation between two users
export const getChatRoomId = (user1Id: string, user2Id: string): string => {
  // Sort IDs to ensure the same room ID regardless of who initiates
  const sortedIds = [user1Id, user2Id].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
}; 