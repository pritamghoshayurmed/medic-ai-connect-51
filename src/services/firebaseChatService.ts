import {
  ref,
  push,
  set,
  get,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp,
  DatabaseReference,
  DataSnapshot,
  update
} from 'firebase/database';
import { database, DB_PATHS } from '@/config/firebase';
import { firebaseAuthService } from './firebaseAuthService';

// Types
export interface FirebaseMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
  type: 'text' | 'image' | 'file';
  senderName?: string;
  senderRole?: 'doctor' | 'patient';
}

export interface FirebaseAIChatSession {
  id?: string;
  userId: string;
  messages: FirebaseAIMessage[];
  conversationHistory: any[];
  summary: string;
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseAIMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: FirebaseMessage;
  lastActivity: number;
  unreadCount: { [userId: string]: number };
}

class FirebaseChatService {
  // Doctor-Patient Chat Methods
  
  /**
   * Send a message between doctor and patient
   */
  async sendDoctorPatientMessage(
    senderId: string,
    receiverId: string,
    content: string,
    senderName: string,
    senderRole: 'doctor' | 'patient'
  ): Promise<string> {
    try {
      // Ensure Firebase authentication
      await firebaseAuthService.ensureAuthenticated();

      const chatId = this.generateChatId(senderId, receiverId);
      const messagesRef = ref(database, `${DB_PATHS.DOCTOR_PATIENT_CHATS}/${chatId}/messages`);

      const message: Omit<FirebaseMessage, 'id'> = {
        senderId,
        receiverId,
        content,
        timestamp: Date.now(),
        read: false,
        type: 'text',
        senderName,
        senderRole
      };

      const newMessageRef = push(messagesRef);
      await set(newMessageRef, message);

      // Update chat room metadata
      await this.updateChatRoomMetadata(chatId, [senderId, receiverId], message);

      console.log('Doctor-patient message sent successfully:', newMessageRef.key);
      return newMessageRef.key!;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Listen to messages in a doctor-patient chat
   */
  listenToDoctorPatientMessages(
    userId: string,
    otherUserId: string,
    callback: (messages: FirebaseMessage[]) => void
  ): () => void {
    const chatId = this.generateChatId(userId, otherUserId);
    const messagesRef = ref(database, `${DB_PATHS.DOCTOR_PATIENT_CHATS}/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    
    const unsubscribe = onValue(messagesQuery, (snapshot: DataSnapshot) => {
      const messages: FirebaseMessage[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val() as FirebaseMessage;
        message.id = childSnapshot.key!;
        messages.push(message);
      });
      
      callback(messages);
    });
    
    return () => off(messagesRef, 'value', unsubscribe);
  }

  /**
   * Get chat rooms for a user (doctor or patient)
   */
  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const chatsRef = ref(database, DB_PATHS.DOCTOR_PATIENT_CHATS);
      const snapshot = await get(chatsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const chatRooms: ChatRoom[] = [];
      const chatsData = snapshot.val();
      
      Object.keys(chatsData).forEach(chatId => {
        const chatData = chatsData[chatId];
        
        // Check if user is participant
        if (chatData.participants && chatData.participants.includes(userId)) {
          const room: ChatRoom = {
            id: chatId,
            participants: chatData.participants,
            lastActivity: chatData.lastActivity || 0,
            unreadCount: chatData.unreadCount || {},
            lastMessage: chatData.lastMessage
          };
          
          chatRooms.push(room);
        }
      });
      
      // Sort by last activity
      return chatRooms.sort((a, b) => b.lastActivity - a.lastActivity);
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
    try {
      const chatId = this.generateChatId(userId, otherUserId);
      const messagesRef = ref(database, `${DB_PATHS.DOCTOR_PATIENT_CHATS}/${chatId}/messages`);
      
      const snapshot = await get(messagesRef);
      if (!snapshot.exists()) return;
      
      const updates: { [key: string]: any } = {};
      
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val() as FirebaseMessage;
        if (message.receiverId === userId && !message.read) {
          updates[`${childSnapshot.key}/read`] = true;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await set(ref(database, `${DB_PATHS.DOCTOR_PATIENT_CHATS}/${chatId}/messages`), updates);
      }
      
      // Reset unread count
      await set(ref(database, `${DB_PATHS.DOCTOR_PATIENT_CHATS}/${chatId}/unreadCount/${userId}`), 0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // AI Chat Methods
  
  /**
   * Save AI chat session
   */
  async saveAIChatSession(
    userId: string,
    messages: FirebaseAIMessage[],
    conversationHistory: any[],
    summary: string
  ): Promise<string> {
    try {
      // Ensure Firebase authentication
      await firebaseAuthService.ensureAuthenticated();

      const sessionsRef = ref(database, `${DB_PATHS.AI_CHAT_HISTORY}/${userId}/sessions`);

      const session: Omit<FirebaseAIChatSession, 'id'> = {
        userId,
        messages,
        conversationHistory,
        summary,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const newSessionRef = push(sessionsRef);
      await set(newSessionRef, session);

      console.log('AI chat session saved successfully to Firebase:', newSessionRef.key);
      return newSessionRef.key!;
    } catch (error) {
      console.error('Error saving AI chat session:', error);
      throw error;
    }
  }

  /**
   * Get AI chat history for a user
   */
  async getAIChatHistory(userId: string): Promise<FirebaseAIChatSession[]> {
    try {
      // Ensure Firebase authentication
      await firebaseAuthService.ensureAuthenticated();

      const sessionsRef = ref(database, `${DB_PATHS.AI_CHAT_HISTORY}/${userId}/sessions`);
      const sessionsQuery = query(sessionsRef, orderByChild('createdAt'), limitToLast(50));

      const snapshot = await get(sessionsQuery);

      if (!snapshot.exists()) {
        console.log('No AI chat history found for user:', userId);
        return [];
      }

      const sessions: FirebaseAIChatSession[] = [];

      snapshot.forEach((childSnapshot) => {
        const session = childSnapshot.val() as FirebaseAIChatSession;
        session.id = childSnapshot.key!;
        sessions.push(session);
      });

      console.log(`Retrieved ${sessions.length} AI chat sessions for user:`, userId);
      return sessions.reverse(); // Most recent first
    } catch (error) {
      console.error('Error getting AI chat history:', error);
      throw error;
    }
  }

  /**
   * Update AI chat session
   */
  async updateAIChatSession(
    userId: string,
    sessionId: string,
    messages: FirebaseAIMessage[],
    conversationHistory: any[]
  ): Promise<void> {
    try {
      const sessionRef = ref(database, `${DB_PATHS.AI_CHAT_HISTORY}/${userId}/sessions/${sessionId}`);
      
      const updates = {
        messages,
        conversationHistory,
        updatedAt: Date.now()
      };
      
      await set(sessionRef, updates);
    } catch (error) {
      console.error('Error updating AI chat session:', error);
      throw error;
    }
  }

  // Helper Methods
  
  private generateChatId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }
  
  private async updateChatRoomMetadata(
    chatId: string, 
    participants: string[], 
    lastMessage: Omit<FirebaseMessage, 'id'>
  ): Promise<void> {
    try {
      const chatRef = ref(database, `${DB_PATHS.DOCTOR_PATIENT_CHATS}/${chatId}`);
      
      // Get current unread counts
      const snapshot = await get(chatRef);
      const currentData = snapshot.val() || {};
      const currentUnreadCount = currentData.unreadCount || {};
      
      // Increment unread count for receiver
      const newUnreadCount = { ...currentUnreadCount };
      newUnreadCount[lastMessage.receiverId] = (newUnreadCount[lastMessage.receiverId] || 0) + 1;
      
      const metadata = {
        participants,
        lastMessage,
        lastActivity: Date.now(),
        unreadCount: newUnreadCount
      };
      
      await set(chatRef, { ...currentData, ...metadata });
    } catch (error) {
      console.error('Error updating chat room metadata:', error);
      throw error;
    }
  }
}

export const firebaseChatService = new FirebaseChatService();
export default firebaseChatService;
