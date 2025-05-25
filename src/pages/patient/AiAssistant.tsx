import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Bot, X, Image, MessageSquare, Share2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import { askMedicalQuestion, analyzeImage } from "@/services/doctorAiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "@/components/ImageUploader";
import AnalysisResults from "@/components/AnalysisResults";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AiAssistant() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm your medical AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistoryId, setChatHistoryId] = useState<string | null>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Added isSaving state
  const [suggestions] = useState([
    "I have a headache",
    "My throat hurts",
    "I have a fever",
    "I feel tired all the time",
    "I have a rash"
  ]);
  
  // Image analysis state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (user && user.id) {
        try {
          const { data, error } = await supabase
            .from("ai_chat_history")
            .select("id, messages") // Select id along with messages
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          if (data && data.messages) {
            if (typeof data.id === 'string' && data.id.length > 0) {
              setChatHistoryId(data.id); // Store the loaded record's ID
            } else {
              console.warn("Fetched chat history record has invalid or missing ID. Setting chatHistoryId to null.", data);
              setChatHistoryId(null);
            }
            const historyMessages = (data.messages as Array<{ role: string, content: string, timestamp: string }>).map(
              (msg, index) => ({
                id: Date.now() + index, 
                content: msg.content,
                isUser: msg.role === "user",
                timestamp: new Date(msg.timestamp),
              })
            );
            if (historyMessages.length > 0) {
              setMessages(historyMessages);
            }
          }
        } catch (err) {
          console.error("Error fetching chat history:", err);
          toast({
            title: "Error",
            description: "Could not load previous chat history.",
            variant: "destructive",
          });
        } finally {
          setIsHistoryLoaded(true); // Indicate loading process completed
        }
      } else {
        setIsHistoryLoaded(true); // Also set if no user, to unblock saving logic if needed (e.g. guest mode later)
      }
    };

    fetchChatHistory();
  }, [user, toast]);

  const saveChatHistory = useCallback(async (
    messagesToSave: Message[], 
    currentHistoryIdFromCaller: string | null
  ): Promise<string | null> => {
    if (!user || !user.id) {
      console.warn("User not found, skipping save chat history.");
      return null;
    }

    if (isSaving) {
      console.log("Save already in progress, skipping redundant save call.");
      // Return the ID that was intended for this operation, or the component's current one as fallback
      return currentHistoryIdFromCaller || chatHistoryId; 
    }
    setIsSaving(true);

    const transformedMessages = messagesToSave.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    }));

    console.log('Attempting to save chat history. Using History ID from caller:', currentHistoryIdFromCaller, 'Messages to save:', transformedMessages.length, 'First message content:', transformedMessages[0]?.content);

    try {
      if (currentHistoryIdFromCaller) { // Use passed ID for decision
        // Update existing record
        const { error } = await supabase
          .from('ai_chat_history')
          .update({ messages: transformedMessages, updated_at: new Date().toISOString() })
          .eq('id', currentHistoryIdFromCaller); // Use passed ID for eq
        if (error) throw error;
        return currentHistoryIdFromCaller; // Return passed ID on successful update
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('ai_chat_history')
          .insert([{ 
            user_id: user.id, 
            messages: transformedMessages, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          }])
          .select('id'); // Select the id of the newly inserted row
        
        if (error) throw error;

        if (data && data.length > 0 && data[0].id) {
          setChatHistoryId(data[0].id); // Update component state for future operations
          return data[0].id; // Return new ID on successful insert
        }
        return null; 
      }
    } catch (error: any) { // Ensure 'error' is typed as 'any' or 'unknown' for property access
      console.error("Error saving chat history:", error); // Original console log
      console.error('Supabase save error:', error); // Specific Supabase error log
      
      let detailedErrorMessage = "Failed to save chat history. Please try again."; // Default
      if (error && typeof error.message === 'string') {
        detailedErrorMessage = `Failed to save chat history: ${error.message}`;
      } else if (error && typeof (error as any).error_description === 'string') { // Some Supabase errors have this
        detailedErrorMessage = `Failed to save chat history: ${(error as any).error_description}`;
      } else if (typeof error === 'string') {
        detailedErrorMessage = `Failed to save chat history: ${error}`;
      }
      
      toast({
        title: "Error Saving Chat", // Slightly more specific title
        description: detailedErrorMessage, // Display the detailed error
        variant: "destructive",
        duration: 10000 // Increase duration to allow time to read/copy
      });
      return null; 
    } finally {
      setIsSaving(false); 
    }
  }, [user, supabase, toast, isSaving, setIsSaving, setChatHistoryId, chatHistoryId]); // chatHistoryId kept for the isSaving return case

  useEffect(() => {
    if (!isHistoryLoaded || !user || !user.id || isSaving) { 
      return; 
    }
    
    if (
      messages.length === 1 &&
      messages[0].id === 1 && 
      messages[0].content === "Hello! I'm your medical AI assistant. How can I help you today?" &&
      !chatHistoryId 
    ) {
      return;
    }

    if (messages.length > 0) {
      // Call with component's current chatHistoryId state for general saves
      saveChatHistory(messages, chatHistoryId); 
    }
  }, [messages, isHistoryLoaded, user, chatHistoryId, saveChatHistory, isSaving]);
  
  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  // Load doctors for sharing
  const fetchDoctors = async () => {
    if (loadingDoctors) return;
    
    try {
      setLoadingDoctors(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          doctor_profiles(*)
        `)
        .eq('role', 'doctor');
        
      if (error) {
        console.error("Error fetching doctors:", error);
        throw error;
      }
      
      setAvailableDoctors(data.map(doc => ({
        id: doc.id,
        name: doc.full_name || 'Dr. Unknown',
        specialty: doc.doctor_profiles?.[0]?.specialty || 'General Practitioner',
        profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
      })));
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive"
      });
    } finally {
      setLoadingDoctors(false);
    }
  };
  
  // Share summary with doctor
  const handleShareWithDoctor = async () => {
    if (!selectedDoctorId) {
      toast({
        title: "No doctor selected",
        description: "Please select a doctor to share with.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let summaryContent = '';
      
      if (activeTab === 'chat') {
        // Create a summary from the chat
        const userMessages = messages.filter(m => m.isUser).map(m => m.content);
        const aiResponses = messages.filter(m => !m.isUser).map(m => m.content);
        
        summaryContent = `Chat Summary:\n\nUser Questions:\n${userMessages.join('\n')}\n\nAI Responses:\n${aiResponses.join('\n')}`;
      } else if (activeTab === 'image' && analysisResult) {
        // Create a summary from the image analysis
        summaryContent = `Image Analysis Results:\n\n${analysisResult.description}\n\nPossible Conditions: ${analysisResult.conditions.join(', ')}\n\nRecommendations: ${analysisResult.recommendations.join(', ')}`;
      }
      
      // Send message to the doctor with the summary
      await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedDoctorId,
          content: summaryContent,
          read: false
        });
      
      toast({
        title: "Summary shared",
        description: "The summary has been shared with the selected doctor.",
      });
      
      setShareDialogOpen(false);
    } catch (error) {
      console.error("Error sharing summary:", error);
      toast({
        title: "Error",
        description: "Failed to share summary with doctor",
        variant: "destructive"
      });
    }
  };
  
  // Open share dialog and load doctors
  const openShareDialog = () => {
    fetchDoctors();
    setShareDialogOpen(true);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    let operationSpecificHistoryId: string | null = chatHistoryId; // Use current state as starting point

    // 1. Prepare user message
    const newUserMessage: Message = {
      id: Date.now(), 
      content: input,
      isUser: true,
      timestamp: new Date()
    };
    const messagesWithUser = [...messages, newUserMessage];
    
    // 2. Update UI with user message immediately
    setMessages(messagesWithUser);
    const currentInput = input; 
    setInput("");
    setIsTyping(true);

    // 3. Attempt to save after user message, update operationSpecificHistoryId
    operationSpecificHistoryId = await saveChatHistory(messagesWithUser, operationSpecificHistoryId); 

    try {
      // 4. Get AI response
      const conversationHistoryForAI = messagesWithUser.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content,
      }));
      const response = await askMedicalQuestion(currentInput, conversationHistoryForAI); // Use stored input
      
      const newAiMessage: Message = {
        id: Date.now() + 1, // Unique ID
        content: response.answer,
        isUser: false,
        timestamp: new Date()
      };
      const messagesWithAI = [...messagesWithUser, newAiMessage];

      // 5. Update UI with AI message
      setMessages(messagesWithAI);

      // 6. Attempt to save after AI message, using the potentially updated operationSpecificHistoryId
      await saveChatHistory(messagesWithAI, operationSpecificHistoryId);

    } catch (error: any) {
      console.error("Error getting AI response:", error);
      const errorMessageContent = `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`;
      const errorMessage: Message = {
        id: Date.now() + 2, 
        content: errorMessageContent,
        isUser: false,
        timestamp: new Date()
      };
      
      const messagesWithError = [...messagesWithUser, errorMessage];
      setMessages(messagesWithError); 
      
      toast({ 
        title: "AI Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive"
      });
      
      // Attempt to save conversation even if AI errored, using the potentially updated operationSpecificHistoryId
      await saveChatHistory(messagesWithError, operationSpecificHistoryId); 
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const result = await analyzeImage(file);
      setAnalysisResult(result);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze image",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="pb-24 h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">AI Health Assistant</h1>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="doctor" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Chat with Doctor</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col">
          {/* Chat Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[75%] rounded-2xl p-3 ${
                    message.isUser 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-gray-100 rounded-tl-none"
                  }`}
                >
                  {!message.isUser && (
                    <div className="flex items-center mb-2">
                      <Bot className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-bold">AI Assistant</span>
                    </div>
                  )}
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${message.isUser ? "text-white/70" : "text-gray-500"}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3">
                  <div className="flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-bold">AI Assistant</span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Suggestions */}
          <div className="px-4 my-2">
            <div className="flex overflow-x-auto gap-2 pb-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="whitespace-nowrap text-sm"
                  onClick={() => useSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-grow"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                This AI assistant uses Google's Gemini AI to provide medical information. Always consult a healthcare professional for medical advice.
              </p>
              {messages.length > 1 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openShareDialog}
                  className="ml-2 whitespace-nowrap flex-shrink-0"
                >
                  <Share2 className="h-4 w-4 mr-1" /> Share with Doctor
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="doctor" className="flex-1 overflow-y-auto p-4">
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center max-w-md space-y-4">
              <div className="p-3 mx-auto bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Connect with a Doctor</h3>
              <p className="text-sm text-gray-500">
                Chat with a healthcare professional about your symptoms, get medical advice, or schedule an appointment.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => navigate('/patient/find-doctor')}
                >
                  Find a Doctor
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-gray-50 text-primary border-primary hover:bg-gray-100"
                  onClick={() => navigate('/patient/appointments')}
                >
                  My Appointments
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Share with Doctor Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share with Doctor</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="mb-3 font-medium">Select a doctor:</h3>
            {loadingDoctors ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableDoctors.map(doctor => (
                  <div 
                    key={doctor.id}
                    className={`p-3 rounded-md border cursor-pointer hover:bg-gray-50 ${selectedDoctorId === doctor.id ? 'bg-primary/10 border-primary' : ''}`}
                    onClick={() => setSelectedDoctorId(doctor.id)}
                  >
                    <div className="flex items-center gap-3">
                      {doctor.profilePic ? (
                        <img src={doctor.profilePic} alt={doctor.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-gray-500">{doctor.specialty}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {availableDoctors.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No doctors available</p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleShareWithDoctor} disabled={!selectedDoctorId || loadingDoctors}>
              Share Summary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
  
  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
