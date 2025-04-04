
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, MessageSquare, User, PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  
  const baseRoute = user?.role === "doctor" ? "/doctor" : "/patient";

  const navigationItems = [
    {
      icon: <Home size={24} />,
      label: "Home",
      path: baseRoute,
    },
    {
      icon: <Calendar size={24} />,
      label: "Appointments",
      path: `${baseRoute}/appointments`,
    },
    {
      icon: <PlusCircle size={24} className="text-primary" />,
      label: user?.role === "patient" ? "Find Doctor" : "Diagnosis",
      path: user?.role === "patient" ? `${baseRoute}/find-doctor` : `${baseRoute}/diagnosis`,
    },
    {
      icon: <MessageSquare size={24} />,
      label: "Chat",
      path: user?.role === "patient" ? `${baseRoute}/ai-assistant` : `${baseRoute}/chat-rooms`,
    },
    {
      icon: <User size={24} />,
      label: "Profile",
      path: `${baseRoute}/profile`,
    },
  ];

  return (
    <div className="bottom-nav">
      {navigationItems.map((item, index) => (
        <button
          key={index}
          className={`bottom-nav-item ${isActive(item.path) ? "active" : ""}`}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
