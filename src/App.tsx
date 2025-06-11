import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useRoutes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import { initializeDatabase, initializeUserTriggers } from "./utils/databaseInit";

// Error Boundary Components
import ErrorBoundary from "./components/ErrorBoundary";
import PageErrorBoundary from "./components/PageErrorBoundary";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import PatientDashboard from "./pages/patient/Dashboard";
import DoctorDashboard from "./pages/doctor/Dashboard";
import FindDoctor from "./pages/patient/FindDoctor";
import Appointments from "./pages/patient/Appointments";
import Chat from "./pages/Chat";
import DoctorChat from "./pages/doctor/DoctorChat";
import AiAssistant from "./pages/patient/AiAssistant";
import PatientAIChat from "./pages/patient/PatientAIChat";
import MedicationReminders from "./pages/patient/MedicationReminders";
import PatientProfile from "./pages/patient/Profile";
import DoctorProfile from "./pages/doctor/Profile";
import PatientDoctorProfile from "./pages/patient/DoctorProfile";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorAnalytics from "./pages/doctor/Analytics";
import DiagnosisEngine from "./pages/doctor/DiagnosisEngine";
import DoctorChatRooms from "./pages/doctor/ChatRooms";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Wrap children with ErrorBoundary to prevent crashes in protected routes
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

function AppWithAuth() {
  // Initialize the database on app startup
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        await initializeUserTriggers();
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };
    
    init();
  }, []);
  
  return (
    <>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} errorElement={<PageErrorBoundary />} />
          <Route path="/login" element={<Login />} errorElement={<PageErrorBoundary />} />
          <Route path="/signup" element={<Signup />} errorElement={<PageErrorBoundary />} />

          {/* Patient routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/patient/find-doctor"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <FindDoctor />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Appointments />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/patient/chat/:id"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Chat />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/patient/ai-assistant"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <AiAssistant />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/patient/ai-chat"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientAIChat />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/patient/medications"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <MedicationReminders />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientProfile />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/patient/doctor-profile/:id"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDoctorProfile />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />

          {/* Doctor routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorAppointments />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/doctor/analytics"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorAnalytics />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/doctor/diagnosis"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <ErrorBoundary>
                  <DiagnosisEngine />
                </ErrorBoundary>
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/doctor/chat-rooms"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorChatRooms />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/doctor/chat/:id"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorChat />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorProfile />
              </ProtectedRoute>
            }
            errorElement={<PageErrorBoundary />}
          />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} errorElement={<PageErrorBoundary />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppWithAuth />
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
