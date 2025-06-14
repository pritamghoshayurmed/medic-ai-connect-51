import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Calendar,
  User,
  Pill,
  MessageSquare,
  Activity,
  Bell,
  Lock,
  Search,
  Home,
  LineChart,
  Clock,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import styled from "styled-components";
import { useLimitedDoctors } from "@/hooks/useDatabase"; // Removed useAppointments
import { Doctor } from "@/types";

// Styled components for the new design
const DashboardContainer = styled.div`
  background: linear-gradient(135deg, #004953 0%, #006064 50%, #00363a 100%);
  min-height: 100vh;
  color: white;
  font-family: 'Roboto', sans-serif;
  padding-bottom: 90px; /* Add extra padding at bottom for scrolling past bottom nav */
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(135deg, #004953 0%, #006064 50%, #00363a 100%);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoImage = styled.img`
  width: 35px;
  height: auto;
`;

const LogoText = styled.h1`
  font-size: 20px;
  font-weight: 600;
`;

const NotificationBell = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const Greeting = styled.div`
  padding: 0 20px 20px;
`;

const Hello = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 5px;
`;

const DateText = styled.p`
  font-size: 16px;
  opacity: 0.9;
`;

const QuickActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 20px;
`;

const ActionButton = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px 20px;
  width: 48%;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const ActionIcon = styled.div`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionText = styled.span`
  font-size: 16px;
  font-weight: 500;
`;

const HealthMetricsCard = styled.div`
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  margin: 0 20px 20px;
  padding: 20px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 500;
`;

const ViewDetailsButton = styled.button`
  background-color: rgba(0, 195, 137, 0.7);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #00C389;
  }
`;

const MetricsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MetricItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const MetricIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MetricValue = styled.div`
  display: flex;
  flex-direction: column;
`;

const Value = styled.span`
  font-size: 20px;
  font-weight: 700;
`;

const ValueLabel = styled.span`
  font-size: 14px;
  opacity: 0.8;
`;

const ChartImage = styled.div`
  width: 100%;
  margin-top: 15px;
  text-align: right;
`;

const DoctorsSection = styled.div`
  margin: 0 20px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SeeAllText = styled.span`
  font-size: 14px;
  color: #00C389;
  cursor: pointer;
`;

const DoctorCard = styled.div`
  background-color: white;
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 15px;
  color: #333;
  display: flex;
  flex-direction: column;
`;

const DoctorInfo = styled.div`
  display: flex;
  margin-bottom: 15px;
`;

const DoctorAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
  cursor: pointer;
`;

const DoctorAvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DoctorDetails = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
`;

const DoctorName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
`;

const DoctorSpecialty = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

const DoctorExperience = styled.p`
  font-size: 14px;
  color: #666;
`;

const DoctorActions = styled.div`
  display: flex;
  justify-content: space-between;
`;

const DoctorButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 0;
  width: 48%;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background-color: ${props => props.$primary ? '#004953' : '#f0f0f0'};
  color: ${props => props.$primary ? 'white' : '#333'};

  &:hover {
    opacity: 0.9;
  }
`;

const ArticlesSection = styled.div`
  margin: 20px 20px;
`;

const ArticleCard = styled.div`
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 15px;
  cursor: pointer;
`;

const ArticleImage = styled.div`
  height: 120px;
  background-color: #f0f0f0;
  overflow: hidden;
`;

const ArticleImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ArticleContent = styled.div`
  padding: 15px;
`;

const ArticleTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
`;

const ArticleMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #777;
`;

const ArticleTime = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const MedicationSection = styled.div`
  margin: 0 20px 20px;
`;

const MedicationCard = styled.div`
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 15px;
`;

const MedicationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const MedicationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MedicationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
`;

const MedicationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const MedicationIcon = styled.div`
  width: 35px;
  height: 35px;
  background-color: #00C389;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MedicationDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const MedicationName = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const MedicationTime = styled.span`
  font-size: 12px;
  opacity: 0.7;
`;

const MedicationStatus = styled.div`
  background-color: rgba(0, 195, 137, 0.2);
  color: #00C389;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
`;

const BottomNav = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 100;
`;

const NavItem = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${props => props.$active ? '#00C389' : '#777'};
  font-size: 12px;
  cursor: pointer;
