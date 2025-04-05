import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Bot, X, Image, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import { askMedicalQuestion, analyzeImage } from "@/services/doctorAiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "@/components/ImageUploader";
import AnalysisResults from "@/components/AnalysisResults";

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
          <TabsTrigger value="image" className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            <span>Image Analysis</span>
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
            <p className="text-xs text-gray-500 text-center mt-2">
              This AI assistant uses Google's Gemini AI to provide medical information. Always consult a healthcare professional for medical advice.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="image" className="flex-1 overflow-y-auto p-4">
          {!analysisResult ? (
            <div className="h-full flex flex-col items-center justify-center">
              <ImageUploader onUpload={handleImageUpload} isLoading={isAnalyzing} />
              <p className="text-sm text-gray-500 mt-4 text-center max-w-md">
                Upload a medical image for AI analysis. This can include X-rays, skin conditions, rashes, or other visible medical conditions.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAnalysisResult(null)}
                >
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              </div>
              <AnalysisResults analysis={analysisResult} />
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <BottomNavigation />
    </div>
  );
  
  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
