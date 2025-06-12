import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService } from "@/services/doctorService";
import styled from "styled-components";
import {
  ChevronLeft,
  Search,
  Bot,
  MessageSquare
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Styled components
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

const OnlineBadge = styled.div`
  width: 12px;
  height: 12px;
  background-color: #00C389;
  border-radius: 50%;
  margin-top: 5px;
  margin-left: auto;
`;

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

interface Doctor {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  avatar?: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Load doctors from Supabase
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        const doctorProfiles = await doctorService.getAllDoctors();

        // Transform doctor profiles to chat format
        const doctorChats: Doctor[] = doctorProfiles.map(doctor => ({
          id: doctor.id,
          name: doctor.full_name,
          lastMessage: "Start a conversation with this doctor",
          timestamp: "Available",
          online: true, // For now, assume all doctors are online
          avatar: undefined
        }));

        setDoctors(doctorChats);
        setFilteredDoctors(doctorChats);
        console.log(`Loaded ${doctorChats.length} doctors for chat`);
      } catch (error) {
        console.error('Error loading doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);
  
  // Filter doctors by search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, doctors]);
  
  const handleNavigation = (tab: string) => {
    if (tab === "ai") {
      navigate('/patient/ai-chat');
    }
  };
  
  const handleDoctorSelect = (doctorId: string) => {
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
            placeholder="Search doctors..."
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
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map(doctor => (
            <ChatCard
              key={doctor.id}
              onClick={() => handleDoctorSelect(doctor.id)}
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-[#004953]/10 text-[#004953] border-[rgba(255,255,255,0.3)] border">
                  {doctor.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
                {doctor.avatar && (
                  <AvatarImage src={doctor.avatar} alt={doctor.name} />
                )}
              </Avatar>

              <DoctorInfo>
                <DoctorName>{doctor.name}</DoctorName>
                <LastMessage>{doctor.lastMessage}</LastMessage>
                <TimeStamp>{doctor.timestamp}</TimeStamp>
              </DoctorInfo>

              {doctor.online && <OnlineBadge />}
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
                "No doctors match your search criteria." : 
                "You haven't chatted with any doctors yet."}
            </EmptyText>
            <StartChatButton onClick={() => navigate('/patient/find-doctor')}>
              Find a Doctor
            </StartChatButton>
          </EmptyState>
        )}
      </ContentContainer>
      
      <BottomNavigation />
    </PageContainer>
  );
} 