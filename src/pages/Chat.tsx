
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Paperclip, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  isAI?: boolean;
}

const MOCK_AI_ID = "ai";

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [isAIChat, setIsAIChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [receiverId, setReceiverId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Check if this is an AI chat
    if (id === "ai") {
      setIsAIChat(true);
      setReceiverName("AI Health Assistant");
      setIsLoading(false);
      
      // Set initial AI greeting if there are no messages
      if (messages.length === 0) {
        setMessages([
          {
            id: "ai1",
            content: "Hello! I'm your AI health assistant. How can I help you today?",
            senderId: MOCK_AI_ID,
            timestamp: new Date(),
            isAI: true,
          },
        ]);
      }
    } else if (id) {
      // Fetch the other user's details
      const fetchReceiverDetails = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          setReceiverName(profile.full_name);
          setReceiverId(profile.id);

          // Fetch chat history
          await fetchChatHistory();
        } catch (error) {
          console.error("Error fetching receiver details:", error);
          toast({
            title: "Error",
            description: "Failed to load chat details.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchReceiverDetails();
    }
  }, [id, user]);

  const fetchChatHistory = async () => {
    if (!user || !id) return;

    try {
      // Query for messages between these two users
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`senderId.eq.${user.id},receiverId.eq.${user.id}`)
        .or(`senderId.eq.${id},receiverId.eq.${id}`)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: user.id,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setNewMessage("");

    if (isAIChat) {
      // Handle AI chat
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: getAIResponse(newMessage),
          senderId: MOCK_AI_ID,
          timestamp: new Date(),
          isAI: true,
        };
        
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    } else if (receiverId) {
      // Save message to database
      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            senderId: user.id,
            receiverId: receiverId,
            content: newMessage,
            timestamp: new Date().toISOString(),
            read: false
          });

        if (error) throw error;

        // Create a notification for the receiver
        await supabase
          .from('notifications')
          .insert({
            user_id: receiverId,
            title: "New Message",
            message: `${user.name} sent you a message`,
            type: "message"
          });
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message.",
          variant: "destructive",
        });
      }
    }
  };

  // Simple AI response generator for demo
  const getAIResponse = (message: string): string => {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes("headache") || messageLower.includes("head") || messageLower.includes("pain")) {
      return "Based on your description, you might be experiencing tension headaches. I recommend rest, staying hydrated, and taking over-the-counter pain relievers if needed. If symptoms persist for more than 3 days, please consult with a doctor.";
    } else if (messageLower.includes("fever") || messageLower.includes("temperature")) {
      return "Fever can be a sign of infection. Make sure to stay hydrated and rest. If your temperature is above 102°F (38.9°C) or persists for more than 3 days, please seek medical attention.";
    } else if (messageLower.includes("cold") || messageLower.includes("flu") || messageLower.includes("cough")) {
      return "For cold and flu symptoms, rest and proper hydration are key. Over-the-counter medications can help manage symptoms. If you experience difficulty breathing or symptoms worsen, please consult a healthcare professional.";
    } else {
      return "I understand your concern. Based on the information provided, I recommend consulting with a healthcare professional for a proper diagnosis. Would you like me to help you find a doctor?";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <div className="flex-grow">
          <h1 className="text-lg font-bold">{receiverName}</h1>
          <p className="text-sm text-white text-opacity-80">
            {isAIChat ? "AI Health Assistant" : "Available"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => {
          const isUserMessage = message.senderId === user?.id;
          
          return (
            <div
              key={message.id}
              className={cn(
                "max-w-[80%] mb-4",
                isUserMessage ? "ml-auto" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-lg",
                  isUserMessage
                    ? "bg-primary text-white rounded-tr-none"
                    : message.isAI
                    ? "bg-blue-100 text-blue-900 rounded-tl-none"
                    : "bg-white text-gray-800 rounded-tl-none shadow"
                )}
              >
                <p>{message.content}</p>
              </div>
              <p className={cn(
                "text-xs mt-1",
                isUserMessage ? "text-right" : "text-left",
                "text-gray-500"
              )}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Paperclip />
          </Button>
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            className="mx-2"
          />
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Mic />
          </Button>
          <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
}
