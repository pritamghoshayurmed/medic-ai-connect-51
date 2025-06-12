import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  images?: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  summary?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export class AIChatService {
  // Create a new conversation
  static async createConversation(userId: string, title?: string): Promise<string | null> {
    try {
      const conversationId = uuidv4();
      const conversationTitle = title || `New Chat ${new Date().toLocaleDateString()}`;
      
      const { data, error } = await supabase
        .from('ai_chat_history')
        .insert({
          id: conversationId,
          user_id: userId,
          messages: [],
          summary: conversationTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createConversation:', error);
      return null;
    }
  }

  // Get all conversations for a user
  static async getUserConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data.map(conversation => ({
        id: conversation.id,
        title: conversation.summary || 'Untitled Chat',
        messages: conversation.messages as ChatMessage[] || [],
        summary: conversation.summary,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        user_id: conversation.user_id
      }));
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }

  // Get a specific conversation
  static async getConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.summary || 'Untitled Chat',
        messages: data.messages as ChatMessage[] || [],
        summary: data.summary,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id
      };
    } catch (error) {
      console.error('Error in getConversation:', error);
      return null;
    }
  }

  // Add a message to a conversation
  static async addMessage(
    conversationId: string, 
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<boolean> {
    try {
      // First get the current conversation
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        console.error('Conversation not found');
        return false;
      }

      // Create new message with ID and timestamp
      const newMessage: ChatMessage = {
        ...message,
        id: uuidv4(),
        timestamp: new Date().toISOString()
      };

      // Add message to the conversation
      const updatedMessages = [...conversation.messages, newMessage];

      // Update the conversation in database
      const { error } = await supabase
        .from('ai_chat_history')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error adding message:', error);
        return false;
      }

      // Auto-generate title if this is the first user message
      if (updatedMessages.length === 1 && message.role === 'user') {
        await this.updateConversationTitle(conversationId, this.generateTitleFromMessage(message.content));
      }

      return true;
    } catch (error) {
      console.error('Error in addMessage:', error);
      return false;
    }
  }

  // Update conversation title
  static async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .update({
          summary: title,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConversationTitle:', error);
      return false;
    }
  }

  // Delete a conversation
  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      return false;
    }
  }

  // Clear all conversations for a user
  static async clearAllConversations(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing conversations:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearAllConversations:', error);
      return false;
    }
  }

  // Generate conversation title from first message
  private static generateTitleFromMessage(content: string): string {
    // Take first 50 characters and add ellipsis if longer
    const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
    return title;
  }

  // Get conversation context for AI (last N messages)
  static getConversationContext(messages: ChatMessage[], maxMessages: number = 10): ChatMessage[] {
    // Return last N messages to maintain context while keeping API calls efficient
    return messages.slice(-maxMessages);
  }

  // Search conversations by content
  static async searchConversations(userId: string, query: string): Promise<ChatConversation[]> {
    try {
      const conversations = await this.getUserConversations(userId);
      
      return conversations.filter(conversation => {
        // Search in title
        if (conversation.title.toLowerCase().includes(query.toLowerCase())) {
          return true;
        }
        
        // Search in message content
        return conversation.messages.some(message => 
          message.content.toLowerCase().includes(query.toLowerCase())
        );
      });
    } catch (error) {
      console.error('Error in searchConversations:', error);
      return [];
    }
  }

  // Export conversation as text
  static exportConversation(conversation: ChatConversation): string {
    let exportText = `Conversation: ${conversation.title}\n`;
    exportText += `Created: ${new Date(conversation.created_at).toLocaleString()}\n`;
    exportText += `Updated: ${new Date(conversation.updated_at).toLocaleString()}\n\n`;
    
    conversation.messages.forEach(message => {
      const timestamp = new Date(message.timestamp).toLocaleString();
      exportText += `[${timestamp}] ${message.role.toUpperCase()}: ${message.content}\n\n`;
    });
    
    return exportText;
  }
}
