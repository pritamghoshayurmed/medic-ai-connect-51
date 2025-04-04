
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect logged in users to their dashboard
    if (user) {
      navigate(user.role === "doctor" ? "/doctor" : "/patient");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white p-4">
      <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mb-8">
        <div className="text-white text-6xl font-bold">+</div>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-gray-800">MedicAI Connect</h1>
      <p className="text-gray-600 text-center mb-8">
        Your personal healthcare assistant, connecting patients with doctors and AI-powered diagnostics
      </p>

      <div className="space-y-4 w-full max-w-xs">
        <Button 
          className="w-full py-6" 
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
        <Button 
          variant="outline" 
          className="w-full py-6"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
};

export default Index;
