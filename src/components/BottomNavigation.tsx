import { useNavigate, useLocation } from "react-router-dom";
import { Home, Activity, Search, MessageSquare, User, Calendar, Stethoscope, FileText as ArticlesIcon } from "lucide-react"; // Added ArticlesIcon
import { useAuth } from "@/contexts/AuthContext";

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Check if path starts with the given pattern
  const isActive = (path: string) => {
    // Special case for home (only exact match)
    if (path === "/patient" || path === "/doctor") {
      return location.pathname === path;
    }
    
    return location.pathname.startsWith(path);
  }
  
  const baseRoute = user?.role === "doctor" ? "/doctor" : "/patient";

  // Different navigation items for doctors and patients
  const doctorNavigationItems = [
    {
      icon: <Home size={22} />,
      label: "Home",
      path: "/doctor",
    },
    {
      icon: <Calendar size={22} />,
      label: "Appointments",
      path: "/doctor/appointments",
    },
    {
      icon: <Stethoscope size={22} />,
      label: "Diagnosis",
      path: "/doctor/diagnosis-engine",
    },
    {
      icon: <MessageSquare size={22} />,
      label: "Chat",
      path: "/doctor/chat-rooms",
    },
    {
      icon: <User size={22} />,
      label: "Profile",
      path: "/doctor/profile",
    },
  ];

  const patientNavigationItems = [
    {
      icon: <Home size={22} />,
      label: "Home",
      path: "/patient",
    },
    {
      icon: <Activity size={22} />,
      label: "Vitals",
      path: "/patient/vitals",
    },
    {
      icon: <Search size={22} />,
      label: "Find Doctor",
      path: "/patient/find-doctor",
    },
    { // New Articles Item
      icon: <ArticlesIcon size={22} />,
      label: "Articles",
      path: "/patient/articles",
    },
    {
      icon: <MessageSquare size={22} />,
      label: "Chat",
      path: "/patient/chat",
    },
    {
      icon: <User size={22} />,
      label: "Profile",
      path: "/patient/profile",
    },
  ];

  // Select the appropriate navigation items based on user role
  const itemsToDisplay = user?.role === "doctor" ? doctorNavigationItems : patientNavigationItems;
  const itemWidthClass = itemsToDisplay.length === 5 ? "w-1/5" : itemsToDisplay.length === 6 ? "w-1/6" : "w-auto";


  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t h-[70px] flex justify-around items-center z-50">
      {itemsToDisplay.map((item, index) => (
        <button
          key={index}
          className={`flex flex-col items-center justify-center h-full ${itemWidthClass} ${
            isActive(item.path) ? "text-[#00C389]" : "text-muted-foreground"
          }`}
          onClick={() => navigate(item.path)}
        >
          <div className={`${isActive(item.path) ? "text-[#00C389]" : "text-muted-foreground"}`}>
            {item.icon}
          </div>
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export default BottomNavigation;
