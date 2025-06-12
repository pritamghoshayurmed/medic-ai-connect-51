import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "../types";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Extended interface with updateUserData function for profile updates
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut for backward compatibility
  updateUserData: (userData: User) => void; // For profile updates
  setMockRole: (role: UserRole) => void; // For bypassing auth during testing
}

// Mock user data for development
const mockPatientUser: User = {
  id: "mock-patient-id",
  name: "Test Patient",
  email: "patient@example.com",
  phone: "123-456-7890",
  role: "patient",
  profilePic: "/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png"
};

const mockDoctorUser: User = {
  id: "mock-doctor-id",
  name: "Dr. Test Doctor",
  email: "doctor@example.com",
  phone: "123-456-7890",
  role: "doctor",
  profilePic: "/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png"
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast: uiToast } = useToast();
  const navigate = useNavigate();

  // Function to update user data (for profile updates)
  const updateUserData = (userData: User) => {
    setUser(userData);
  };

  // Function to switch between mock roles for testing
  const setMockRole = (role: UserRole) => {
    if (role === 'patient') {
      setUser(mockPatientUser);
      navigate('/patient');
    } else {
      setUser(mockDoctorUser);
      navigate('/doctor');
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      // Mock login delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      if (role === 'patient') {
        setUser({
          ...mockPatientUser,
          email
        });
        navigate('/patient');
      } else if (role === 'doctor') {
        setUser({
          ...mockDoctorUser,
          email,
          role: 'doctor'
        });
        navigate('/doctor');
      }
      
      setIsLoading(false);
      return;
    } catch (error: any) {
      console.error("Login failed:", error);
      uiToast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole, phone: string) => {
    setIsLoading(true);
    try {
      // Mock signup delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a user object based on role
      const newUser = role === 'doctor' ? {
        ...mockDoctorUser,
        name,
        email,
        phone
      } : {
        ...mockPatientUser,
        name,
        email,
        phone
      };
      
      // Set the user in state
      setUser(newUser);
      
      // Mock successful signup
      toast.success("Account created successfully!");
      setIsLoading(false);
      
      // Navigate based on role
      if (role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/patient');
      }
      return;
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast.error(error.message || "Failed to create account");
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Mock logout delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear user
      setUser(null);
      
      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for backward compatibility
  const logout = signOut;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        signOut,
        logout,
        updateUserData,
        setMockRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
