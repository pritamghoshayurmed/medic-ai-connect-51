import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Message } from "@/types";
import { format } from "date-fns";
import { ArrowLeft, Send, Image as ImageIcon, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtendedMessage extends Message {
  imageUrl?: string;
  prescriptionUrl?: string;
  isAI?: boolean;
}

// At the beginning, define the type for messages from the database
interface DBMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  read: boolean;
  image_url?: string | null;
  prescription_url?: string | null;
}

export default function DoctorChat() {
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
  const prescriptionInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>("chat");

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
            imageUrl: null, // Default value since image_url doesn't exist in the database
            prescriptionUrl: null, // Default value since prescription_url doesn't exist in the database
            isAI: false // Default value since is_ai doesn't exist in the database
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
      .channel('doctor-chat')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const newMsg = payload.new as DBMessage;
        
        // Only process messages that are part of this conversation
        if ((newMsg.sender_id === user.id && newMsg.receiver_id === id) || 
            (newMsg.sender_id === id && newMsg.receiver_id === user.id)) {
          
          // Format the message to match our expected structure
          const formattedMsg: ExtendedMessage = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            receiver_id: newMsg.receiver_id,
            content: newMsg.content,
            timestamp: newMsg.timestamp,
            read: newMsg.read,
            imageUrl: newMsg.image_url || null,
            prescriptionUrl: newMsg.prescription_url || null,
            isAI: false // Default value since is_ai doesn't exist in the database
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
    // Check if message is empty or user/id is not available
    if (!newMessage.trim() || !user || !id) return;
    
    try {
      // Create timestamp for message
      const timestamp = new Date().toISOString();
      const tempMessageId = `temp-${Date.now()}`;
      const messageContent = newMessage.trim();
      
      // Create optimistic message for UI
      const optimisticMessage: ExtendedMessage = {
        id: tempMessageId,
        sender_id: user.id,
        receiver_id: id,
        content: messageContent,
        timestamp: timestamp,
        read: false,
        imageUrl: null,
        prescriptionUrl: null,
        isAI: false
      };
      
      // Update UI immediately with optimistic message
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear the input
      setNewMessage("");
      
      // Define the message to save - only include fields that exist in the database
      const messageToSave = {
        sender_id: user.id,
        receiver_id: id,
        content: messageContent,
        read: false,
        timestamp: timestamp
      };
      
      console.log("Sending message:", JSON.stringify(messageToSave));
      
      // Insert the message
      const { data, error } = await supabase
        .from('messages')
        .insert(messageToSave)
        .select();
      
      if (error) {
        console.error("Error sending message:", error);
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Replace optimistic message with real message
      if (data && data.length > 0) {
        const dbMessage = data[0] as DBMessage;
        const finalMessage: ExtendedMessage = {
          id: dbMessage.id,
          sender_id: dbMessage.sender_id,
          receiver_id: dbMessage.receiver_id,
          content: dbMessage.content,
          timestamp: dbMessage.timestamp,
          read: dbMessage.read,
          imageUrl: dbMessage.image_url || null,
          prescriptionUrl: dbMessage.prescription_url || null,
          isAI: false // Default value since is_ai doesn't exist in the database
        };
        
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessageId ? finalMessage : msg
        ));
      }
      
    } catch (err) {
      console.error("Error in sendMessage:", err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goBack = () => {
    navigate('/doctor/chat-rooms');
  };
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handlePrescriptionClick = () => {
    prescriptionInputRef.current?.click();
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

  const handlePrescriptionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPrescription(file);
  };
  
  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedPrescription = () => {
    setSelectedPrescription(null);
    if (prescriptionInputRef.current) {
      prescriptionInputRef.current.value = '';
    }
  };

  // Function to format markdown (bold, italics, etc.)
  const formatMessage = (content: string) => {
    // Bold: **text** -> <strong>text</strong>
    let formattedText = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* -> <em>text</em>
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Preserve newlines
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    return formattedText;
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
      
      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col">
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
                      
                      {message.prescriptionUrl && (
                        <div className="mb-2 bg-white rounded-md p-2 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          <a 
                            href={message.prescriptionUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`text-sm underline ${isFromMe ? 'text-primary-foreground' : 'text-blue-500'}`}
                          >
                            View Prescription
                          </a>
                        </div>
                      )}
                      
                      {message.content && message.isAI ? (
                        <div 
                          className="text-sm prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      
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
          
          {/* Selected file previews */}
          <div className="px-3 space-y-2">
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
            
            {selectedPrescription && (
              <div className="p-2 bg-gray-100 border-t flex items-center">
                <div className="relative mr-2 bg-blue-100 h-16 w-16 flex items-center justify-center rounded">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <button 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    onClick={removeSelectedPrescription}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 flex-1 truncate">{selectedPrescription.name}</p>
              </div>
            )}
          </div>
          
          {/* Message input */}
          <div className="border-t p-3 bg-white mt-auto">
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
        </TabsContent>
        
        <TabsContent value="prescriptions" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Prescriptions</h2>
            
            {messages.filter(m => m.prescriptionUrl).length > 0 ? (
              messages
                .filter(m => m.prescriptionUrl)
                .map((message) => (
                  <Card key={message.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-md mr-3">
                          <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Prescription</h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(message.timestamp), 'PPP p')}
                          </p>
                        </div>
                        <Button asChild size="sm">
                          <a href={message.prescriptionUrl} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No prescriptions have been shared yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 