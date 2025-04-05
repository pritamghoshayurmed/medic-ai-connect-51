
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "@/types";
import { format } from "date-fns";
import { ArrowLeft, Send } from "lucide-react";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Find which user we're chatting with
        const otherUserId = id;
        
        if (!otherUserId) {
          console.error("No chat partner ID found");
          return;
        }
        
        // Get other user details
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select(`
            *,
            doctor_profiles (*)
          `)
          .eq('id', otherUserId)
          .single();
          
        if (userError) {
          console.error("Error fetching user:", userError);
        } else if (userData) {
          setOtherUser({
            ...userData,
            profilePic: userData.doctor_profiles ? 
              '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png' :
              undefined
          });
        }
        
        // Get messages between the two users
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
          .order('timestamp', { ascending: true });
          
        if (error) {
          console.error("Error fetching messages:", error);
        } else if (data) {
          // Filter to only include messages between these two users
          const filteredMessages = data.filter(
            msg => 
              (msg.sender_id === user.id && msg.receiver_id === otherUserId) || 
              (msg.sender_id === otherUserId && msg.receiver_id === user.id)
          );
          
          // Convert to our Message type
          const typedMessages: Message[] = filteredMessages.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            content: msg.content,
            timestamp: msg.timestamp,
            read: msg.read
          }));
          
          setMessages(typedMessages);
          
          // Mark unread messages as read
          const unreadIds = filteredMessages
            .filter(msg => msg.receiver_id === user.id && !msg.read)
            .map(msg => msg.id);
            
          if (unreadIds.length > 0) {
            await supabase
              .from('messages')
              .update({ read: true })
              .in('id', unreadIds);
          }
        }
      } catch (err) {
        console.error("Error in chat:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `sender_id=eq.${id},receiver_id=eq.${user.id}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => [...prev, newMsg]);
        
        // Mark as read immediately
        supabase
          .from('messages')
          .update({ read: true })
          .eq('id', newMsg.id);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [user, id]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;
    
    try {
      const message = {
        sender_id: user.id,
        receiver_id: id,
        content: newMessage,
        read: false
      };
      
      const { error } = await supabase
        .from('messages')
        .insert(message);
        
      if (error) {
        console.error("Error sending message:", error);
        return;
      }
      
      // Clear the input
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goBack = () => {
    const path = user?.role === 'doctor' ? '/doctor/chat-rooms' : '/patient';
    navigate(path);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser?.profilePic} />
          <AvatarFallback>{otherUser?.full_name?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        
        <div>
          <h1 className="font-semibold">{otherUser?.full_name}</h1>
          <p className="text-xs text-gray-500">
            {otherUser?.role === 'doctor' ? 'Doctor' : 'Patient'}
          </p>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isFromMe = message.sender_id === user?.id;
          return (
            <div key={message.id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-[80%] ${isFromMe ? 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}>
                <CardContent className="p-3">
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isFromMe ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                    {format(new Date(message.timestamp), 'p')}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="border-t p-3 bg-white">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()} 
            className="flex-shrink-0"
            type="submit"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
