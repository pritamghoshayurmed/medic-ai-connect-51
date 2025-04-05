import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

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
        console.log("Auth state changed:", event, session);
        setSession(session);
        
        if (session?.user) {
          try {
            // Get profile data
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error("Error fetching profile:", profileError);
              throw profileError;
            }

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

            console.log("Setting user data:", userData);
            setUser(userData);
          } catch (error) {
            console.error("Error fetching user profile:", error);
            // Clear session on error
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session);
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
      console.log(`Attempting login with email: ${email}, role: ${role}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error from Supabase:", error);
        throw error;
      }

      console.log("Login successful, checking user profile...");

      // Verify that the user exists in the profiles table
      if (data.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.log("Profile not found, creating new profile...");
            // If profile doesn't exist, create it using the metadata
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: data.user.email || email,
                full_name: data.user.user_metadata?.full_name || email.split('@')[0],
                role: role,
                phone: data.user.user_metadata?.phone || ''
              }, { onConflict: 'id' });
              
            if (insertError) {
              console.error("Error creating missing profile:", insertError);
              // Continue anyway - don't throw error here
            } else {
              console.log("Profile created successfully");
            }
          } else if (profile.role !== role) {
            // Role mismatch, sign out and throw error
            console.error(`Role mismatch: User is a ${profile.role} but trying to log in as ${role}`);
            await supabase.auth.signOut();
            throw new Error(`This account is registered as a ${profile.role}. Please select the correct user type.`);
          } else {
            console.log("Profile validation successful");
            
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

            // Set the user explicitly after successful login
            setUser(userData);
          }
        } catch (profileError) {
          console.error("Error checking user profile:", profileError);
          // Continue anyway
        }
      }
      
      console.log("Login process completed successfully");
      return;
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
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

      if (data?.user) {
        // Insert into profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            full_name: name,
            role: role,
            phone: phone
          }, { onConflict: 'id' });
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Try to continue even if there's an error with profile creation
          // The database trigger might handle this
        }

        // If doctor, create doctor profile
        if (role === 'doctor') {
          const { error: doctorError } = await supabase
            .from('doctor_profiles')
            .upsert({
              id: data.user.id,
              experience_years: 0,
              qualification: '',
              consultation_fee: 0,
              available_days: [],
              available_hours: {}
            }, { onConflict: 'id' });
          
          if (doctorError) {
            console.error("Error creating doctor profile:", doctorError);
          }
        }
      }

      toast({
        title: "Signup successful",
        description: "Your account has been created. You can now login.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "There was an error creating your account",
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
