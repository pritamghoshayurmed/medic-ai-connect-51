import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole, phone: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  // Check if user is already logged in and set up auth state listener
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          try {
            // Get profile data
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;

            // Create user object from profile
            const userData: User = {
              id: profile.id,
              name: profile.full_name,
              email: profile.email,
              phone: profile.phone || '',
              role: profile.role as UserRole,
            };

            // If role is doctor, get doctor profile data
            if (profile.role === 'doctor') {
              const { data: doctorProfile, error: doctorError } = await supabase
                .from('doctor_profiles')
                .select('*')
                .eq('id', profile.id)
                .single();

              if (!doctorError && doctorProfile) {
                userData.profilePic = '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png';
              }
            }

            setUser(userData);
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Verify that the user has the correct role
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw new Error("Failed to fetch user profile");
        }

        // Check if user's role matches the selected role
        if (profile.role !== role) {
          await supabase.auth.signOut();
          throw new Error(`This account is registered as a ${profile.role}. Please select the correct user type.`);
        }
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole, phone: string) => {
    setIsLoading(true);
    try {
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
            phone
          }
        }
      });

      if (error) throw error;

      // Create the user profile manually since the trigger may not be set up yet
      if (data?.user) {
        // Insert into profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: name,
            role: role,
            phone: phone
          });
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        // If doctor, create doctor profile
        if (role === 'doctor') {
          const { error: doctorError } = await supabase
            .from('doctor_profiles')
            .insert({
              id: data.user.id,
              experience_years: 0,
              qualification: '',
              consultation_fee: 0,
              available_days: [],
              available_hours: {}
            });
          
          if (doctorError) {
            console.error("Error creating doctor profile:", doctorError);
          }
        }
      }

      toast({
        title: "Signup successful",
        description: "Your account has been created. You can now login.",
      });
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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
