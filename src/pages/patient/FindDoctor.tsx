import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, MapPin } from "lucide-react";
import styled from "styled-components";
import { useAllDoctors } from "@/hooks/useDatabase";
import { Doctor } from "@/types";

// Styled components for the new design
const PageContainer = styled.div`
  background: linear-gradient(135deg, #004953 0%, #006064 50%, #00363a 100%);
  min-height: 100vh;
  color: white;
  font-family: 'Roboto', sans-serif;
  padding-bottom: 80px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
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
`;

const SubTitle = styled.p`
  font-size: 16px;
  padding: 0 20px;
  margin-bottom: 20px;
  opacity: 0.9;
`;

const SearchContainer = styled.div`
  margin: 0 20px 20px;
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 15px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 15px 20px;
  padding-left: 50px;
  border-radius: 30px;
  border: none;
  font-size: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  outline: none;
  
  &::placeholder {
    color: #999;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
`;

const FilterRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const FilterButton = styled.button`
  background-color: white;
  color: #333;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const LocationButton = styled.button`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  color: white;
  font-size: 14px;
  margin-left: auto;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const DoctorsSection = styled.div`
  margin: 0 20px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
`;

const DoctorCard = styled.div`
  background-color: white;
  border-radius: 15px;
  margin-bottom: 15px;
  padding: 15px;
  color: #333;
`;

const DoctorHeader = styled.div`
  display: flex;
  margin-bottom: 10px;
`;

const DoctorAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f0f0f0;
  margin-right: 15px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DoctorInfo = styled.div`
  flex: 1;
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

const DoctorStatus = styled.div`
  display: flex;
  align-items: center;
`;

const OnlineStatus = styled.div`
  width: 40px;
  height: 22px;
  background-color: #00C389;
  border-radius: 12px;
  position: relative;
  margin-right: 10px;
  
  &:after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    background-color: white;
    border-radius: 50%;
    top: 2px;
    right: 2px;
  }
`;

const StatusText = styled.span`
  font-size: 14px;
  color: #00C389;
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 5px;
`;

const Rating = styled.span`
  font-size: 14px;
  font-weight: 500;
  margin-right: 5px;
`;

const ExperienceText = styled.span`
  font-size: 14px;
  color: #666;
  &::before {
    content: '•';
    margin: 0 5px;
  }
`;

const ActionRow = styled.div`
  display: flex;
  margin-top: 15px;
  gap: 10px;
`;

const ProfileButton = styled.button`
  flex: 1;
  padding: 10px 0;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #e5e5e5;
  }
`;

const AppointmentButton = styled.button`
  flex: 1;
  padding: 10px 0;
  background-color: #00C389;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #00A070;
  }
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

export default function FindDoctor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real doctors data
  const { data: allDoctors = [], isLoading } = useAllDoctors();

  // Filter doctors based on search query
  const filteredDoctors = allDoctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doctor.specialty && doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const viewProfile = (id: string) => {
    navigate(`/patient/doctor-profile/${id}`);
  };

  const bookAppointment = (id: string) => {
    navigate(`/patient/book-appointment/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate("/patient")}>
            <ChevronLeft size={24} />
          </BackButton>
          <PageTitle>Find Doctor</PageTitle>
        </Header>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ color: 'white' }}>Loading doctors...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate("/patient")}>
            <ChevronLeft size={24} />
        </BackButton>
        <PageTitle>Find Doctor</PageTitle>
      </Header>
      
      <SubTitle>
        Follow the steps to measure your BP<br />
        using PPG technology
      </SubTitle>
      
      <SearchContainer>
        <SearchBar>
          <SearchIcon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </SearchIcon>
          <SearchInput 
            type="text"
            placeholder="Search doctors..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </SearchBar>
        
        <FilterRow>
          <FilterButton>All Specialties</FilterButton>
          <LocationButton>
            <MapPin size={16} style={{ marginRight: '5px' }} />
            Set Location
          </LocationButton>
        </FilterRow>
      </SearchContainer>
      
      <DoctorsSection>
        <SectionTitle>Available Doctors</SectionTitle>
        
        {filteredDoctors.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'white', padding: '20px' }}>
            {searchQuery ? 'No doctors found matching your search.' : 'No doctors available.'}
          </div>
        ) : (
          filteredDoctors.map(doctor => (
            <DoctorCard key={doctor.id}>
              <DoctorHeader>
                <DoctorAvatar>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </DoctorAvatar>

                <DoctorInfo>
                  <DoctorName>{doctor.name}</DoctorName>
                  <DoctorSpecialty>{doctor.specialty || 'General Practitioner'}</DoctorSpecialty>
                  <RatingRow>
                    <Rating>{doctor.rating || 4.5}</Rating>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span style={{ fontSize: '14px', color: '#666', marginLeft: '5px' }}>({Math.floor(Math.random() * 50) + 10})</span>
                    <ExperienceText>{doctor.experience ? `${doctor.experience} years exp` : '5+ years exp'}</ExperienceText>
                  </RatingRow>
                </DoctorInfo>

                <DoctorStatus>
                  <OnlineStatus />
                  <StatusText>Available</StatusText>
                </DoctorStatus>
              </DoctorHeader>

              <ActionRow>
                <ProfileButton onClick={() => viewProfile(doctor.id)}>
                  View Profile
                </ProfileButton>
                <AppointmentButton onClick={() => bookAppointment(doctor.id)}>
                  Book Appointment
                </AppointmentButton>
              </ActionRow>
            </DoctorCard>
          ))
        )}
      </DoctorsSection>
      
      <BottomNav>
        <NavItem onClick={() => navigate("/patient")}>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </NavIcon>
          Home
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/vitals")}>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </NavIcon>
          Vitals
        </NavItem>
        
        <NavItem $active>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </NavIcon>
          Find Doctor
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/chat")}>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </NavIcon>
          Chat
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/profile")}>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </NavIcon>
          Profile
        </NavItem>
      </BottomNav>
    </PageContainer>
  );
}
