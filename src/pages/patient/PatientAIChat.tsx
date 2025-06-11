import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { askMedicalQuestion } from "@/services/doctorAiService";
import { supabase, rawSupabase } from "@/integrations/supabase/client";
import { Bot, X, ChevronLeft, MessageSquare, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";

// Interface definitions
interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistoryItem {
  id: string;
  date: Date;
  summary: string;
  messages: Message[];
  conversationHistory?: any[];
}

interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function PatientAIChat() {
  // Component state variables
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Chat state
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm Kabiraj, your medical assistant. What symptom is troubling you the most?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Chat history state
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasLoadedInitialHistory, setHasLoadedInitialHistory] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("ai-chat");
  
  // Doctor chats state
  const [doctorChats, setDoctorChats] = useState<ChatRoom[]>([]);
  const [loadingDoctorChats, setLoadingDoctorChats] = useState(false);
  
  // Conversation history for AI
  const [conversationHistory, setConversationHistory] = useState([
    {
      role: "user",
      content: `You are an AI-powered medical assistant named Kaviraj AI. 
      give the response in the same language it was asked by the user, like if in Bengali the response should be in Bengali. For other languages response should be in that language. Your goal is to provide fast and accurate medical diagnosis with minimal questions. Follow these rules:
      1. Start with one open-ended question: "What symptom is troubling you the most?"
      2. Use a decision-tree approach with a maximum of 5 precise questions to narrow down the diagnosis.
      3. Provide a probable diagnosis in 3-4 questions(do not ask too much question give answer after mostly 3,4 questions ). If uncertain, suggest consulting a doctor.
      4. Offer treatment options in a clear, structured format:
         - Modern Medicine: Drug name (dosage), key advice.
         - Ayurveda: Natural remedies & lifestyle suggestions.
      5. Communicate with empathy and clarity. Avoid medical jargon, Try to give answer in way a patient can easily understand.
      6. Respect patient autonomy and handle uncertainty honestly.
      7. If anything that is not related to your medical field. Say you are for medical diagnosis only and Dont have expertise in other domain`
    },
    {
      role: "model",
      content: "Hello! I'm Kabiraj, your medical assistant. What symptom is troubling you the most?"
    }
  ]);

  // Speech recognition setup - simplify by using any type
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition with proper type casting
  useEffect(() => {
    // Check for browser support of speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // Use type assertion with any to avoid TS errors
      const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          
          setInput(transcript);
          stopListening();
          sendMessage(transcript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          setErrorMessage(`Voice input error: ${event.error}`);
          setTimeout(() => setErrorMessage(""), 3000);
          stopListening();
        };
        
        recognitionRef.current.onend = () => {
          stopListening();
        };
      }
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Load AI chat history
  useEffect(() => {
    if (user && showHistory) {
      fetchChatHistory();
    }
  }, [user, showHistory]);

  // Add event listener to save chat when the component unmounts or when app goes to background
  useEffect(() => {
    // Function to save chat data
    const saveData = async () => {
      try {
        if (user && messages.length > 1) {
          console.log("Saving chat before unmount/blur");
          await saveChatToHistory();
        }
      } catch (error) {
        console.error("Error saving chat on unmount/blur:", error);
      }
    };
    
    // Add event listeners for mobile scenarios
    window.addEventListener('beforeunload', saveData);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        saveData();
      }
    });
    
    // For mobile devices specifically
    window.addEventListener('pagehide', saveData);
    
    // Cleanup function
    return () => {
      // Save the chat history if there are meaningful messages
      saveData();
      
      // Remove event listeners
      window.removeEventListener('beforeunload', saveData);
      window.removeEventListener('visibilitychange', saveData);
      window.removeEventListener('pagehide', saveData);
    };
  }, [user, messages, conversationHistory]);

  // Load chat history when component mounts to avoid repetitive greeting
  useEffect(() => {
    if (user && !hasLoadedInitialHistory) {
      loadMostRecentChat();
    }
  }, [user]);

  // Load the most recent chat automatically on startup
  const loadMostRecentChat = async () => {
    if (!user) return;
    
    try {
      console.log("Loading most recent chat on startup...");
      setLoadingHistory(true);
      
      // Get the most recent chat
      const { data, error } = await rawSupabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Parse the chat data
        const item = data[0];
        let parsedMessages: Message[] = [];
        let parsedConversationHistory = null;
        
        try {
          // Safely parse the JSON data
          parsedMessages = item.messages ? JSON.parse(item.messages) : [];
          
          if (item.conversation_history) {
            parsedConversationHistory = JSON.parse(item.conversation_history);
            console.log(`Loaded recent chat with ${parsedConversationHistory.length} conversation history items`);
          }
          
          // Update state with the loaded chat
          if (parsedMessages.length > 0) {
            setMessages(parsedMessages);
          }
          
          if (parsedConversationHistory && parsedConversationHistory.length > 0) {
            // Keep the original system prompt and combine with the loaded conversation
            const systemPrompt = conversationHistory[0];
            const loadedConversation = [systemPrompt, ...parsedConversationHistory.slice(1)];
            setConversationHistory(loadedConversation);
          }
          
          console.log("Successfully loaded most recent chat");
        } catch (parseError) {
          console.error("Error parsing chat data:", parseError);
        }
      } else {
        console.log("No previous chat found, starting new conversation");
      }
      
      setHasLoadedInitialHistory(true);
    } catch (error) {
      console.error("Error loading most recent chat:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    if (isLoading) return;
    
    const message = messageText || input;
    if (!message.trim()) return;
    
    // Add user message to local state
    const newUserMessage: Message = {
      id: Date.now(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    
    // Update UI immediately with user message only
    const updatedMessagesWithUserOnly = [...messages, newUserMessage];
    setMessages(updatedMessagesWithUserOnly);
    setInput("");
    
    // Update conversation history with user message
    const updatedHistory = [...conversationHistory, { role: "user", content: message }];
    setConversationHistory(updatedHistory);
    
    setIsLoading(true);
    
    try {
      console.log("Processing message:", message);
      console.log("Conversation history:", JSON.stringify(updatedHistory));
      
      // Get AI response - pass the updated conversation history
      const response = await askMedicalQuestion(message, updatedHistory);
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: response.answer,
        isUser: false,
        timestamp: new Date()
      };
      
      // Update messages with both user and AI message
      const finalMessages = [...updatedMessagesWithUserOnly, aiMessage];
      const finalConversationHistory = [...updatedHistory, { role: "model", content: response.answer }];
      
      setMessages(finalMessages);
      setConversationHistory(finalConversationHistory);
      
      console.log("Final conversation history:", JSON.stringify(finalConversationHistory));
      
      // Explicitly save the chat to history after each meaningful exchange
      // This ensures the chat is stored in the database
      if (user) {
        try {
          console.log("Saving chat to database...");
          // Save immediately without setTimeout to ensure it's saved before any potential navigation
          await saveChatToHistory(finalMessages, finalConversationHistory);
          console.log("Chat saved successfully");
        } catch (saveError) {
          console.error("Error saving chat:", saveError);
          // Continue even if saving fails - we'll retry on component unmount
        }
      }
      
    } catch (error: any) {
      console.error("Error:", error);
      setErrorMessage(`API Error: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 5000);
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: "Sorry, I encountered an error connecting to the AI service. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }]);
      
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage("Voice input is not supported in this browser.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Speech recognition error:", error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
    setIsListening(false);
  };

  const generateReport = () => {
    if (messages.length <= 1) {
      setErrorMessage("Not enough conversation history to generate a report.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    sendToDoctor();
  };
  
  const sendToDoctor = async () => {
    if (!user || messages.length <= 1) {
      setErrorMessage("Not enough conversation to send to doctor.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    try {
      // First save the chat to history - this ensures it's stored in the database
      await saveChatToHistory();
      
      // Fetch doctors with whom the patient has appointments using a simpler approach
      const { data: appointmentsData, error: appointmentError } = await supabase
        .from('appointments')
        .select('doctor_id')
        .eq('patient_id', user.id)
        .eq('status', 'confirmed')
        .order('appointment_date', { ascending: true });
      
      if (appointmentError) {
        throw appointmentError;
      }
      
      // Get doctor IDs from appointments
      const doctorIds = appointmentsData?.map(a => a.doctor_id) || [];
      const uniqueDoctorIds = [...new Set(doctorIds)];
      
      // Create a list of doctors
      const doctorList: Array<{id: string, name: string}> = [];
      
      if (uniqueDoctorIds.length > 0) {
        // Fetch doctor details
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uniqueDoctorIds)
          .eq('role', 'doctor');
        
        if (doctorsError) throw doctorsError;
        
        if (doctorsData) {
          doctorsData.forEach(doctor => {
            doctorList.push({
              id: doctor.id,
              name: doctor.full_name || 'Unknown Doctor'
            });
          });
        }
      }
      
      // Prepare conversation summary
      const userMessages = messages.filter(m => m.isUser).map(m => m.content);
      
      // Create a summary text
      const summaryText = `AI Chat Summary: ${userMessages[0]?.substring(0, 40)}...`;
      
      // Navigate to doctor selection with the conversation data
      navigate('/patient/find-doctor', { 
        state: { 
          fromChat: true,
          chatSummary: JSON.stringify(messages),
          summaryText: summaryText,
          doctorList: doctorList.length > 0 ? doctorList : null
        } 
      });
      
      toast({
        title: "Success",
        description: doctorList.length > 0 
          ? "You can now select a doctor to send this conversation to" 
          : "No doctors with appointments found. You can still select any doctor.",
      });
      
    } catch (error) {
      console.error("Error preparing data for doctor:", error);
      toast({
        title: "Error",
        description: "Failed to prepare the chat for sending to doctor",
        variant: "destructive"
      });
    }
  };

  // Format AI messages for better display
  const formatAIMessage = (content: string) => {
    if (!content) return null;

    // Replace **text** with bold text
    let formattedText = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Add line breaks
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    // Format medicine sections
    formattedText = formattedText.replace(
      /(Modern Medicine|Ayurveda):/g, 
      '<h4 class="text-primary font-bold mt-2">$1:</h4>'
    );
    
    // Format list items with proper bullets
    formattedText = formattedText.replace(
      /^\s*-\s+(.*?)$/gm, 
      '<li class="ml-4 list-disc">$1</li>'
    );
    
    // Format numbered lists
    formattedText = formattedText.replace(
      /^\s*(\d+)\.\s+(.*?)$/gm, 
      '<li class="ml-4 list-decimal">$1. $2</li>'
    );
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };
  
  // Fetch chat history using the raw Supabase client
  const fetchChatHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    
    try {
      console.log("Fetching chat history from database...");
      
      // Using rawSupabase to avoid type issues
      const { data, error } = await rawSupabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Database error when fetching chat history:", error);
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} chat history sessions`);
      
      if (!data || data.length === 0) {
        setChatHistory([]);
        return;
      }
      
      // Format the chat history data
      const formattedHistory = data.map(item => {
        let parsedMessages: Message[] = [];
        let parsedConversationHistory = null;
        
        try {
          // Safely parse the JSON data
          parsedMessages = item.messages ? JSON.parse(item.messages) : [];
          
          if (item.conversation_history) {
            parsedConversationHistory = JSON.parse(item.conversation_history);
            console.log(`Chat ${item.id} has conversation history with ${parsedConversationHistory.length} messages`);
          } else {
            console.log(`Chat ${item.id} does not have saved conversation history`);
          }
        } catch (parseError) {
          console.error("Error parsing JSON data for chat history:", parseError);
          // Use empty arrays for failed parsing
          parsedMessages = [];
          parsedConversationHistory = null;
        }
        
        return {
          id: item.id,
          date: new Date(item.created_at),
          summary: item.summary || "Chat session",
          messages: parsedMessages,
          conversationHistory: parsedConversationHistory
        };
      });
      
      console.log("Successfully processed chat history data");
      setChatHistory(formattedHistory);
    } catch (error) {
      console.error("Error loading chat history:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadChatSession = (historyItem: ChatHistoryItem) => {
    console.log("Loading chat session:", historyItem.id);
    setMessages(historyItem.messages);
    
    // If the saved conversation history exists, use it
    if (historyItem.conversationHistory && historyItem.conversationHistory.length > 0) {
      console.log("Using saved conversation history with", historyItem.conversationHistory.length, "messages");
      setConversationHistory(historyItem.conversationHistory);
    } else {
      console.log("Reconstructing conversation history from messages");
      // Otherwise rebuild a basic conversation history from the messages
      const systemPrompt = {
        role: "user",
        content: conversationHistory[0].content // Keep the original system prompt
      };
      
      // Convert normal messages to the conversation history format
      const messageHistory = historyItem.messages.map(msg => ({
        role: msg.isUser ? "user" : "model",
        content: msg.content
      }));
      
      // Combine with the system prompt
      const reconstructedHistory = [systemPrompt, ...messageHistory];
      console.log("Reconstructed conversation history with", reconstructedHistory.length, "messages");
      
      setConversationHistory(reconstructedHistory);
    }
    
    setShowHistory(false);
  };

  // Update the saveChatToHistory function to accept optional parameters
  const saveChatToHistory = async (
    messagesToSave?: Message[], 
    conversationHistoryToSave?: Array<{role: string, content: string}>
  ) => {
    // Use provided values or current state
    const msgsToSave = messagesToSave || messages;
    const convHistoryToSave = conversationHistoryToSave || conversationHistory;
    
    if (!user || msgsToSave.length <= 1) {
      console.log("Not saving chat - no user or insufficient messages");
      return;
    }
    
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
      try {
        console.log(`Saving chat to database (attempt ${retryCount + 1})...`);
        
        // Extract a summary from the conversation
        const userMessages = msgsToSave.filter(m => m.isUser).map(m => m.content);
        
        // Get the first question as a summary
        const summary = userMessages[0]?.substring(0, 50) + "...";
        
        // Safely stringify the data before saving
        const messagesJson = JSON.stringify(msgsToSave);
        const conversationHistoryJson = JSON.stringify(convHistoryToSave);
        
        console.log("Chat data to save:", {
          messagesCount: msgsToSave.length,
          conversationHistoryCount: convHistoryToSave.length,
          summary,
          userId: user.id,
          firstUserMsg: userMessages[0]?.substring(0, 30)
        });
        
        // Save to database using rawSupabase to avoid type issues
        const { data, error } = await rawSupabase
          .from('ai_chat_history')
          .insert({
            user_id: user.id,
            messages: messagesJson,
            conversation_history: conversationHistoryJson,
            summary: summary,
            created_at: new Date().toISOString()
          })
          .select();
          
        if (error) {
          // If we get a table not found error, we need to create it
          if (error.message.includes('relation "ai_chat_history" does not exist')) {
            console.error('Table does not exist, attempting to create it');
            await createChatHistoryTable();
            // Continue to next retry after creating table
            retryCount++;
            continue;
          }
          throw error;
        }
        
        console.log(`Chat saved successfully to database. Record ID: ${data?.[0]?.id}`);
        
        // Only show toast when explicitly saving (not during background saves)
        if (!messagesToSave && !conversationHistoryToSave) {
          toast({
            title: "Success",
            description: "Chat saved to history",
          });
        }
        
        // Return success
        return true;
        
      } catch (error) {
        console.error(`Error saving chat (attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        // Wait before retrying (exponential backoff)
        if (retryCount < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, retryCount);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Only show toast when explicitly saving (not during background saves)
          if (!messagesToSave && !conversationHistoryToSave) {
            toast({
              title: "Error",
              description: "Failed to save chat to history",
              variant: "destructive"
            });
          }
          
          // Rethrow error to allow caller to handle it
          throw error;
        }
      }
    }
  };

  // Helper function to create the chat history table if it doesn't exist
  const createChatHistoryTable = async () => {
    try {
      // Try to create the table structure
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.ai_chat_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          messages JSONB NOT NULL,
          conversation_history JSONB,
          summary TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add RLS policies if they don't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'ai_chat_history' AND policyname = 'Users can view their own chat history'
          ) THEN
            ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Users can view their own chat history" 
              ON public.ai_chat_history FOR SELECT 
              USING (auth.uid() = user_id);
            
            CREATE POLICY "Users can insert their own chat history" 
              ON public.ai_chat_history FOR INSERT 
              WITH CHECK (auth.uid() = user_id);
          END IF;
        END $$;
      `;
      
      console.log("Attempting to create ai_chat_history table");
      await rawSupabase.rpc('exec_sql', { sql: createTableSQL });
      console.log("Table creation appears successful");
      return true;
    } catch (e) {
      console.error('Error creating table via RPC:', e);
      return false;
    }
  };

  // Load doctor chats
  useEffect(() => {
    if (user && activeTab === "doctor-chat") {
      fetchDoctorChats();
    }
  }, [user, activeTab]);

  // Fetch doctor chat rooms
  const fetchDoctorChats = async () => {
    if (!user) return;
    
    setLoadingDoctorChats(true);
    
    try {
      // Get chat rooms where the current user is involved
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          timestamp,
          read,
          sender_id,
          sender:profiles!messages_sender_id_fkey(id, full_name, role),
          receiver_id,
          receiver:profiles!messages_receiver_id_fkey(id, full_name, role)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('timestamp', { ascending: false });
        
      if (error) throw error;
      
      if (!data) {
        setDoctorChats([]);
        return;
      }
      
      // Process the messages to get unique chat rooms
      const messagesByUser = new Map<string, any>();
      
      data.forEach(msg => {
        // Determine the other user (doctor)
        let otherUserId: string, otherUserName: string;
        
        if (msg.sender_id === user.id) {
          otherUserId = msg.receiver_id;
          otherUserName = msg.receiver?.full_name || 'Unknown';
        } else {
          otherUserId = msg.sender_id;
          otherUserName = msg.sender?.full_name || 'Unknown';
        }
        
        // Only process if the other user is a doctor
        const otherUserRole = msg.sender_id === user.id 
          ? msg.receiver?.role 
          : msg.sender?.role;
          
        if (otherUserRole !== 'doctor') return;
        
        // If this is the first message with this doctor or more recent
        if (!messagesByUser.has(otherUserId) || 
            new Date(messagesByUser.get(otherUserId).timestamp) < new Date(msg.timestamp)) {
          
          messagesByUser.set(otherUserId, {
            userId: otherUserId,
            userName: otherUserName,
            lastMessage: msg.content,
            timestamp: msg.timestamp,
            unread: messagesByUser.has(otherUserId) 
              ? messagesByUser.get(otherUserId).unread 
              : (msg.sender_id !== user.id && !msg.read ? 1 : 0)
          });
        }
      });
      
      // Convert to ChatRoom objects
      const chatRooms: ChatRoom[] = [];
      
      messagesByUser.forEach(chat => {
        chatRooms.push({
          id: chat.userId,
          name: chat.userName,
          lastMessage: chat.lastMessage,
          time: formatTimeAgo(new Date(chat.timestamp)),
          unread: chat.unread
        });
      });
      
      setDoctorChats(chatRooms);
      
    } catch (error: any) {
      console.error("Error fetching doctor chats:", error);
      toast({
        title: "Error",
        description: "Failed to load doctor chats: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingDoctorChats(false);
    }
  };
  
  // Helper function to format time
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    
    // For older messages, show the date
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Error message container */}
      {errorMessage && (
        <div id="error-message" className="bg-red-500 text-white p-2 text-center">
          {errorMessage}
        </div>
      )}

      {/* Chat Header */}
      <div className="bg-primary flex items-center justify-between p-4 text-white">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-primary/80"
          onClick={() => setShowHistory(true)}
        >
          <i className="fas fa-bars"></i>
        </Button>
        <h1 className="text-xl font-bold">KABIRAJ AI Chat</h1>
        {activeTab === "ai-chat" && (
          <Button 
            id="report-btn" 
            variant="secondary" 
            size="sm" 
            className="bg-white text-primary hover:bg-gray-100"
            onClick={sendToDoctor}
          >
            <i className="fas fa-share mr-2"></i> Send to Doctor
          </Button>
        )}
        {activeTab === "doctor-chat" && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white text-primary hover:bg-gray-100"
            onClick={() => navigate('/patient/find-doctor')}
          >
            <i className="fas fa-user-md mr-2"></i> Find Doctor
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs 
        defaultValue="ai-chat" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-2 mx-4 mt-2 bg-gray-100">
          <TabsTrigger 
            value="ai-chat" 
            className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Bot className="h-4 w-4" />
            <span>AI Chat</span>
          </TabsTrigger>
          <TabsTrigger 
            value="doctor-chat" 
            className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <User className="h-4 w-4" />
            <span>Chat with Doctor</span>
          </TabsTrigger>
        </TabsList>
        
        {/* AI Chat Tab */}
        <TabsContent value="ai-chat" className="flex-1 flex flex-col pb-16">
          {/* Chat Messages Container */}
          <div 
            id="chat-container" 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 pb-20 space-y-4"
          >
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.isUser ? "user flex justify-end" : "ai flex justify-start"}`}
              >
                <div 
                  className={`message-bubble max-w-[75%] rounded-2xl p-3 ${
                    message.isUser 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-gray-100 rounded-tl-none"
                  }`}
                >
                  {message.isUser ? (
                    <p>{message.content}</p>
                  ) : (
                    <div className="formatted-message">
                      {formatAIMessage(message.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message ai flex justify-start">
                <div className="message-bubble max-w-[75%] rounded-2xl p-3 bg-gray-100 rounded-tl-none">
                  <span>Thinking</span>
                  <div className="thinking-dots inline-flex ml-1">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse delay-75">.</span>
                    <span className="animate-pulse delay-150">.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Box - Fixed Position */}
          <div className="chat-input-box p-3 bg-white border-t shadow-md flex items-center gap-2 fixed bottom-16 left-0 right-0 z-10">
            <Input
              id="chat-input"
              type="text"
              placeholder={isListening ? "Listening..." : "Type a message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1"
            />
            <Button
              id="mic-btn"
              variant="outline"
              size="icon"
              onClick={isListening ? stopListening : startListening}
              className={isListening ? "bg-red-500 text-white" : ""}
            >
              <i className={`fas ${isListening ? "fa-microphone-slash" : "fa-microphone"}`}></i>
            </Button>
            <Button
              id="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
        </TabsContent>
        
        {/* Doctor Chat Tab */}
        <TabsContent value="doctor-chat" className="flex-1 overflow-hidden pb-16">
          <div className="p-4 pb-20 h-full flex flex-col">
            {loadingDoctorChats ? (
              <div className="flex items-center justify-center py-8 flex-grow">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : doctorChats.length > 0 ? (
              <div className="space-y-3 overflow-y-auto">
                {doctorChats.map((chat) => (
                  <Card 
                    key={chat.id} 
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => navigate(`/patient/chat/${chat.id}`)}
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 rounded-full p-2">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{chat.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-[180px]">
                            {chat.lastMessage}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{chat.time}</p>
                        {chat.unread > 0 && (
                          <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 mt-1 inline-block">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 flex-grow text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No Conversations Yet</h3>
                <p className="text-gray-500 mb-6">Start a conversation with a doctor</p>
                <Button onClick={() => navigate('/patient/find-doctor')}>
                  Find a Doctor
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Chat History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Chat History</span>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto">
            {loadingHistory ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : chatHistory.length > 0 ? (
              <div className="space-y-2">
                {chatHistory.map((item) => (
                  <div 
                    key={item.id}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => loadChatSession(item)}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium">{item.summary}</p>
                      <p className="text-sm text-gray-500">
                        {item.date.toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {item.messages.length} messages
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500">
                <Bot className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No chat history found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* FontAwesome CDN */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        rel="stylesheet"
      />
      
      <style>
        {`
          .thinking-dots span {
            animation-duration: 1.4s;
            animation-iteration-count: infinite;
            animation-fill-mode: both;
          }
          .thinking-dots span:nth-child(2) {
            animation-delay: 0.2s;
          }
          .thinking-dots span:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0; }
            40% { opacity: 1; }
          }
          .animate-pulse {
            animation: pulse 1.4s infinite;
          }
          .delay-75 {
            animation-delay: 0.2s;
          }
          .delay-150 {
            animation-delay: 0.4s;
          }
          .formatted-message h4 {
            color: #3b82f6;
            font-weight: bold;
            margin-top: 0.5rem;
          }
          .formatted-message ul, .formatted-message ol {
            margin-left: 1.5rem;
          }
          .formatted-message li {
            margin-bottom: 0.25rem;
          }
          .formatted-message strong {
            font-weight: bold;
          }
        `}
      </style>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
} 