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
import { ArrowLeft, Send, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtendedMessage extends Message {
  imageUrl?: string;
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
          const typedMessages: ExtendedMessage[] = filteredMessages.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            content: msg.content,
            timestamp: msg.timestamp,
            read: msg.read,
            imageUrl: msg.image_url
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
    
    // Set up real-time subscription for new messages - listen for ALL messages in this conversation
    const subscription = supabase
      .channel('general-chat')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const newMsg = payload.new;
        
        // Only process messages relevant to this conversation
        if ((newMsg.sender_id === user.id && newMsg.receiver_id === id) || 
            (newMsg.sender_id === id && newMsg.receiver_id === user.id)) {
          
          // Format to match our message structure
          const formattedMsg: ExtendedMessage = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            receiver_id: newMsg.receiver_id,
            content: newMsg.content,
            timestamp: newMsg.timestamp,
            read: newMsg.read,
            imageUrl: newMsg.image_url
          };
          
          // Add to messages if not already there
          setMessages(prev => {
            if (prev.some(msg => msg.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });
          
          // Mark as read if we're the receiver
          if (newMsg.receiver_id === user.id && !newMsg.read) {
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id);
          }
        }
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
    if ((!newMessage.trim() && !selectedImage) || !user || !id) return;
    
    try {
      let imageUrl = undefined;
      const timestamp = new Date().toISOString();
      const tempMessageId = `temp-${Date.now()}`;
      
      // If there's an image, upload it first
      if (selectedImage) {
        setUploadingImage(true);
        
        const fileName = `${user.id}_${Date.now()}_${selectedImage.name}`;
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('message_images')
          .upload(fileName, selectedImage);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL for the uploaded image
        const { data: urlData } = await supabase.storage
          .from('message_images')
          .getPublicUrl(fileName);
          
        imageUrl = urlData.publicUrl;
        setUploadingImage(false);
      }
      
      // Add message to local state immediately
      const optimisticMessage: ExtendedMessage = {
        id: tempMessageId,
        sender_id: user.id,
        receiver_id: id,
        content: newMessage,
        timestamp: timestamp,
        read: false,
        imageUrl: imageUrl
      };
      
      // Update UI immediately with optimistic update
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear the input and remove selected image
      setNewMessage("");
      setSelectedImage(null);
      
      // Then send to database
      const message = {
        sender_id: user.id,
        receiver_id: id,
        content: newMessage,
        timestamp: timestamp,
        read: false,
        image_url: imageUrl
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select();
        
      if (error) {
        console.error("Error sending message:", error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Replace the temporary message with the real one
      if (data && data[0]) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessageId 
            ? { ...data[0], imageUrl: data[0].image_url } 
            : msg
        ));
      }
      
    } catch (err) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setUploadingImage(false);
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
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedImage(file);
  };
  
  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
                  {message.imageUrl && (
                    <div className="mb-2">
                      <img 
                        src={message.imageUrl} 
                        alt="Shared image" 
                        className="rounded-md max-w-full max-h-64 object-contain" 
                      />
                    </div>
                  )}
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
      
      {/* Selected image preview */}
      {selectedImage && (
        <div className="p-2 bg-gray-100 border-t flex items-center">
          <div className="relative mr-2">
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Preview" 
              className="h-16 w-16 object-cover rounded"
            />
            <button 
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              onClick={removeSelectedImage}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-sm text-gray-600 flex-1 truncate">{selectedImage.name}</p>
        </div>
      )}
      
      {/* Message input */}
      <div className="border-t p-3 bg-white">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            type="button" 
            onClick={handleImageClick}
            className="flex-shrink-0"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none"
          />
          <Button 
            onClick={sendMessage} 
            disabled={(!newMessage.trim() && !selectedImage) || uploadingImage} 
            className="flex-shrink-0"
            type="submit"
          >
            {uploadingImage ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
