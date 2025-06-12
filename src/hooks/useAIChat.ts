import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIChatService, ChatConversation, ChatMessage } from '@/services/aiChatService';
import { toast } from 'sonner';

// Query Keys
export const aiChatQueryKeys = {
  conversations: (userId: string) => ['ai-conversations', userId],
  conversation: (conversationId: string) => ['ai-conversation', conversationId],
  search: (userId: string, query: string) => ['ai-conversations-search', userId, query],
};

// Get all conversations for a user
export function useAIConversations(userId: string | undefined) {
  return useQuery({
    queryKey: aiChatQueryKeys.conversations(userId || ''),
    queryFn: () => AIChatService.getUserConversations(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get a specific conversation
export function useAIConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: aiChatQueryKeys.conversation(conversationId || ''),
    queryFn: () => AIChatService.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Create a new conversation
export function useCreateAIConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, title }: { userId: string; title?: string }) =>
      AIChatService.createConversation(userId, title),
    onSuccess: (conversationId, { userId }) => {
      if (conversationId) {
        // Invalidate conversations list
        queryClient.invalidateQueries({ 
          queryKey: aiChatQueryKeys.conversations(userId) 
        });
        toast.success('New conversation created');
      } else {
        toast.error('Failed to create conversation');
      }
    },
    onError: () => {
      toast.error('Failed to create conversation');
    },
  });
}

// Add a message to a conversation
export function useAddAIMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      conversationId, 
      message 
    }: { 
      conversationId: string; 
      message: Omit<ChatMessage, 'id' | 'timestamp'> 
    }) => AIChatService.addMessage(conversationId, message),
    onSuccess: (success, { conversationId }) => {
      if (success) {
        // Invalidate specific conversation
        queryClient.invalidateQueries({ 
          queryKey: aiChatQueryKeys.conversation(conversationId) 
        });
        // Also invalidate conversations list to update last message time
        queryClient.invalidateQueries({ 
          queryKey: ['ai-conversations'] 
        });
      } else {
        toast.error('Failed to send message');
      }
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });
}

// Update conversation title
export function useUpdateAIConversationTitle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      AIChatService.updateConversationTitle(conversationId, title),
    onSuccess: (success, { conversationId }) => {
      if (success) {
        queryClient.invalidateQueries({ 
          queryKey: aiChatQueryKeys.conversation(conversationId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['ai-conversations'] 
        });
        toast.success('Conversation title updated');
      } else {
        toast.error('Failed to update title');
      }
    },
    onError: () => {
      toast.error('Failed to update title');
    },
  });
}

// Delete a conversation
export function useDeleteAIConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (conversationId: string) => AIChatService.deleteConversation(conversationId),
    onSuccess: (success) => {
      if (success) {
        // Invalidate all conversation queries
        queryClient.invalidateQueries({ 
          queryKey: ['ai-conversations'] 
        });
        toast.success('Conversation deleted');
      } else {
        toast.error('Failed to delete conversation');
      }
    },
    onError: () => {
      toast.error('Failed to delete conversation');
    },
  });
}

// Clear all conversations
export function useClearAllAIConversations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => AIChatService.clearAllConversations(userId),
    onSuccess: (success, userId) => {
      if (success) {
        queryClient.invalidateQueries({ 
          queryKey: aiChatQueryKeys.conversations(userId) 
        });
        toast.success('All conversations cleared');
      } else {
        toast.error('Failed to clear conversations');
      }
    },
    onError: () => {
      toast.error('Failed to clear conversations');
    },
  });
}

// Search conversations
export function useSearchAIConversations(userId: string | undefined, query: string) {
  return useQuery({
    queryKey: aiChatQueryKeys.search(userId || '', query),
    queryFn: () => AIChatService.searchConversations(userId!, query),
    enabled: !!userId && query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Custom hook for managing conversation state
export function useAIConversationManager(userId: string | undefined) {
  const { data: conversations = [], isLoading } = useAIConversations(userId);
  const createConversation = useCreateAIConversation();
  const deleteConversation = useDeleteAIConversation();
  const clearAllConversations = useClearAllAIConversations();

  const handleCreateConversation = async (title?: string) => {
    if (!userId) return null;
    
    const result = await createConversation.mutateAsync({ userId, title });
    return result;
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation.mutateAsync(conversationId);
  };

  const handleClearAllConversations = async () => {
    if (!userId) return;
    await clearAllConversations.mutateAsync(userId);
  };

  return {
    conversations,
    isLoading,
    createConversation: handleCreateConversation,
    deleteConversation: handleDeleteConversation,
    clearAllConversations: handleClearAllConversations,
    isCreating: createConversation.isPending,
    isDeleting: deleteConversation.isPending,
    isClearing: clearAllConversations.isPending,
  };
}

// Custom hook for managing individual conversation
export function useAIConversationChat(conversationId: string | undefined) {
  const { data: conversation, isLoading } = useAIConversation(conversationId);
  const addMessage = useAddAIMessage();
  const updateTitle = useUpdateAIConversationTitle();

  const handleSendMessage = async (content: string, images?: string[]) => {
    if (!conversationId) return false;
    
    const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content,
      images
    };

    const result = await addMessage.mutateAsync({ conversationId, message });
    return result;
  };

  const handleAddAIResponse = async (content: string) => {
    if (!conversationId) return false;
    
    const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'assistant',
      content
    };

    const result = await addMessage.mutateAsync({ conversationId, message });
    return result;
  };

  const handleUpdateTitle = async (title: string) => {
    if (!conversationId) return false;
    
    const result = await updateTitle.mutateAsync({ conversationId, title });
    return result;
  };

  return {
    conversation,
    isLoading,
    sendMessage: handleSendMessage,
    addAIResponse: handleAddAIResponse,
    updateTitle: handleUpdateTitle,
    isSending: addMessage.isPending,
    isUpdatingTitle: updateTitle.isPending,
  };
}
