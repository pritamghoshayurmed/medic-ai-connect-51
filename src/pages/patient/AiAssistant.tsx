import { useState } from "react";
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

    // Add user message
    const newUserMessage: Message = {
      id: messages.length + 1,
      content: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInput("");
    
    // Show AI typing indicator
    setIsTyping(true);
    
    try {
      // Call the actual AI service
      const response = await askMedicalQuestion(input);
      
      const newAiMessage: Message = {
        id: messages.length + 2,
        content: response.answer,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error: any) {
      // Show error in chat
      const errorMessage: Message = {
        id: messages.length + 2,
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive"
      });
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
