import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  X, 
  FileText, 
  Phone,
  Video,
  MoreVertical,
  PaperclipIcon 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedPrescriptionPreview, setSelectedPrescriptionPreview] = useState<string | null>(null);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [viewImageDialog, setViewImageDialog] = useState<string | null>(null);

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
            imageUrl: msg.image_url || null,
            prescriptionUrl: msg.prescription_url || null,
            isAI: false
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
            isAI: false
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
    if (!newMessage.trim() && !selectedImage && !selectedPrescription) return;
    
    try {
      // Create timestamp for message
      const timestamp = new Date().toISOString();
      const tempMessageId = `temp-${Date.now()}`;
      const messageContent = newMessage.trim();
      
      // Create optimistic message for UI
      const optimisticMessage: ExtendedMessage = {
        id: tempMessageId,
        sender_id: user!.id,
        receiver_id: id!,
        content: messageContent || (selectedImage ? 'Sent an image' : 'Sent a prescription'),
        timestamp: timestamp,
        read: false,
        imageUrl: selectedImagePreview,
        prescriptionUrl: selectedPrescriptionPreview,
        isAI: false
      };
      
      // Update UI immediately with optimistic message
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear the input and selected files
      setNewMessage("");
      setSelectedImage(null);
      setSelectedPrescription(null);
      setSelectedImagePreview(null);
      setSelectedPrescriptionPreview(null);
      
              // Define the message to save - only include fields that exist in the database
        const messageToSave: any = {
          sender_id: user!.id,
          receiver_id: id!,
          content: messageContent || (selectedImage ? 'Sent an image' : 'Sent a prescription'),
          read: false,
          timestamp: timestamp
        };
        
        // Add image_url and prescription_url if they exist in the database
        if (selectedImagePreview) {
          messageToSave.image_url = selectedImagePreview;
        }
        
        if (selectedPrescriptionPreview) {
          messageToSave.prescription_url = selectedPrescriptionPreview;
        }
      
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
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
    navigate(-1);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handlePrescriptionClick = () => {
    setShowPrescriptionDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image less than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrescriptionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file less than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedPrescription(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPrescriptionPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setSelectedImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSelectedPrescription = () => {
    setSelectedPrescription(null);
    setSelectedPrescriptionPreview(null);
    if (prescriptionInputRef.current) {
      prescriptionInputRef.current.value = "";
    }
  };

  const formatMessage = (content: string) => {
    // Handle URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>');
  };

  const formattedDate = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a] flex flex-col">
      <div className="flex-1 flex flex-col w-full max-w-[425px] mx-auto">
        {/* Header */}
        <div className="bg-white shadow-md px-4 py-3 rounded-b-[15px]">
          <div className="flex items-center">
            <button 
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={goBack}
            >
              <ArrowLeft className="text-gray-700" size={20} />
            </button>
            
            {otherUser && (
              <div className="flex items-center ml-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.profilePic} />
                  <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                    {otherUser.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">
                    {otherUser.role === 'doctor' ? `Dr. ${otherUser.full_name}` : otherUser.full_name}
                  </h3>
                  <div className="flex items-center">
                    <span className="h-2 w-2 bg-[#00C389] rounded-full"></span>
                    <span className="text-xs text-gray-500 ml-1.5">Online</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="ml-auto flex">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Phone size={18} />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 ml-1">
                <Video size={18} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-gray-600 hover:text-gray-900 ml-1">
                    <MoreVertical size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Patient Profile</DropdownMenuItem>
                  <DropdownMenuItem>Clear Chat History</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 px-4 py-5 overflow-y-auto bg-gray-50 mb-[70px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00C389]"></div>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isUserMessage = message.sender_id === user?.id;
                const showTimestamp = index === 0 || 
                  new Date(message.timestamp).getDate() !== new Date(messages[index - 1].timestamp).getDate();
                
                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs bg-gray-200 text-gray-600 py-1 px-2 rounded-full">
                          {format(new Date(message.timestamp), "EEEE, MMMM d")}
                        </span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex max-w-[85%]",
                      isUserMessage ? "ml-auto" : "mr-auto"
                    )}>
                      {!isUserMessage && (
                        <Avatar className="h-8 w-8 mr-2 mt-1">
                          <AvatarImage src={otherUser?.profilePic} />
                          <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                            {otherUser?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "rounded-xl py-2 px-3 relative min-w-[60px]",
                        isUserMessage 
                          ? "bg-[#00C389] text-white rounded-br-none" 
                          : "bg-white text-gray-800 shadow-sm rounded-bl-none"
                      )}>
                        {message.imageUrl && (
                          <div 
                            className="mb-2 cursor-pointer rounded-lg overflow-hidden"
                            onClick={() => setViewImageDialog(message.imageUrl!)}
                          >
                            <img 
                              src={message.imageUrl} 
                              alt="Attached image" 
                              className="max-w-full max-h-[200px] object-cover"
                            />
                          </div>
                        )}
                        
                        {message.prescriptionUrl && (
                          <div className="mb-2 p-3 bg-gray-100 rounded-lg flex items-center">
                            <FileText className="h-6 w-6 text-blue-500 mr-2" />
                            <div>
                              <p className="text-sm font-medium">Prescription</p>
                              <p className="text-xs text-gray-500">Click to view</p>
                            </div>
                          </div>
                        )}
                        
                        {message.content && (
                          <div 
                            className="text-sm"
                            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                          />
                        )}
                        
                        <span className={cn(
                          "text-[10px] absolute bottom-1 right-1",
                          isUserMessage ? "text-white/80" : "text-gray-500"
                        )}>
                          {format(new Date(message.timestamp), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-[#00C389]/10 rounded-full flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-[#00C389]" />
              </div>
              <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-3 shadow-[0_-1px_3px_rgba(0,0,0,0.1)] max-w-[425px] mx-auto rounded-t-[15px]">
          {selectedImagePreview && (
            <div className="relative mb-2 inline-block">
              <img 
                src={selectedImagePreview} 
                alt="Selected image" 
                className="h-16 w-auto rounded border"
              />
              <button
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                onClick={removeSelectedImage}
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {selectedPrescriptionPreview && (
            <div className="relative mb-2 inline-flex items-center bg-blue-50 py-1 px-2 rounded border">
              <FileText className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs">Prescription attached</span>
              <button
                className="ml-1 text-red-500"
                onClick={removeSelectedPrescription}
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          <div className="flex items-end">
            <div className="relative flex-grow">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="resize-none min-h-[40px] max-h-[120px] pr-12 py-2 rounded-full border-gray-200"
              />
              <div className="absolute bottom-1 right-2 flex">
                <button 
                  className="p-1.5 text-gray-500"
                  onClick={handleImageClick}
                >
                  <ImageIcon size={18} />
                </button>
                <button 
                  className="p-1.5 text-gray-500 ml-1"
                  onClick={handlePrescriptionClick}
                >
                  <FileText size={18} />
                </button>
              </div>
            </div>
            <Button
              className="ml-2 w-10 h-10 rounded-full p-0 bg-[#00C389] hover:bg-[#00A070] flex items-center justify-center flex-shrink-0"
              onClick={sendMessage}
              disabled={!newMessage.trim() && !selectedImage && !selectedPrescription}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
      </div>
      
      {/* View Image Dialog */}
      <Dialog open={!!viewImageDialog} onOpenChange={() => setViewImageDialog(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-black rounded-lg">
          <div className="relative">
            <img 
              src={viewImageDialog || ''} 
              alt="Enlarged image" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <button 
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1" 
              onClick={() => setViewImageDialog(null)}
            >
              <X size={16} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Prescription Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Prescription</DialogTitle>
            <DialogDescription>
              Upload a prescription or create one digitally.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => prescriptionInputRef.current?.click()}
            >
              <PaperclipIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium">Upload Prescription</p>
              <p className="text-xs text-gray-500">PDF, JPG, or PNG up to 5MB</p>
            </div>
            
            <input
              type="file"
              ref={prescriptionInputRef}
              onChange={handlePrescriptionFileChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            
            {selectedPrescriptionPreview && (
              <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Prescription file selected</p>
                    <p className="text-xs text-gray-500">{selectedPrescription?.name}</p>
                  </div>
                </div>
                <button
                  className="text-red-500"
                  onClick={removeSelectedPrescription}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPrescriptionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#00C389] hover:bg-[#00A070] text-white"
              onClick={() => {
                setShowPrescriptionDialog(false);
                if (selectedPrescription) {
                  sendMessage();
                }
              }}
              disabled={!selectedPrescription}
            >
              Attach Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 