import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, CheckCheck, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types";
import { 
  connectSocket, 
  disconnectSocket, 
  getChatRoomId, 
  joinChatRoom,
  leaveChatRoom,
  sendMessage as socketSendMessage,
  useSocket
} from "@/services/socketService";

export default function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState<{id: string, name: string, profilePic?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRoomId = userId && user?.id ? getChatRoomId(user.id, userId) : null;
  
  // Connect to socket
  const { isConnected } = useSocket(user?.id || null);
  
  useEffect(() => {
    setSocketConnected(isConnected);
  }, [isConnected]);

  useEffect(() => {
    if (!user || !userId || !chatRoomId) return;

    // Join the chat room
    joinChatRoom(chatRoomId);

    const socket = connectSocket(user.id);
    
    // Listen for new messages
    socket.on('receiveMessage', (message: any) => {
      console.log('Received message via socket:', message);
      if ((message.senderId === userId && message.receiverId === user.id) || 
          (message.senderId === user.id && message.receiverId === userId)) {
        
        // Create a new message object
        const newMsg: Message = {
          id: message.id || crypto.randomUUID(),
          sender_id: message.senderId,
          receiver_id: message.receiverId,
          content: message.content,
          timestamp: message.timestamp || new Date().toISOString(),
          read: message.senderId === user.id ? true : false
        };
        
        // Update messages
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          if (prev.some(m => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        
        // Mark message as read if current user is the receiver
        if (message.senderId === userId && !message.read) {
          markMessageAsRead(message.id);
        }
      }
    });

    // Cleanup function
    return () => {
      if (chatRoomId) {
        leaveChatRoom(chatRoomId);
      }
      socket.off('receiveMessage');
    };
  }, [user, userId, chatRoomId]);

  useEffect(() => {
    if (!user || !userId) return;

    const fetchReceiverDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', userId)
          .single();

        if (error) throw error;
        
        // Fetch profile picture if exists (for doctors)
        let profilePic = undefined;
        
        if (data.role === 'doctor') {
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctor_profiles')
            .select('profile_photo')
            .eq('id', userId)
            .single();
            
          if (!doctorError && doctorData && doctorData.profile_photo) {
            profilePic = doctorData.profile_photo;
          }
        }
        
        setReceiver({
          id: data.id,
          name: data.full_name,
          profilePic
        });
      } catch (error) {
        console.error("Error fetching receiver details:", error);
        toast({
          title: "Error",
          description: "Could not load chat details",
          variant: "destructive",
        });
      }
    };

    const fetchMessages = async () => {
      setLoading(true);
      try {
        // Direct query to get messages between users
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
          .order('timestamp', { ascending: true });
            
        if (error) throw error;
          
        // Format messages to match our app's type
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString(),
          read: msg.read || false
        }));

        setMessages(formattedMessages);
        
        // Mark unread messages as read
        const unreadMessages = formattedMessages.filter(
          msg => msg.receiver_id === user.id && !msg.read
        );
        
        if (unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map(msg => markMessageAsRead(msg.id))
          );
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReceiverDetails();
    fetchMessages();

    // Subscribe to new messages through Supabase Realtime as fallback
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId},receiver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Received message via Supabase:', payload);
          // Only process if socket is not connected (fallback)
          if (!socketConnected) {
            const newMsg = payload.new as any;
            setMessages((prev) => {
              // Check for duplicates
              if (prev.some(m => m.id === newMsg.id)) {
                return prev;
              }
              return [
                ...prev,
                {
                  id: newMsg.id,
                  sender_id: newMsg.sender_id,
                  receiver_id: newMsg.receiver_id,
                  content: newMsg.content,
                  timestamp: newMsg.timestamp || new Date().toISOString(),
                  read: newMsg.read || false
                },
              ];
            });
            
            // Mark as read
            markMessageAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userId, toast, socketConnected]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !userId || !chatRoomId) return;

    try {
      const messageData = {
        sender_id: user.id,
        receiver_id: userId,
        content: newMessage,
        read: false,
        timestamp: new Date().toISOString()
      };

      // Generate a temporary ID for optimistic updates
      const tempId = crypto.randomUUID();
      
      // Add message to UI immediately (optimistic update)
      setMessages(prev => [
        ...prev,
        {
          id: tempId,
          ...messageData
        }
      ]);
      
      setNewMessage("");

      // Try to send via Socket.IO first
      if (socketConnected) {
        socketSendMessage({
          roomId: chatRoomId,
          senderId: user.id,
          receiverId: userId,
          content: newMessage
        });
      }

      // Always store in database for persistence
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select();

      if (error) throw error;
      
      // Replace the temp message with the real one from the database
      if (data && data.length > 0) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...data[0], id: data[0].id } : msg
          )
        );
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please login to access chat</p>
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
        <div className="flex-1 flex items-center">
          {receiver?.profilePic ? (
            <img 
              src={receiver.profilePic} 
              alt={receiver.name} 
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center mr-2">
              <span className="text-primary text-sm font-bold">{receiver?.name?.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-xl font-bold">{receiver?.name || 'Chat'}</h1>
        </div>
        <div className="flex items-center">
          {socketConnected ? (
            <div className="flex items-center text-white/90 text-xs mr-2">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
              <span>Live</span>
            </div>
          ) : (
            <div className="flex items-center text-white/90 text-xs mr-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></div>
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg ${
                    message.sender_id === user.id
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-gray-200 text-gray-800 rounded-tl-none"
                  }`}
                >
                  <p>{message.content}</p>
                  <div 
                    className={`text-xs mt-1 flex items-center justify-end ${
                      message.sender_id === user.id ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-1">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {message.sender_id === user.id && (
                      <CheckCheck 
                        size={14} 
                        className={message.read ? "text-green-400" : ""} 
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 mr-2"
          />
          <Button onClick={handleSendMessage}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
