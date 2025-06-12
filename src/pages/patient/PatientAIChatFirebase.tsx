import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { firebaseAIChatService, AIChatMessage, AIChatSession } from "@/services/firebaseAIChatService";
import {
  Bot, Send, Mic, Heart, MessageSquare, Menu, PlusCircle, Share, Stethoscope
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import BottomNavigation from "@/components/BottomNavigation";
import { format } from 'date-fns';

export default function PatientAIChatFirebase() {
  // Component state variables
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Firebase AI Chat state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<AIChatSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Speech recognition setup
  const recognitionRef = useRef<any>(null);

  // Initialize Firebase AI chat session
  useEffect(() => {
    if (user && messages.length === 0) {
      const sessionId = firebaseAIChatService.initializeSession(user.id);
      setCurrentSessionId(sessionId);
      setMessages(firebaseAIChatService.getCurrentMessages());
      console.log('AI chat session initialized for user:', user.id);
    }
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message to AI
  const sendMessage = async (messageText?: string) => {
    if (isLoading || !user) return;

    const message = messageText || input;
    if (!message.trim()) return;

    setInput("");
    setIsLoading(true);

    try {
      // Initialize session if needed
      if (!currentSessionId) {
        const sessionId = firebaseAIChatService.initializeSession(user.id);
        setCurrentSessionId(sessionId);
        setMessages(firebaseAIChatService.getCurrentMessages());
      }

      // Send message to Firebase AI service
      await firebaseAIChatService.sendMessage(user.id, message);
      
      // Update local messages
      setMessages(firebaseAIChatService.getCurrentMessages());

      console.log("AI response received successfully");

    } catch (error: any) {
      console.error("Error:", error);
      setErrorMessage(`AI Error: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 5000);

    } finally {
      setIsLoading(false);
    }
  };

  // Load chat history
  const loadChatHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    
    try {
      const history = await firebaseAIChatService.getChatHistory(user.id);
      setChatHistory(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load a specific chat session
  const loadChatSession = async (session: AIChatSession) => {
    try {
      const messages = await firebaseAIChatService.loadSession(user!.id, session.id);
      setMessages(messages);
      setCurrentSessionId(session.id);
      
      toast({
        title: "Chat Loaded",
        description: `Loaded chat: ${session.summary}`,
      });
    } catch (error) {
      console.error('Error loading chat session:', error);
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive"
      });
    }
  };

  // Start new chat
  const startNewChat = () => {
    if (!user) return;
    
    const sessionId = firebaseAIChatService.initializeSession(user.id);
    setCurrentSessionId(sessionId);
    setMessages(firebaseAIChatService.getCurrentMessages());
    
    toast({
      title: "New Chat Started",
      description: "Started a new conversation with Kabiraj AI",
    });
  };

  // Speech recognition functions
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      toast({
        title: "Speech Recognition Error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive"
      });
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Share with doctor
  const shareWithDoctor = () => {
    const summary = firebaseAIChatService.getConversationSummary();
    
    if (summary === 'No conversation to share.') {
      toast({
        title: "Nothing to Share",
        description: "Start a conversation first before sharing with a doctor.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to doctor selection or create a shareable link
    navigate('/patient/share-chat', { 
      state: { 
        chatSummary: summary,
        sessionId: currentSessionId 
      } 
    });
  };

  // Format AI message content
  const formatAIMessage = (content: string) => {
    if (!content) return null;

    // Replace **text** with bold text
    let formattedText = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace *text* with italic text
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace numbered lists
    formattedText = formattedText.replace(/(\d+\.\s)/g, '<br/>$1');
    
    // Replace bullet points
    formattedText = formattedText.replace(/•\s/g, '<br/>• ');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  // Process vitals data if redirected from vitals page
  useEffect(() => {
    if (location.state?.vitalsData) {
      const { vitalsData, vitalsType } = location.state;
      
      let vitalsMessage = "";
      
      if (vitalsType === 'bp') {
        vitalsMessage = `I just measured my blood pressure and it's ${vitalsData.systolic}/${vitalsData.diastolic} mmHg`;
        if (vitalsData.pulse) {
          vitalsMessage += ` with a pulse of ${vitalsData.pulse} bpm`;
        }
      } else if (vitalsType === 'heart_rate') {
        vitalsMessage = `I just measured my heart rate and it's ${vitalsData.bpm} beats per minute`;
      } else if (vitalsType === 'temperature') {
        vitalsMessage = `I just measured my body temperature and it's ${vitalsData.temperature}°C`;
      } else if (vitalsType === 'oxygen') {
        vitalsMessage = `I just measured my oxygen saturation and it's ${vitalsData.spo2}%`;
      }
      
      if (vitalsMessage) {
        // Send the vitals message
        setTimeout(() => {
          sendMessage(vitalsMessage);
        }, 500);
        
        // Clear location state to prevent duplicate messages
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, navigate]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white border-b border-white/10">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <button 
                className="mr-3 hover:bg-white/10 p-2 rounded-full transition"
                onClick={() => {
                  if (user && !loadingHistory) {
                    loadChatHistory();
                  }
                }}
              >
                <Menu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#004953] text-white border-r border-white/10">
              <SheetHeader>
                <SheetTitle className="text-white text-xl">Chat History</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {loadingHistory ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00C389]"></div>
                  </div>
                ) : chatHistory.length > 0 ? (
                  <div className="space-y-3">
                    {chatHistory.map((session) => (
                      <div 
                        key={session.id}
                        className="p-3 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition"
                        onClick={() => loadChatSession(session)}
                      >
                        <h3 className="font-medium text-white truncate">{session.summary}</h3>
                        <p className="text-xs text-white/70 mt-1">
                          {format(new Date(session.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-white/70">
                    <p>No previous chats found</p>
                  </div>
                )}
                <button 
                  className="w-full mt-4 py-2 px-4 rounded-lg bg-[#00C389] text-white flex items-center justify-center"
                  onClick={startNewChat}
                >
                  <PlusCircle size={18} className="mr-2" />
                  New Chat
                </button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-semibold">Kabiraj AI</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-2 rounded-full hover:bg-white/10 transition"
                  onClick={() => navigate('/patient/vitals')}
                >
                  <Stethoscope size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Check Vitals</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-2 rounded-full hover:bg-white/10 transition"
                  onClick={shareWithDoctor}
                >
                  <Share size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share with Doctor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`max-w-[80%] ${message.role === 'user' ? 'self-end' : 'self-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex items-center mb-1 ml-1">
                <div className="w-6 h-6 rounded-full bg-[#00C389] flex items-center justify-center mr-1">
                  <Bot size={14} color="white" />
                </div>
                <span className="text-xs text-white/70">Kabiraj AI</span>
              </div>
            )}
            
            <div 
              className={`p-3 rounded-2xl shadow-md ${
                message.role === 'user' 
                  ? 'bg-[#00C389] text-white rounded-tr-none'
                  : 'bg-white text-gray-800 rounded-tl-none'
              }`}
            >
              {message.role === 'assistant' 
                ? formatAIMessage(message.content) 
                : message.content}
              <div className="text-xs mt-2 text-right opacity-70">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {message.role === 'user' && (
              <div className="flex justify-end mt-1 mr-1">
                <span className="text-xs text-white/70">You</span>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="self-start max-w-[80%]">
            <div className="flex items-center mb-1 ml-1">
              <div className="w-6 h-6 rounded-full bg-[#00C389] flex items-center justify-center mr-1">
                <Bot size={14} color="white" />
              </div>
              <span className="text-xs text-white/70">Kabiraj AI</span>
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-md text-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#003840] p-4 border-t border-white/10">
        <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden">
          <button 
            className={`p-3 transition ${isListening ? 'text-red-500' : 'text-gray-500'}`}
            onClick={isListening ? stopListening : startListening}
          >
            <Mic size={20} />
          </button>
          
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 py-3 px-2 focus:outline-none text-gray-800"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage();
                }
              }
            }}
          />
          
          <button 
            className={`p-3 ${input.trim() ? 'text-[#00C389]' : 'text-gray-300'}`}
            onClick={() => {
              if (input.trim()) {
                sendMessage();
              }
            }}
            disabled={!input.trim()}
          >
            <Send size={20} />
          </button>
        </div>
        
        <div className="flex justify-center mt-3 space-x-4">
          <button 
            className="flex flex-col items-center justify-center text-xs text-white/70 hover:text-white transition"
            onClick={() => navigate('/patient/vitals')}
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
              <Heart size={16} />
            </div>
            <span>Vitals</span>
          </button>
          
          <button 
            className="flex flex-col items-center justify-center text-xs text-white/70 hover:text-white transition"
            onClick={shareWithDoctor}
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
              <MessageSquare size={16} />
            </div>
            <span>Ask Doctor</span>
          </button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-24 left-0 right-0 mx-auto w-[90%] max-w-md bg-red-500 text-white p-3 rounded-lg shadow-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