`;

const NavIcon = styled.div`
  margin-bottom: 5px;
`;

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch real data from database
  const { data: doctors = [], isLoading: doctorsLoading } = useLimitedDoctors(3); // Use useLimitedDoctors with a limit of 3
  // const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments(user?.id, user?.role); // Removed

  const [vitals, setVitals] = useState({
    heartRate: 76,
    bloodPressure: "120/80",
  });

  const loading = doctorsLoading; // Removed appointmentsLoading

  // Get user data from auth context
  const userData = {
    name: user?.name || "User",
    date: format(new Date(), "EEEE, MMMM d")
  };
  
  const [articles, setArticles] = useState([
    {
      id: 1,
      title: "Top 10 Foods to Improve Heart Health",
      image: "/assets/articles/heart-health.jpg",
      readTime: "5 min read",
      date: "May 28",
    },
    {
      id: 2,
      title: "How to Manage Stress During Pandemic",
      image: "/assets/articles/stress.jpg",
      readTime: "3 min read",
      date: "May 25",
    },
    {
      id: 3,
      title: "The Importance of Regular Exercise",
      image: "/assets/articles/exercise.jpg",
      readTime: "4 min read",
      date: "May 22",
    },
  ]);
  
  const [medications, setMedications] = useState([
    {
      id: 1,
      name: "Paracetamol 500mg",
      time: "08:00 AM",
      status: "Taken"
    },
    {
      id: 2,
      name: "Vitamin C",
      time: "01:00 PM",
      status: "Take now"
    },
    {
      id: 3,
      name: "Montelukast 10mg",
      time: "09:00 PM",
      status: "Upcoming"
    }
  ]);
  
  const handleViewDoctorProfile = (doctorId: string) => {
    navigate(`/patient/doctor-profile/${doctorId}`);
  };

  const handleBookAppointment = (doctorId: string) => {
    navigate(`/patient/book-appointment/${doctorId}`);
  };
  
  const handleViewArticle = (articleId: number) => {
    // In a real app, this would navigate to the article page
    alert(`Viewing article ${articleId}`);
  };
  
  const handleViewAllDoctors = () => {
    navigate("/patient/find-doctor");
  };
  
  const handleViewAllArticles = () => {
    // In a real app, this would navigate to the articles page
    alert("Viewing all articles");
  };
  
  const handleViewMedications = () => {
    navigate("/patient/medication-reminders");
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <DashboardContainer>
      <Header>
        <Logo>
          <LogoImage src="/src/pages/pnglogo copy.png" alt="Kabiraj AI" />
          <LogoText>KABIRAJ AI</LogoText>
        </Logo>
        <NotificationBell>
          <Bell size={24} />
        </NotificationBell>
      </Header>
      
      <Greeting>
        <Hello>Hello, {userData.name}!</Hello>
        <DateText>{userData.date}</DateText>
      </Greeting>
      
      <QuickActionsRow>
        <ActionButton onClick={() => navigate("/patient/find-doctor")}>
          <ActionIcon>
            <Search size={22} />
          </ActionIcon>
          <ActionText>Find Doctor</ActionText>
        </ActionButton>



        <ActionButton onClick={() => navigate("/patient/appointments")}>
          <ActionIcon>
            <Calendar size={22} />
          </ActionIcon>
          <ActionText>Appointments</ActionText>
        </ActionButton>
      </QuickActionsRow>
      
      <HealthMetricsCard>
        <CardHeader>
          <CardTitle>Health Metrics</CardTitle>
          <ViewDetailsButton onClick={() => navigate("/patient/vitals")}>
            View Details
          </ViewDetailsButton>
        </CardHeader>
        
        <MetricsRow>
          <MetricItem>
            <MetricIcon>
              <Activity size={24} color="#00C389" />
            </MetricIcon>
            <MetricValue>
              <Value>{vitals.heartRate} bpm</Value>
              <ValueLabel>Heart Rate</ValueLabel>
            </MetricValue>
          </MetricItem>
          
          <MetricItem>
            <MetricIcon>
              <Lock size={24} color="#00C389" />
            </MetricIcon>
            <MetricValue>
              <Value>{vitals.bloodPressure} mmHg</Value>
              <ValueLabel>Blood Pressure</ValueLabel>
            </MetricValue>
          </MetricItem>
        </MetricsRow>
        
        <ChartImage>
          <svg width="200" height="80" viewBox="0 0 200 80">
            <path 
              d="M0,40 C10,30 20,50 30,40 C40,30 50,50 60,40 C70,30 80,50 90,40 C100,30 110,50 120,40 C130,30 140,50 150,40 C160,30 170,50 180,40 C190,30 200,50 210,40" 
              stroke="#00C389" 
              strokeWidth="2" 
              fill="none" 
            />
          </svg>
        </ChartImage>
      </HealthMetricsCard>
      
      <DoctorsSection>
        <SectionTitle>
          Recommended Doctors
          <SeeAllText onClick={handleViewAllDoctors}>See all <ChevronRight size={14} /></SeeAllText>
        </SectionTitle>
        
        {doctors.slice(0, 3).map(doctor => (
          <DoctorCard key={doctor.id}>
            <DoctorInfo>
              <DoctorAvatar onClick={() => handleViewDoctorProfile(doctor.id)}>
                <Avatar className="h-14 w-14">
                  <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </DoctorAvatar>

              <DoctorDetails onClick={() => handleViewDoctorProfile(doctor.id)}>
                <DoctorName>{doctor.name}</DoctorName>
                <DoctorSpecialty>{doctor.specialty || 'General Practitioner'}</DoctorSpecialty>
                <DoctorExperience>{doctor.experience ? `${doctor.experience} Years Experience` : 'Experienced Doctor'}</DoctorExperience>
              </DoctorDetails>
            </DoctorInfo>

            <DoctorActions>
              <DoctorButton onClick={() => navigate(`/patient/doctor-chat/${doctor.id}`)}>
                <MessageSquare size={16} />
                Chat
              </DoctorButton>

              <DoctorButton $primary onClick={() => handleBookAppointment(doctor.id)}>
                Book Appointment
              </DoctorButton>
            </DoctorActions>
          </DoctorCard>
        ))}
      </DoctorsSection>
      
      <ArticlesSection>
        <SectionTitle>
          Health Articles
          <SeeAllText onClick={handleViewAllArticles}>See all <ChevronRight size={14} /></SeeAllText>
        </SectionTitle>
        
        {articles.map(article => (
          <ArticleCard key={article.id} onClick={() => handleViewArticle(article.id)}>
            <ArticleImage>
              <ArticleImg src="https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-hospital-background_1423-1.jpg" alt={article.title} />
            </ArticleImage>
            <ArticleContent>
              <ArticleTitle>{article.title}</ArticleTitle>
              <ArticleMeta>
                <ArticleTime>
                  <Clock size={12} />
                  {article.readTime}
                </ArticleTime>
                <span>{article.date}</span>
              </ArticleMeta>
            </ArticleContent>
          </ArticleCard>
        ))}
      </ArticlesSection>
      
      <MedicationSection>
        <CardHeader>
          <CardTitle>Medication Reminders</CardTitle>
          <ViewDetailsButton onClick={handleViewMedications}>
            View All
          </ViewDetailsButton>
        </CardHeader>
        
        <MedicationList>
          {medications.map(med => (
            <MedicationItem key={med.id}>
              <MedicationInfo>
                <MedicationIcon>
                  <Pill size={20} color="white" />
                </MedicationIcon>
                <MedicationDetails>
                  <MedicationName>{med.name}</MedicationName>
                  <MedicationTime>{med.time}</MedicationTime>
                </MedicationDetails>
              </MedicationInfo>
              <MedicationStatus>
                {med.status}
              </MedicationStatus>
            </MedicationItem>
          ))}
        </MedicationList>
      </MedicationSection>
      
      <BottomNav>
        <NavItem $active={true} onClick={() => {}}>
          <NavIcon>
            <Home size={24} />
          </NavIcon>
          Home
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/vitals")}>
          <NavIcon>
            <Activity size={24} />
          </NavIcon>
          Vitals
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/find-doctor")}>
          <NavIcon>
            <Search size={24} />
          </NavIcon>
          Find Doctor
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/chat")}>
          <NavIcon>
            <MessageSquare size={24} />
          </NavIcon>
          Chat
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/profile")}>
          <NavIcon>
            <User size={24} />
          </NavIcon>
          Profile
        </NavItem>
      </BottomNav>
    </DashboardContainer>
  );
}
