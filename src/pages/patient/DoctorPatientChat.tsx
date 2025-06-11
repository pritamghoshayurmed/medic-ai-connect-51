import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { 
  ChevronLeft, 
  Mic, 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Home, 
  Search, 
  Activity, 
  MessageSquare, 
  User,
  Video
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PageContainer = styled.div`
  background: linear-gradient(135deg, #004953 0%, #006064 50%, #00363a 100%);
  min-height: 100vh;
  color: white;
  font-family: 'Roboto', sans-serif;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  margin-right: 15px;
  cursor: pointer;
`;

const DoctorInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
`;

const DoctorAvatar = styled.div`
  margin-right: 15px;
`;

const DoctorDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const DoctorName = styled.h2`
  font-size: 18px;
  font-weight: 600;
`;

const OnlineStatus = styled.span`
  font-size: 12px;
  opacity: 0.7;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
`;

const TabsContainer = styled.div`
  display: flex;
  padding: 10px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.div<{ isActive: boolean }>`
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: ${props => props.isActive ? 'rgba(0, 195, 137, 0.2)' : 'transparent'};
  color: ${props => props.isActive ? '#00C389' : 'white'};
`;

const ChatContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MessageBubble = styled.div<{ isSent: boolean }>`
  max-width: 75%;
  align-self: ${props => props.isSent ? 'flex-end' : 'flex-start'};
  padding: 12px 15px;
  border-radius: ${props => props.isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
  background-color: ${props => props.isSent ? '#00C389' : 'rgba(255, 255, 255, 0.1)'};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  word-break: break-word;
`;

const MessageText = styled.p`
  margin: 0;
  font-size: 15px;
`;

const MessageTime = styled.span`
  font-size: 11px;
  opacity: 0.7;
  margin-top: 5px;
  text-align: right;
  display: block;
`;

const InputContainer = styled.div`
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.1);
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border-radius: 25px;
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  outline: none;
  font-size: 15px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const InputButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
`;

const AttachButton = styled(InputButton)`
  background-color: transparent;
  color: white;
`;

const SendButton = styled(InputButton)`
  background-color: #00C389;
  color: white;
`;

const BottomNav = styled.div`
  height: 70px;
  background-color: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
`;

const NavItem = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${props => props.active ? '#00C389' : '#777'};
  font-size: 12px;
  cursor: pointer;
`;

const NavIcon = styled.div`
  margin-bottom: 5px;
`;

interface Message {
  id: number;
  text: string;
  isSent: boolean;
  time: string;
}

// Mock doctor data
interface DoctorData {
  id: string;
  name: string;
  specialty: string;
  online: boolean;
  avatar?: string;
}

const DOCTORS_DATA: Record<string, DoctorData> = {
  "1": {
    id: "1",
    name: "Dr. Priya Sharma",
    specialty: "Cardiologist",
    online: true,
    avatar: "/doctor-avatar-1.png"
  },
  "2": {
    id: "2",
    name: "Dr. Samridhi Dev",
    specialty: "Orthopedic",
    online: false,
    avatar: "/doctor-avatar-2.png"
  },
  "3": {
    id: "3",
    name: "Dr. Koushik Das",
    specialty: "Neurologist",
    online: true,
    avatar: "/doctor-avatar-3.png"
  }
};

// Mock conversations
const MOCK_CONVERSATIONS: Record<string, Message[]> = {
  "1": [
    {
      id: 1,
      text: "Hello, how can I help you today?",
      isSent: false,
      time: "10:30 AM"
    },
    {
      id: 2,
      text: "I've been experiencing some chest pain lately.",
      isSent: true,
      time: "10:32 AM"
    },
    {
      id: 3,
      text: "Can you tell me when it started and describe the pain?",
      isSent: false,
      time: "10:33 AM"
    },
    {
      id: 4,
      text: "It started about a week ago. The pain is sharp and happens mostly when I take deep breaths.",
      isSent: true,
      time: "10:35 AM"
    },
    {
      id: 5,
      text: "I see. Have you noticed any other symptoms like shortness of breath, fever or fatigue?",
      isSent: false,
      time: "10:37 AM"
    }
  ],
  "2": [
    {
      id: 1,
      text: "Good morning, what can I do for you?",
      isSent: false,
      time: "09:15 AM"
    },
    {
      id: 2,
      text: "I'm having pain in my right knee after jogging yesterday.",
      isSent: true,
      time: "09:17 AM"
    },
    {
      id: 3,
      text: "Is it swollen or red? Can you rate the pain on a scale from 1 to 10?",
      isSent: false,
      time: "09:18 AM"
    },
    {
      id: 4,
      text: "It's slightly swollen but not red. The pain is about 6/10 when I walk.",
      isSent: true,
      time: "09:20 AM"
    }
  ],
  "3": [
    {
      id: 1,
      text: "Hello there, how can I assist you today?",
      isSent: false,
      time: "02:45 PM"
    },
    {
      id: 2,
      text: "I've been having frequent headaches for the past week.",
      isSent: true,
      time: "02:46 PM"
    },
    {
      id: 3,
      text: "I'm sorry to hear that. Can you describe the headache? Is it on one side or both sides of your head?",
      isSent: false,
      time: "02:48 PM"
    },
    {
      id: 4,
      text: "It's usually on both sides, and it feels like a dull pressure. It gets worse in the afternoon.",
      isSent: true,
      time: "02:50 PM"
    },
    {
      id: 5,
      text: "Have you been staying hydrated? How's your stress level and sleep quality recently?",
      isSent: false,
      time: "02:52 PM"
    }
  ]
};

export default function DoctorPatientChat() {
  const { id } = useParams<{ id: string }>();
  const doctorId = id || "1"; // Default to first doctor if no ID provided
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("doctors");
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Get doctor data based on ID
  const [doctor, setDoctor] = useState<DoctorData>(DOCTORS_DATA[doctorId] || DOCTORS_DATA["1"]);
  
  // Get conversation based on doctor ID
  const [messages, setMessages] = useState<Message[]>(
    MOCK_CONVERSATIONS[doctorId] || MOCK_CONVERSATIONS["1"]
  );
  
  // Update doctor and messages when ID changes
  useEffect(() => {
    setDoctor(DOCTORS_DATA[doctorId] || DOCTORS_DATA["1"]);
    setMessages(MOCK_CONVERSATIONS[doctorId] || MOCK_CONVERSATIONS["1"]);
  }, [doctorId]);
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (message.trim() === "") return;
    
    // Create new message
    const newMessage: Message = {
      id: messages.length + 1,
      text: message,
      isSent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add message to state
    setMessages([...messages, newMessage]);
    
    // Clear input
    setMessage("");
    
    // Simulate doctor response after a delay
    setTimeout(() => {
      const doctorResponse: Message = {
        id: messages.length + 2,
        text: "Thank you for sharing that information. Based on your symptoms, I'd like to schedule an appointment to examine you in person. Would tomorrow at 2 PM work for you?",
        isSent: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, doctorResponse]);
    }, 3000);
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === "kabiraj") {
      navigate("/patient/ai-chat");
    }
  };
  
  const handleBackClick = () => {
    navigate("/patient/chat");
  };
  
  return (
    <PageContainer>
      <Header>
        <BackButton onClick={handleBackClick}>
          <ChevronLeft size={24} />
        </BackButton>
        
        <DoctorInfo onClick={() => navigate(`/patient/doctor-profile/${doctor.id}`)}>
          <DoctorAvatar>
            <Avatar className="h-12 w-12">
              <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
              {doctor.avatar && <AvatarImage src={doctor.avatar} alt={doctor.name} />}
            </Avatar>
          </DoctorAvatar>
          
          <DoctorDetails>
            <DoctorName>{doctor.name}</DoctorName>
            <OnlineStatus>{doctor.online ? "Online" : "Offline"}</OnlineStatus>
          </DoctorDetails>
        </DoctorInfo>
        
        <ActionButtons>
          <ActionButton onClick={() => navigate(`/patient/video-call/${doctor.id}`)}>
            <Video size={20} />
          </ActionButton>
        </ActionButtons>
      </Header>
      
      <TabsContainer>
        <Tab 
          isActive={activeTab === "doctors"} 
          onClick={() => handleTabChange("doctors")}
        >
          Doctor Chats
        </Tab>
        
        <Tab 
          isActive={activeTab === "kabiraj"} 
          onClick={() => handleTabChange("kabiraj")}
        >
          Kabiraj AI
        </Tab>
      </TabsContainer>
      
      <ChatContainer ref={chatContainerRef}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} isSent={msg.isSent}>
            <MessageText>{msg.text}</MessageText>
            <MessageTime>{msg.time}</MessageTime>
          </MessageBubble>
        ))}
      </ChatContainer>
      
      <InputContainer>
        <AttachButton>
          <Paperclip size={20} />
        </AttachButton>
        
        <AttachButton>
          <ImageIcon size={20} />
        </AttachButton>
        
        <MessageInput
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        
        <AttachButton>
          <Mic size={20} />
        </AttachButton>
        
        <SendButton onClick={handleSendMessage}>
          <Send size={18} />
        </SendButton>
      </InputContainer>
      
      <BottomNav>
        <NavItem onClick={() => navigate("/patient")}>
          <NavIcon>
            <Home size={22} />
          </NavIcon>
          Home
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/vitals")}>
          <NavIcon>
            <Activity size={22} />
          </NavIcon>
          Vitals
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/find-doctor")}>
          <NavIcon>
            <Search size={22} />
          </NavIcon>
          Find Doctor
        </NavItem>
        
        <NavItem active>
          <NavIcon>
            <MessageSquare size={22} />
          </NavIcon>
          Chat
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/profile")}>
          <NavIcon>
            <User size={22} />
          </NavIcon>
          Profile
        </NavItem>
      </BottomNav>
    </PageContainer>
  );
}