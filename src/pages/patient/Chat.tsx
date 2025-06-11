import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ChevronLeft, 
  Search, 
  MessageSquare,
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"ai" | "doctors">("doctors");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [doctors, setDoctors] = useState([
    {
      id: "1",
      name: "Dr. Priya Sharma",
      lastMessage: "Thank you for sharing that information...",
      timestamp: "10:45 AM",
      online: true,
      avatar: "/doctor-avatar-1.png"
    },
    {
      id: "2",
      name: "Dr. Samridhi Dev",
      lastMessage: "I recommend you to take the medication...",
      timestamp: "Yesterday",
      online: false,
      avatar: "/doctor-avatar-2.png"
    },
    {
      id: "3",
      name: "Dr. Koushik Das",
      lastMessage: "Your test results look normal, but let me...",
      timestamp: "Mon",
      online: false,
      avatar: "/doctor-avatar-3.png"
    }
  ]);
  
  const [filteredDoctors, setFilteredDoctors] = useState(doctors);
  
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
  
  const handleTabChange = (tab: "ai" | "doctors") => {
    setActiveTab(tab);
    
    if (tab === "ai") {
      // Navigate to AI chat
      navigate("/patient/ai-chat");
    }
  };
  
  const handleDoctorSelect = (doctorId: string) => {
    navigate(`/patient/doctor-chat/${doctorId}`);
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <button 
            className="mr-3 text-gray-700"
            onClick={() => navigate("/patient")}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button 
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === "ai" 
                ? 'text-[#004953] border-b-2 border-[#004953]' 
                : 'text-gray-500'
            }`}
            onClick={() => handleTabChange("ai")}
          >
            Chat with AI
          </button>
          <button 
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === "doctors" 
                ? 'text-[#004953] border-b-2 border-[#004953]' 
                : 'text-gray-500'
            }`}
            onClick={() => handleTabChange("doctors")}
          >
            Chat with Doctor
          </button>
        </div>
      </div>
      
      {/* Doctor List */}
      <div className="flex-1 bg-gray-50 p-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004953]/20"
          />
        </div>
        
        {/* Doctor Cards */}
        {filteredDoctors.length > 0 ? (
          <div className="space-y-3">
            {filteredDoctors.map(doctor => (
              <div 
                key={doctor.id}
                className="bg-white p-4 rounded-xl shadow-sm flex items-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleDoctorSelect(doctor.id)}
              >
                <div className="w-12 h-12 rounded-full bg-[#F5FBFA] flex items-center justify-center mr-4 overflow-hidden">
                  {doctor.avatar ? (
                    <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#004953] text-lg font-semibold">{doctor.name.charAt(0)}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{doctor.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{doctor.lastMessage}</p>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400">{doctor.timestamp}</span>
                  {doctor.online && <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1"></div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#F5FBFA] rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-[#004953]" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Conversations Found</h3>
            <p className="text-gray-500 max-w-xs">
              {searchQuery.trim() !== "" 
                ? "No doctors match your search criteria." 
                : "You haven't chatted with any doctors yet."}
            </p>
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
} 