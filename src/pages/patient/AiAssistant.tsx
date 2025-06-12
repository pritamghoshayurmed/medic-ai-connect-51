import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  MessageSquare,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  Bot,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAIConversationManager, useDeleteAIConversation } from "@/hooks/useAIChat";
import { AIChatService } from "@/services/aiChatService";
import { format } from "date-fns";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";

export default function AiAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const {
    conversations,
    isLoading,
    createConversation,
    clearAllConversations,
    isCreating,
    isClearing
  } = useAIConversationManager(user?.id);

  const deleteConversation = useDeleteAIConversation();

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCreateNewChat = async () => {
    const conversationId = await createConversation();
    if (conversationId) {
      navigate(`/patient/ai-chat/${conversationId}`);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    await deleteConversation.mutateAsync(conversationToDelete);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleExportConversation = (conversation: any) => {
    const exportText = AIChatService.exportConversation(conversation);
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Conversation exported successfully');
  };

  const handleClearAllChats = async () => {
    await clearAllConversations();
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a] flex items-center justify-center">
        <div className="text-white">Loading conversations...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a] pb-24">
      <div className="w-full max-w-[425px] mx-auto px-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-5 pb-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-white mr-2"
              onClick={() => navigate("/patient")}
            >
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-xl font-bold text-white">AI Assistant</h1>
          </div>
          <Button
            className="bg-[#00C389] hover:bg-[#00A070] text-white"
            size="sm"
            onClick={handleCreateNewChat}
            disabled={isCreating}
          >
            <Plus size={16} className="mr-1" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card
            className="bg-white/10 border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
            onClick={handleCreateNewChat}
          >
            <CardContent className="p-4 text-center">
              <Bot className="h-8 w-8 text-[#00C389] mx-auto mb-2" />
              <p className="text-white text-sm font-medium">New Consultation</p>
            </CardContent>
          </Card>

          <Card
            className="bg-white/10 border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => navigate("/patient/vitals")}
          >
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-[#00C389] mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Check Vitals</p>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Conversations</h2>
            {conversations.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
                onClick={handleClearAllChats}
                disabled={isClearing}
              >
                Clear All
              </Button>
            )}
          </div>

          {filteredConversations.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-8 text-center">
                <Bot className="h-12 w-12 text-white/50 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No conversations yet</h3>
                <p className="text-white/70 text-sm mb-4">
                  Start a new conversation with Kabiraj AI to get medical assistance
                </p>
                <Button
                  className="bg-[#00C389] hover:bg-[#00A070] text-white"
                  onClick={handleCreateNewChat}
                  disabled={isCreating}
                >
                  <Plus size={16} className="mr-2" />
                  Start New Chat
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className="bg-white/10 border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => navigate(`/patient/ai-chat/${conversation.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate mb-1">
                        {conversation.title}
                      </h3>
                      <p className="text-white/70 text-sm truncate mb-2">
                        {conversation.messages.length > 0
                          ? conversation.messages[conversation.messages.length - 1].content.substring(0, 60) + "..."
                          : "No messages yet"
                        }
                      </p>
                      <div className="flex items-center text-white/50 text-xs">
                        <MessageSquare size={12} className="mr-1" />
                        {conversation.messages.length} messages
                        <span className="mx-2">•</span>
                        {format(new Date(conversation.updated_at), 'MMM d, yyyy')}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/70 hover:text-white h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportConversation(conversation)}>
                          <Download size={16} className="mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setConversationToDelete(conversation.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}
