import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// import { supabase } from "@/integrations/supabase/client"; // No longer direct Supabase for messages
import { firebaseChatService, FirebaseMessage } from "@/services/firebaseChatService";
import { userMappingService } from "@/services/userMappingService";
import { supabase } from "@/integrations/supabase/client"; // Keep for profile fetching
import { Profile } from "@/types"; // Assuming Profile type exists for patient details

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Card, CardContent } from "@/components/ui/card"; // Not used
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Not used
// import { Message } from "@/types"; // Using FirebaseMessage directly
import { format } from "date-fns";
import { ArrowLeft, Send, Image as ImageIcon, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";

// Using FirebaseMessage as the primary message type
// interface ExtendedMessage extends FirebaseMessage {
//   // FirebaseMessage already includes common fields. Add specific UI ones if needed.
//   // imageUrl?: string; // This should come from FirebaseMessage if supported
//   // prescriptionUrl?: string; // This should come from FirebaseMessage if supported
// }


export default function DoctorChat() {
  const { id: patientSupabaseId } = useParams<{ id: string }>(); // This is the patient's Supabase ID
  const { user: doctorUser } = useAuth(); // This is the logged-in doctor
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<Profile | null>(null); // For patient's name, pic
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prescriptionInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<File | null>(null);
  // const [activeTab, setActiveTab] = useState<string>("chat"); // Not used in this component UI

  useEffect(() => {
    if (!doctorUser || !patientSupabaseId) {
      setLoading(false);
      return;
    }

    let unsubscribeFromMessages: (() => void) | undefined;

    const setupChat = async () => {
      try {
        setLoading(true);

        // 1. Fetch Patient Profile (for display purposes)
        const { data: patientData, error: patientError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientSupabaseId)
          .single();

        if (patientError || !patientData) {
          console.error("Error fetching patient profile:", patientError);
          toast({ title: "Error", description: "Could not load patient details.", variant: "destructive" });
          setLoading(false);
          return;
        }
        setPatientProfile(patientData as Profile);

        // 2. Get Firebase UIDs for doctor and patient
        const doctorFirebaseId = userMappingService.getFirebaseUserId(doctorUser.id);
        const patientFirebaseId = userMappingService.getFirebaseUserId(patientSupabaseId);

        if (!doctorFirebaseId || !patientFirebaseId) {
          console.error("Could not get Firebase UIDs for chat participants.");
          toast({ title: "Chat Error", description: "Failed to initialize chat IDs.", variant: "destructive" });
          setLoading(false);
          return;
        }
        
        console.log(`Setting up chat. Doctor Firebase ID: ${doctorFirebaseId}, Patient Firebase ID: ${patientFirebaseId}`);

        // 3. Listen to messages using FirebaseChatService
        unsubscribeFromMessages = firebaseChatService.listenToDoctorPatientMessages(
          doctorFirebaseId, // User1
          patientFirebaseId,  // User2
          (firebaseMessages) => {
            setMessages(firebaseMessages);
            // No need to setLoading(false) here if messages initially load fast
          }
        );

        // 4. Mark messages as read
        // Doctor (current user) is reading messages sent by patient
        await firebaseChatService.markMessagesAsRead(doctorFirebaseId, patientFirebaseId);

      } catch (err) {
        console.error("Error setting up chat:", err);
        toast({ title: "Chat Setup Error", description: (err as Error).message, variant: "destructive" });
      } finally {
        // Initial loading is done after setup attempt
        // Further loading controlled by message stream if needed
        setLoading(false);
      }
    };

    setupChat();

    return () => {
      if (unsubscribeFromMessages) {
        unsubscribeFromMessages();
      }
    };
  }, [doctorUser, patientSupabaseId, toast]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) { // Only scroll if there are messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !doctorUser || !patientSupabaseId || !patientProfile) {
      toast({ title: "Cannot send", description: "Message is empty or user data is missing.", variant: "warning"});
      return;
    }
    
    const doctorFirebaseId = userMappingService.getFirebaseUserId(doctorUser.id);
    const patientFirebaseId = userMappingService.getFirebaseUserId(patientSupabaseId);

    if (!doctorFirebaseId || !patientFirebaseId) {
      toast({ title: "Error", description: "Could not resolve user IDs for sending message.", variant: "destructive"});
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    try {
      // Optimistic UI update (optional, but good for UX)
      // const optimisticMessage: FirebaseMessage = { ... };
      // setMessages(prev => [...prev, optimisticMessage]);

      await firebaseChatService.sendDoctorPatientMessage(
        doctorFirebaseId, // sender
        patientFirebaseId,  // receiver
        messageContent,
        doctorUser.name || doctorUser.email || "Doctor", // Sender's name
        doctorUser.role as 'doctor' | 'patient' // Sender's role
      );
      console.log("Message sent via FirebaseChatService.");

    } catch (err) {
      console.error("Error sending message via FirebaseChatService:", err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setNewMessage(messageContent); // Restore message on error
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
    return (
      <div 
        className="flex h-screen items-center justify-center text-white"
        style={{ background: 'linear-gradient(135deg, #005A7A, #002838)' }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'linear-gradient(135deg, #005A7A, #002838)' }}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm shadow px-4 py-3 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/10"
          onClick={goBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser?.profilePic} />
          <AvatarFallback className="bg-teal-500 text-white">
            {otherUser?.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold text-white">{otherUser?.full_name}</h2>
          <p className="text-sm text-white/70">{otherUser?.role === 'patient' ? 'Patient' : 'Doctor'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/70">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  message.sender_id === user?.id
                    ? 'bg-teal-500 text-white'
                    : 'bg-white/10 backdrop-blur-sm text-white'
                }`}
              >
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="Shared"
                    className="rounded-lg mb-2 max-w-full"
                  />
                )}
                {message.prescriptionUrl && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-white/10 rounded">
                    <FileText className="h-5 w-5" />
                    <span>Prescription</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.sender_id === user?.id ? 'text-white/70' : 'text-white/50'
                }`}>
                  {format(new Date(message.timestamp), 'HH:mm')}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 bg-white/10 backdrop-blur-sm">
        <div className="flex gap-2 items-end">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none bg-white/90 backdrop-blur-sm"
            rows={1}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handleImageClick}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handlePrescriptionClick}
            >
              <FileText className="h-5 w-5" />
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600"
              onClick={sendMessage}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Selected files preview */}
        <div className="flex gap-2 mt-2">
          {selectedImage && (
            <div className="relative">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected"
                className="h-16 w-16 object-cover rounded"
              />
              <button
                onClick={removeSelectedImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {selectedPrescription && (
            <div className="relative flex items-center bg-white/10 rounded p-2">
              <FileText className="h-5 w-5 text-white mr-2" />
              <span className="text-white text-sm">{selectedPrescription.name}</span>
              <button
                onClick={removeSelectedPrescription}
                className="ml-2 text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={prescriptionInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handlePrescriptionFileChange}
        />
      </div>

      <BottomNavigation />
    </div>
  );
}