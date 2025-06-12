import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { firebaseChatService, FirebaseMessage } from "@/services/firebaseChatService";
import { doctorService } from "@/services/doctorService";
import { userMappingService } from "@/services/userMappingService";
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

// Use Firebase message type
type Message = FirebaseMessage;

interface DoctorData {
  id: string;
  name: string;
  specialty: string;
  online: boolean;
  avatar?: string;
}





export default function DoctorPatientChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("doctors");
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch doctor data and setup Firebase listener
  useEffect(() => {
    if (!user || !id) return;

    const fetchDoctorAndSetupChat = async () => {
      try {
        setLoading(true);

        // Fetch doctor information using the doctor service
        const doctorProfile = await doctorService.getDoctorById(id);

        if (!doctorProfile) {
          console.error('Doctor not found with ID:', id);
          toast({
            title: "Error",
            description: "Failed to load doctor information",
            variant: "destructive"
          });
          return;
        }

        setDoctor({
          id: doctorProfile.id,
          name: doctorProfile.full_name || 'Unknown Doctor',
          specialty: doctorProfile.specialty?.name || 'General Practitioner',
          online: true,
          avatar: undefined
        });

        console.log('Doctor loaded successfully:', doctorProfile.full_name);

        // Get Firebase user IDs for chat
        const patientFirebaseId = await userMappingService.getFirebaseUserId(user.id);
        const doctorFirebaseId = await userMappingService.getFirebaseUserId(id);

        console.log(`Setting up chat: Patient ${user.id} -> ${patientFirebaseId}, Doctor ${id} -> ${doctorFirebaseId}`);

        // Setup Firebase real-time listener for messages
        const unsubscribe = firebaseChatService.listenToDoctorPatientMessages(
          patientFirebaseId,
          doctorFirebaseId,
          (firebaseMessages) => {
            setMessages(firebaseMessages);
            setLoading(false);
          }
        );

        // Mark messages as read
        await firebaseChatService.markMessagesAsRead(patientFirebaseId, doctorFirebaseId);

        // Cleanup function
        return () => {
          unsubscribe();
        };

      } catch (error) {
        console.error('Error in fetchDoctorAndSetupChat:', error);
        toast({
          title: "Error",
          description: "Failed to load chat data",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    const cleanup = fetchDoctorAndSetupChat();

    return () => {
      cleanup.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
      });
    };
  }, [user, id, toast]);
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (message.trim() === "" || !user || !id || !doctor) return;

    const messageContent = message.trim();
    setMessage(""); // Clear input immediately

    try {
      // Get Firebase user IDs for sending message
      const patientFirebaseId = await userMappingService.getFirebaseUserId(user.id);
      const doctorFirebaseId = await userMappingService.getFirebaseUserId(id);

      // Send message via Firebase
      await firebaseChatService.sendDoctorPatientMessage(
        patientFirebaseId,
        doctorFirebaseId,
        messageContent,
        user.name || user.full_name || 'Patient',
        'patient'
      );

      console.log('Message sent successfully via Firebase');

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      setMessage(messageContent); // Restore message on error
    }
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
        
        {doctor ? (
          <>
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
          </>
        ) : (
          <DoctorInfo>
            <DoctorDetails>
              <DoctorName>Loading...</DoctorName>
              <OnlineStatus>Connecting...</OnlineStatus>
            </DoctorDetails>
          </DoctorInfo>
        )}
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} isSent={msg.senderId === user?.id}>
              <MessageText>{msg.content}</MessageText>
              <MessageTime>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </MessageTime>
            </MessageBubble>
          ))
        )}
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