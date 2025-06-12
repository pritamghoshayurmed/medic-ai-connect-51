import { firebaseChatService, FirebaseAIMessage, FirebaseAIChatSession } from './firebaseChatService';
import { firebaseInitService } from './firebaseInitService';
import { askMedicalQuestion } from './doctorAiService';
import { userMappingService } from './userMappingService';
import { v4 as uuidv4 } from 'uuid';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIChatSession {
  id: string;
  userId: string;
  messages: AIChatMessage[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}

class FirebaseAIChatService {
  private currentSessionId: string | null = null;
  private currentMessages: AIChatMessage[] = [];
  private conversationHistory: any[] = [];

  /**
   * Initialize a new AI chat session
   */
  initializeSession(userId: string): string {
    this.currentSessionId = uuidv4();
    this.currentMessages = [{
      id: uuidv4(),
      role: 'assistant',
      content: "Hello! I'm Kabiraj, your medical assistant. What symptom is troubling you the most?",
      timestamp: new Date().toISOString()
    }];
    
    // Initialize conversation history with system prompt
    this.conversationHistory = [
      { 
        role: "user", 
        content: `You are an AI-powered medical assistant named Kaviraj AI.
        Your role is to help patients understand their symptoms and provide general medical guidance.
        
        Guidelines:
        1. Always be empathetic and professional
        2. Provide helpful medical information but remind users to consult healthcare professionals
        3. Ask relevant follow-up questions to better understand symptoms
        4. Never provide definitive diagnoses - only general guidance
        5. If symptoms seem serious, recommend immediate medical attention
        6. Keep responses concise but informative
        7. If anything that is not related to your medical field. Say you are for medical diagnosis only and Dont have expertise in other domain`
      },
      { 
        role: "model", 
        content: "Hello! I'm Kabiraj, your medical assistant. What symptom is troubling you the most?" 
      }
    ];
    
    return this.currentSessionId;
  }

  /**
   * Send a message to AI and get response
   */
  async sendMessage(userId: string, message: string): Promise<AIChatMessage> {
    try {
      // Ensure Firebase is initialized
      const isFirebaseReady = await firebaseInitService.initialize();

      // Get Firebase user ID for this Supabase user
      const firebaseUserId = await userMappingService.getFirebaseUserId(userId);
      console.log(`Using Firebase ID: ${firebaseUserId} for Supabase ID: ${userId}`);

      if (!this.currentSessionId) {
        this.initializeSession(firebaseUserId);
      }

      // Add user message
      const userMessage: AIChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      this.currentMessages.push(userMessage);

      // Update conversation history for AI context
      this.conversationHistory.push({ role: "user", content: message });

      // Get AI response
      const aiResponse = await askMedicalQuestion(message, this.conversationHistory);

      // Add AI response
      const assistantMessage: AIChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse.answer,
        timestamp: new Date().toISOString()
      };

      this.currentMessages.push(assistantMessage);
      this.conversationHistory.push({ role: "model", content: aiResponse.answer });

      // Auto-save session to Firebase after each AI response
      if (isFirebaseReady) {
        try {
          await this.saveCurrentSession(firebaseUserId);
          console.log('✅ AI chat session auto-saved successfully');
        } catch (saveError) {
          console.error('❌ Failed to auto-save AI chat session:', saveError);
          // Don't throw error, just log it
        }
      } else {
        console.log('⚠️ Skipping Firebase save - service not ready');
      }

      return assistantMessage;
    } catch (error) {
      console.error('Error in AI chat:', error);

      // Return error message
      const errorMessage: AIChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: "Sorry, I encountered an error connecting to the AI service. Please try again later.",
        timestamp: new Date().toISOString()
      };

      this.currentMessages.push(errorMessage);
      return errorMessage;
    }
  }

  /**
   * Get current session messages
   */
  getCurrentMessages(): AIChatMessage[] {
    return [...this.currentMessages];
  }

  /**
   * Load a previous chat session
   */
  async loadSession(userId: string, sessionId: string): Promise<AIChatMessage[]> {
    try {
      const sessions = await firebaseChatService.getAIChatHistory(userId);
      const session = sessions.find(s => s.id === sessionId);
      
      if (session) {
        this.currentSessionId = sessionId;
        this.currentMessages = this.convertFirebaseMessagesToAIMessages(session.messages);
        this.conversationHistory = session.conversationHistory || [];
        
        return this.currentMessages;
      }
      
      return [];
    } catch (error) {
      console.error('Error loading AI chat session:', error);
      return [];
    }
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(userId: string): Promise<AIChatSession[]> {
    try {
      // Ensure Firebase is initialized
      const isFirebaseReady = await firebaseInitService.initialize();

      if (!isFirebaseReady) {
        console.warn('Firebase not ready, returning empty chat history');
        return [];
      }

      const firebaseSessions = await firebaseChatService.getAIChatHistory(userId);

      return firebaseSessions.map(session => ({
        id: session.id!,
        userId: session.userId,
        messages: this.convertFirebaseMessagesToAIMessages(session.messages),
        summary: session.summary,
        createdAt: new Date(session.createdAt).toISOString(),
        updatedAt: new Date(session.updatedAt).toISOString()
      }));
    } catch (error) {
      console.error('Error getting AI chat history:', error);
      return [];
    }
  }

  /**
   * Start a new chat session
   */
  startNewChat(userId: string): AIChatMessage[] {
    this.initializeSession(userId);
    return this.getCurrentMessages();
  }

  /**
   * Save current session to Firebase
   */
  private async saveCurrentSession(userId: string): Promise<void> {
    if (!this.currentSessionId || this.currentMessages.length <= 1) {
      return;
    }

    try {
      const firebaseMessages: FirebaseAIMessage[] = this.currentMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime()
      }));

      // Generate summary from first user message
      const userMessages = this.currentMessages.filter(m => m.role === 'user');
      const summary = userMessages.length > 0 
        ? userMessages[0].content.substring(0, 50) + "..." 
        : 'AI Chat Session';

      await firebaseChatService.saveAIChatSession(
        userId,
        firebaseMessages,
        this.conversationHistory,
        summary
      );

      console.log('AI chat session saved to Firebase');
    } catch (error) {
      console.error('Error saving AI chat session:', error);
      throw error;
    }
  }

  /**
   * Convert Firebase messages to AI messages
   */
  private convertFirebaseMessagesToAIMessages(firebaseMessages: FirebaseAIMessage[]): AIChatMessage[] {
    return firebaseMessages.map(msg => ({
      id: msg.id || uuidv4(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp).toISOString()
    }));
  }

  /**
   * Clear current session
   */
  clearCurrentSession(): void {
    this.currentSessionId = null;
    this.currentMessages = [];
    this.conversationHistory = [];
  }

  /**
   * Get conversation context for sharing with doctors
   */
  getConversationSummary(): string {
    const userMessages = this.currentMessages.filter(m => m.role === 'user');
    const aiMessages = this.currentMessages.filter(m => m.role === 'assistant');
    
    if (userMessages.length === 0) {
      return 'No conversation to share.';
    }

    let summary = 'AI Chat Summary:\n\n';
    
    for (let i = 0; i < Math.min(userMessages.length, aiMessages.length); i++) {
      summary += `Patient: ${userMessages[i].content}\n`;
      if (aiMessages[i]) {
        summary += `AI: ${aiMessages[i].content}\n\n`;
      }
    }
    
    return summary;
  }
}

export const firebaseAIChatService = new FirebaseAIChatService();
export default firebaseAIChatService;
