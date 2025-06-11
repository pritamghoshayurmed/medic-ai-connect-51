import { useNavigate, useLocation } from "react-router-dom";
import { Home, Activity, Search, MessageSquare, User } from "lucide-react";
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

  const navigationItems = [
    {
      icon: <Home size={22} />,
      label: "Home",
      path: baseRoute,
    },
    {
      icon: <Activity size={22} />,
      label: "Vitals",
      path: `${baseRoute}/vitals`,
    },
    {
      icon: <Search size={22} />,
      label: "Find Doctor",
      path: `${baseRoute}/find-doctor`,
    },
    {
      icon: <MessageSquare size={22} />,
      label: "Chat",
      path: `${baseRoute}/chat`,
    },
    {
      icon: <User size={22} />,
      label: "Profile",
      path: `${baseRoute}/profile`,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t h-[70px] flex justify-around items-center z-50">
      {navigationItems.map((item, index) => (
        <button
          key={index}
          className={`flex flex-col items-center justify-center w-1/5 h-full ${
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
