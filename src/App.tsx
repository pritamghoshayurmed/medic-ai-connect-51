
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import { initializeDatabase } from "./utils/databaseInit";

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
import AiAssistant from "./pages/patient/AiAssistant";
import MedicationReminders from "./pages/patient/MedicationReminders";
import PatientProfile from "./pages/patient/Profile";
import DoctorProfile from "./pages/doctor/Profile";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorAnalytics from "./pages/doctor/Analytics";
import DiagnosisEngine from "./pages/doctor/DiagnosisEngine";
import DoctorChatRooms from "./pages/doctor/ChatRooms";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppWithAuth() {
  // Initialize the database on app startup
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);
  
  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Patient routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/find-doctor"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <FindDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Appointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/chat/:id"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/ai-assistant"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AiAssistant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/medications"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MedicationReminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientProfile />
            </ProtectedRoute>
          }
        />

        {/* Doctor routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/analytics"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/diagnosis"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DiagnosisEngine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/chat-rooms"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorChatRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/chat/:id"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorProfile />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
