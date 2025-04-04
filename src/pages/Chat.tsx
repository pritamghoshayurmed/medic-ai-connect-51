
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Paperclip, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  isAI?: boolean;
}

// Mock doctor and patient IDs
const MOCK_DOCTOR_ID = "doc1";
const MOCK_PATIENT_ID = "pat1";
const MOCK_AI_ID = "ai";

// Mock messages
const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hello, how can I help you today?",
    senderId: MOCK_DOCTOR_ID,
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: "2",
    content: "I've been having headaches and dizziness for the past few days.",
    senderId: MOCK_PATIENT_ID,
    timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 mins ago
  },
  {
    id: "3",
    content: "I'm sorry to hear that. How severe are the headaches and how long do they last?",
    senderId: MOCK_DOCTOR_ID,
    timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 mins ago
  },
];

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [receiverName, setReceiverName] = useState("Dr. Sarah Johnson");
  const [isAIChat, setIsAIChat] = useState(false);

  useEffect(() => {
    // Check if this is an AI chat
    if (id === "ai") {
      setIsAIChat(true);
      setReceiverName("AI Health Assistant");
      
      // Set initial AI greeting if there are no messages
      if (messages.length === 0) {
        setMessages([
          {
            id: "ai1",
            content: "Hello! I'm your AI health assistant. How can I help you today?",
            senderId: MOCK_AI_ID,
            timestamp: new Date(),
            isAI: true,
          },
        ]);
      }
    }
  }, [id, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: user?.id || MOCK_PATIENT_ID,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setNewMessage("");

    // Simulate response for demo
    setTimeout(() => {
      let responseMessage: Message;
      
      if (isAIChat) {
        responseMessage = {
          id: (Date.now() + 1).toString(),
          content: getAIResponse(newMessage),
          senderId: MOCK_AI_ID,
          timestamp: new Date(),
          isAI: true,
        };
      } else {
        responseMessage = {
          id: (Date.now() + 1).toString(),
          content: "I'll look into this and get back to you soon. Is there anything else you'd like to add?",
          senderId: id || MOCK_DOCTOR_ID,
          timestamp: new Date(),
        };
      }
      
      setMessages((prev) => [...prev, responseMessage]);
    }, 1000);
  };

  // Simple AI response generator for demo
  const getAIResponse = (message: string): string => {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes("headache") || messageLower.includes("head") || messageLower.includes("pain")) {
      return "Based on your description, you might be experiencing tension headaches. I recommend rest, staying hydrated, and taking over-the-counter pain relievers if needed. If symptoms persist for more than 3 days, please consult with a doctor.";
    } else if (messageLower.includes("fever") || messageLower.includes("temperature")) {
      return "Fever can be a sign of infection. Make sure to stay hydrated and rest. If your temperature is above 102°F (38.9°C) or persists for more than 3 days, please seek medical attention.";
    } else if (messageLower.includes("cold") || messageLower.includes("flu") || messageLower.includes("cough")) {
      return "For cold and flu symptoms, rest and proper hydration are key. Over-the-counter medications can help manage symptoms. If you experience difficulty breathing or symptoms worsen, please consult a healthcare professional.";
    } else {
      return "I understand your concern. Based on the information provided, I recommend consulting with a healthcare professional for a proper diagnosis. Would you like me to help you find a doctor?";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <div className="flex-grow">
          <h1 className="text-lg font-bold">{receiverName}</h1>
          <p className="text-sm text-white text-opacity-80">
            {isAIChat ? "AI Health Assistant" : "Available"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => {
          const isUserMessage = message.senderId === user?.id || message.senderId === MOCK_PATIENT_ID;
          
          return (
            <div
              key={message.id}
              className={cn(
                "max-w-[80%] mb-4",
                isUserMessage ? "ml-auto" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-lg",
                  isUserMessage
                    ? "bg-primary text-white rounded-tr-none"
                    : message.isAI
                    ? "bg-blue-100 text-blue-900 rounded-tl-none"
                    : "bg-white text-gray-800 rounded-tl-none shadow"
                )}
              >
                <p>{message.content}</p>
              </div>
              <p className={cn(
                "text-xs mt-1",
                isUserMessage ? "text-right" : "text-left",
                "text-gray-500"
              )}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Paperclip />
          </Button>
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            className="mx-2"
          />
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Mic />
          </Button>
          <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
}
