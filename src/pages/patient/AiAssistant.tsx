
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Bot, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";

// Mock AI responses for demonstration
const mockResponses = [
  "Based on your symptoms, it could be a common cold. Rest and stay hydrated.",
  "Your symptoms might indicate seasonal allergies. Consider taking an antihistamine.",
  "It sounds like you might have the flu. You should rest and consult with a doctor if symptoms worsen.",
  "These symptoms could be related to stress. Try some relaxation techniques and get plenty of sleep.",
  "This might be a bacterial infection. I recommend speaking with your doctor about antibiotics."
];

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

  const handleSend = () => {
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
    
    // Simulate AI typing
    setIsTyping(true);
    
    // Random delay to simulate thinking
    setTimeout(() => {
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      const newAiMessage: Message = {
        id: messages.length + 2,
        content: randomResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newAiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
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
          This is a demo AI assistant using mock responses. In a real app, it would connect to an AI service.
        </p>
      </div>
      
      <BottomNavigation />
    </div>
  );
  
  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
