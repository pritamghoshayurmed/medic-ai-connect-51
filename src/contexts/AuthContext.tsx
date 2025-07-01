import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "../types";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session, AuthError } from "@supabase/supabase-js";

// Extended interface with updateUserData function for profile updates
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  session: Session | null;
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
  const [isLoading, setIsLoading] = useState(true); // Reverted: Initialize to true
  const [explicitLoginInProgress, setExplicitLoginInProgress] = useState(false); // New state
  const [session, setSession] = useState<Session | null>(null);
  const { toast: uiToast } = useToast();
  const navigate = useNavigate();

  // Fetch user profile from database
  // Modified to not set loading state or user directly, and to use passed session.
  // Throws error on failure for the caller to handle.
  const fetchUserProfile = async (userId: string, currentSession: Session | null): Promise<User> => {
    if (!currentSession || !currentSession.access_token) {
      throw new Error("Attempted to fetch profile without a valid session token.");
    }

    // First, try to fetch the basic profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(); // Supabase client uses the active session's token by default

    if (error) {
      console.error('Error fetching user profile:', error);
      if (error.message.includes("JWT") || error.message.includes("Unauthorized") || error.message.includes("Auth session missing")) {
        throw new Error(`Auth error fetching profile: ${error.message}`);
      }
      throw error;
    }

    if (profile) {
      const userData: User = {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        role: profile.role as UserRole,
        profilePic: undefined, // Add profile pic logic later
      };

      // Role-specific profile fetching (optional, keep original logic structure)
      try {
        if (profile.role === 'doctor') {
          const { data: doctorProfile } = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (!doctorProfile) console.warn('Doctor profile not found, consider creating one.');
        } else if (profile.role === 'patient') {
          const { data: patientProfile } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          // If patient profile is not found, just log a warning.
          // Profile creation should be handled elsewhere (e.g., during signup or a dedicated profile setup step).
          if (!patientProfile) {
            console.warn(`Patient profile not found for user ${userId}. Consider creating one if needed.`);
          }
        }
      } catch (roleError) {
        console.warn('Error fetching role-specific profile:', roleError);
      }
      return userData;
    } else {
      throw new Error("User profile not found.");
    }
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const TIMEOUT_DURATION = 12000; // 12 seconds
    let initialLoadTimeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn(`AuthContext: Initial session processing timed out after ${TIMEOUT_DURATION}ms. Forcing UI unlock.`);
        setUser(null);
        setSession(null);
        setIsLoading(false); // Force unlock
        if (isMounted && window.location.pathname !== '/login') {
          toast.error("Session check timed out. Please log in.");
          navigate('/login');
        }
      }
    }, TIMEOUT_DURATION);

    const resolveInitialLoad = () => {
      if (isMounted) {
        clearTimeout(initialLoadTimeoutId);
        // Only set isLoading to false if an explicit login is NOT in progress.
        // The login function itself will handle setting isLoading to false.
        if (!explicitLoginInProgress) {
          setIsLoading(false);
        }
      }
    };

    const handleSessionRecovery = async (message: string) => {
      if (!isMounted) {
        // Still call resolveInitialLoad to clear timeout,
        // respecting explicitLoginInProgress state.
        resolveInitialLoad();
        return;
      }
      toast.error(message);
      await supabase.auth.signOut(); // This will trigger SIGNED_OUT event
      // setUser(null) and setSession(null) will be handled by onAuthStateChange for SIGNED_OUT
      // No need to call resolveInitialLoad here if SIGNED_OUT handler does it.
      // However, to ensure isLoading is managed if SIGNED_OUT doesn't fire or is delayed:
      if (isMounted && !explicitLoginInProgress) {
         setIsLoading(false);
      }
      // Let onAuthStateChange handle navigation for SIGNED_OUT if possible,
      // but navigate if still on a protected path.
      if (isMounted && window.location.pathname !== '/login') {
        navigate('/login');
      }
      // Ensure that isLoading is reset, even if navigation doesn't happen or other logic paths are taken.
      // This is crucial if handleSessionRecovery is called from places that don't immediately unmount or stop execution.
      resolveInitialLoad();
    };

    const handleAndValidateSession = async (currentSession: Session | null) => {
      if (!isMounted) {
        resolveInitialLoad();
        return;
      }
      // Removed redundant !isMounted check here

      if (currentSession?.user) {
        setSession(currentSession); // Set session immediately

        // Create preliminary user object
        const preliminaryUser: User = {
          id: currentSession.user.id,
          email: currentSession.user.email || 'N/A', // Email should exist
          name: currentSession.user.email?.split('@')[0] || 'User', // Placeholder name
          // role, phone, profilePic will be undefined initially due to User type change
        };
        setUser(preliminaryUser); // Set preliminary user data

        // Asynchronously fetch full user profile
        try {
          const fullUserProfile = await fetchUserProfile(currentSession.user.id, currentSession);
          if (isMounted) {
            setUser(fullUserProfile); // Update with full profile details
          }
        } catch (error) {
          console.error("AuthContext: Profile fetch failed during session validation:", error.message);
          if (isMounted) {
            // This error means we have a session but can't get the profile.
            // This is critical, so proceed to logout.
            await handleSessionRecovery(`Session error: Could not load user profile. Please log in again. Details: ${error.message}`);
            // handleSessionRecovery calls resolveInitialLoad after clearing session
            return; // Important to return here to prevent calling resolveInitialLoad again
          }
        }
        // If profile fetch is successful or if an error occurred and was handled by handleSessionRecovery (which itself calls resolveInitialLoad),
        // then resolve the initial load here.
        // This ensures isLoading is false only after profile is fetched or session is definitively cleared.
        resolveInitialLoad();

      } else {
        // No session or no user in session
        setUser(null);
        setSession(null);
        resolveInitialLoad();
      }
    };

    const processSession = async () => {
      try {
        const { data: { session: initialSession }, error: getSessionError } = await supabase.auth.getSession();
        if (getSessionError) {
          console.error("AuthContext: Error in getSession:", getSessionError);
          if (isMounted) {
            await handleSessionRecovery("Could not retrieve current session.");
          } else {
            resolveInitialLoad(); // Still resolve if unmounted
          }
          return;
        }

        if (isMounted) {
          await handleAndValidateSession(initialSession);
        } else {
          resolveInitialLoad(); // Still resolve if unmounted
        }
      } catch (error) { // Catch any unexpected errors during processSession
        console.error("AuthContext: Unexpected error in processSession:", error);
        if (isMounted) {
          await handleSessionRecovery("An unexpected error occurred while checking your session.");
        } else {
          resolveInitialLoad();
        }
      }
    };

    processSession();


    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authChangeEventSession) => {
        if (!isMounted) return;
        console.log("AuthContext: Auth event:", event, authChangeEventSession);

        // For SIGNED_OUT events, explicit signOut function handles setIsLoading.
        // User/session are cleared, and resolveInitialLoad is called.
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          resolveInitialLoad(); // Ensure loading state is correctly managed
        } else if (event === 'INITIAL_SESSION' && authChangeEventSession) {
          // This event can sometimes fire after the initial getSession() call.
          // We should re-validate this session.
          console.log("AuthContext: Received INITIAL_SESSION event. Re-validating.");
          await handleAndValidateSession(authChangeEventSession);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // For these events, the session has changed or user data might have.
          // We need to re-validate and fetch profile.
          // It's important that handleAndValidateSession itself manages isLoading correctly
          // or calls resolveInitialLoad appropriately.
           if (!explicitLoginInProgress) { // Only set loading if not part of an explicit login flow
             setIsLoading(true); // Indicate processing for these background updates
           }
          await handleAndValidateSession(authChangeEventSession);
        }
        // No specific 'else' that calls resolveInitialLoad, as handleAndValidateSession or SIGNED_OUT path should do it.
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(initialLoadTimeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]);

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
    setExplicitLoginInProgress(true); // Signal start of explicit login
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        // Verify user role matches selected role and fetch basic profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*') // Fetch all columns from profiles table
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          await supabase.auth.signOut(); // Sign out if profile can't be fetched
          console.error("Login error: Failed to fetch user profile.", profileError);
          throw new Error('Failed to fetch user profile. Please ensure your profile is set up.');
        }

        if (profileData.role !== role) {
          await supabase.auth.signOut();
          throw new Error(`Role mismatch. Please login as a ${profileData.role}.`);
        }

        const loggedInUser: User = {
          id: data.user.id,
          name: profileData.full_name,
          email: data.user.email!,
          phone: profileData.phone || '',
          role: profileData.role as UserRole,
          profilePic: profileData.profile_pic_url || undefined, // Assuming a column name like profile_pic_url
        };

        setUser(loggedInUser);
        setSession(data.session);
        // `onAuthStateChange` will still fire and call `handleAndValidateSession`.
        // `handleAndValidateSession` will then call `fetchUserProfile` which might fetch more details (e.g., patient/doctor specific tables).
        // This is acceptable as `fetchUserProfile` is the canonical source for the full User object.
        // The direct setUser here provides a quicker initial state update.

        toast.success('Login successful!');
        // Navigation is handled by the useEffect watching `user` and `isLoading` state.
        // No need to call setIsLoading(false) here if onAuthStateChange's handler does it via resolveInitialLoad.
        // However, for a cleaner flow from login perspective:
        setExplicitLoginInProgress(false); // Signal end of explicit login
        setIsLoading(false);

      } else {
        // This case should ideally be covered by the main error or data.user/session check,
        // but if it's reached, ensure states are reset.
        await supabase.auth.signOut().catch(e => console.error("Error signing out during login cleanup:", e)); // Attempt to sign out
        setUser(null);
        setSession(null);
        setExplicitLoginInProgress(false); // Signal end of explicit login
        setIsLoading(false);
        throw new Error("Login successful, but no user or session data received from Supabase.");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      // Ensure user/session are cleared and loading is stopped on any login error
      // signOut() might be too much if the error is, e.g., network before even hitting supabase.
      // But if an auth attempt was made and failed, or profile check failed, user should be null.
      // The role mismatch path already calls signOut.
      // If error is from signInWithPassword itself, session/user should not have been set.
      // If error is from profile fetch after signIn, signOut is called there.
      setUser(null); // Ensure user is cleared
      setSession(null); // Ensure session is cleared
      setExplicitLoginInProgress(false); // Signal end of explicit login
      setIsLoading(false);
      uiToast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error; // Re-throw for the calling component (e.g., Login.tsx)
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole, phone: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            phone: phone
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // The user profile will be created automatically by the trigger
        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success("Account created successfully! Please check your email to verify your account.");

        // Navigation will be handled by the auth state change listener
        // For now, redirect to login
        navigate('/login');
      }
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
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear user state
      setUser(null);
      setSession(null);

      // Navigate to login
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error('Failed to sign out');
    } finally {
      setExplicitLoginInProgress(false); // Ensure this is reset on any sign out
      setIsLoading(false);
    }
  };

  // Alias for backward compatibility
  const logout = signOut;

  // Add navigation effect when user state changes
  useEffect(() => {
    // Only navigate if user exists, role is defined, and not currently loading
    if (user && user.role && !isLoading) {
      const dashboardPath = user.role === "doctor" ? "/doctor" : "/patient";
      // Only navigate if we're not already on or under the correct dashboard path
      if (!window.location.pathname.startsWith(dashboardPath)) {
         // Avoid redirect loops from auth pages if role isn't loaded yet or if on splash
        const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(window.location.pathname);
        const isSplashPage = window.location.pathname === '/';

        if (!isAuthPage || isSplashPage) { // Navigate if not on an auth page, or if on splash page
            console.log(`AuthContext: Navigating to ${dashboardPath} from ${window.location.pathname} for user ${user.id} with role ${user.role}`);
            navigate(dashboardPath);
        }
      }
    }
  }, [user, user?.role, isLoading, navigate]); // Added user?.role to dependencies

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        session,
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
