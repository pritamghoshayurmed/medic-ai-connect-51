import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService } from "@/services/doctorService";
import { firebaseChatService, ChatRoom as FirebaseChatRoom, FirebaseMessage } from "@/services/firebaseChatService";
import { userMappingService } from "@/services/userMappingService";
import { DoctorProfile } from "@/types"; // For doctor details
import styled from "styled-components";
import { formatDistanceToNow } from 'date-fns';

import {
  ChevronLeft,
  Search,
  Bot,
  MessageSquare
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Styled components (remain largely the same)
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

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: white;
`;

const ContentContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  padding-left: 40px;
  border-radius: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  outline: none;
  font-size: 15px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
`;

const ChatCard = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const DoctorInfo = styled.div`
  flex: 1;
  margin-left: 15px;
`;

const DoctorName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: white;
`;

const LastMessage = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TimeStamp = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  text-align: right;
  margin-top: 5px;
`;

// OnlineBadge might be removed or logic changed if not directly available from chat room
// const OnlineBadge = styled.div`...`;

const AICard = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const AIIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #00C389;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
`;

const AITitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: white;
`;

const AIDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
`;

const StartChatButton = styled.button`
  background-color: #00C389;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #00A070;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  color: white;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
`;

// Enhanced structure for display
interface DisplayChat {
  doctorId: string; // Supabase ID of the doctor
  doctorName: string;
  doctorAvatar?: string;
  lastMessageContent: string;
  lastMessageTimestamp: string; // Formatted string
  // online: boolean; // This might be harder to get accurately without presence system
  unreadCount: number;
}

export default function Chat() {
  const navigate = useNavigate();
  const { user: patientUser } = useAuth(); // Renamed for clarity
  const [searchQuery, setSearchQuery] = useState("");
  const [displayChats, setDisplayChats] = useState<DisplayChat[]>([]);
  const [filteredChats, setFilteredChats] = useState<DisplayChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientUser) {
      setLoading(false);
      return;
    }

    const loadChatRooms = async () => {
      try {
        setLoading(true);
        const patientFirebaseId = userMappingService.getFirebaseUserId(patientUser.id);
        const chatRooms: FirebaseChatRoom[] = await firebaseChatService.getChatRooms(patientFirebaseId);

        const processedChats: DisplayChat[] = await Promise.all(
          chatRooms.map(async (room) => {
            const doctorFirebaseId = room.participants.find(pId => pId !== patientFirebaseId);
            if (!doctorFirebaseId) return null;

            const doctorSupabaseId = userMappingService.getSupabaseUserId(doctorFirebaseId);
            if (!doctorSupabaseId) return null;

            const doctorProfile: DoctorProfile | null = await doctorService.getDoctorById(doctorSupabaseId);
            if (!doctorProfile) return null;

            const lastMessage = room.lastMessage;

            return {
              doctorId: doctorSupabaseId,
              doctorName: doctorProfile.full_name || "Doctor",
              doctorAvatar: undefined, // doctorProfile.profile_pic_url, // Assuming profile_pic_url exists
              lastMessageContent: lastMessage?.content || "No messages yet.",
              lastMessageTimestamp: lastMessage?.timestamp ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true }) : "N/A",
              unreadCount: room.unreadCount?.[patientFirebaseId] || 0,
            };
          })
        );

        const validChats = processedChats.filter(chat => chat !== null) as DisplayChat[];
        // Sort by lastActivity from room if available, otherwise by a default
        // For now, FirebaseChatRoom doesn't explicitly sort by lastActivity in getChatRooms,
        // but it's good practice if the service method did.
        // Here, we can sort by timestamp of last message if needed, or rely on service's order.
        setDisplayChats(validChats);
        setFilteredChats(validChats);
        console.log(`Loaded ${validChats.length} chat rooms`);
      } catch (error) {
        console.error('Error loading chat rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();
  }, [patientUser]);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(displayChats);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = displayChats.filter(chat =>
        chat.doctorName.toLowerCase().includes(lowerQuery) ||
        chat.lastMessageContent.toLowerCase().includes(lowerQuery)
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, displayChats]);
  
  const handleNavigation = (tab: string) => {
    if (tab === "ai") {
      navigate('/patient/ai-chat');
    }
    // "doctors" tab is the current view, no navigation needed.
  };
  
  const handleDoctorChatSelect = (doctorId: string) => { // doctorId is Supabase ID
    navigate(`/patient/doctor-chat/${doctorId}`);
  };

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate("/patient")}>
          <ChevronLeft size={24} />
        </BackButton>
        <PageTitle>Chats</PageTitle>
      </Header>
      
      <Tabs defaultValue="doctors" className="w-full px-4 mt-4">
        <TabsList className="grid grid-cols-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg w-full">
          <TabsTrigger 
            value="doctors" 
            className="rounded-md data-[state=active]:bg-[#00C389] data-[state=active]:text-white"
            onClick={() => handleNavigation("doctors")}
          >
            Chat with Doctor
          </TabsTrigger>
          <TabsTrigger 
            value="ai" 
            className="rounded-md data-[state=active]:bg-[#00C389] data-[state=active]:text-white"
            onClick={() => handleNavigation("ai")}
          >
            AI Assistant
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <ContentContainer>
        <SearchContainer>
          <SearchIcon>
            <Search size={18} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search chats by doctor or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        
        <AICard onClick={() => navigate('/patient/ai-chat')}>
          <AIIcon>
            <Bot size={28} color="white" />
          </AIIcon>
          <AITitle>Kabiraj AI Assistant</AITitle>
          <AIDescription>
            Get instant health advice and personalized recommendations from our AI medical assistant
          </AIDescription>
          <StartChatButton>Start Chat</StartChatButton>
        </AICard>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map(chat => (
            <ChatCard
              key={chat.doctorId} // Use doctor's Supabase ID as key
              onClick={() => handleDoctorChatSelect(chat.doctorId)}
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-[#004953]/10 text-[#004953] border-[rgba(255,255,255,0.3)] border">
                  {chat.doctorName.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
                {chat.doctorAvatar && (
                  <AvatarImage src={chat.doctorAvatar} alt={chat.doctorName} />
                )}
              </Avatar>

              <DoctorInfo>
                <DoctorName>{chat.doctorName}</DoctorName>
                <LastMessage>{chat.lastMessageContent}</LastMessage>
                <TimeStamp>{chat.lastMessageTimestamp}</TimeStamp>
              </DoctorInfo>
              {/* Display unread count if greater than 0 */}
              {chat.unreadCount > 0 && (
                <div className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {chat.unreadCount}
                </div>
              )}
              {/* OnlineBadge might be re-added if presence is implemented */}
            </ChatCard>
          ))
        ) : (
          <EmptyState>
            <EmptyIcon>
              <MessageSquare size={32} color="rgba(255,255,255,0.5)" />
            </EmptyIcon>
            <EmptyTitle>No chats found</EmptyTitle>
            <EmptyText>
              {searchQuery ? 
                "No doctors or messages match your search." :
                "You haven't started any conversations yet."}
            </EmptyText>
            <StartChatButton onClick={() => navigate('/patient/find-doctor')}>
              Find a Doctor to Chat
            </StartChatButton>
          </EmptyState>
        )}
      </ContentContainer>
      
      <BottomNavigation />
    </PageContainer>
  );
}