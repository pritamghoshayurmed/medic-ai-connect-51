import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { createGlobalStyle } from 'styled-components';

// Error Boundary Components
import ErrorBoundary from "./components/ErrorBoundary";
import PageErrorBoundary from "./components/PageErrorBoundary";

// Auth Pages
import SplashScreen from "./pages/auth/SplashScreen";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Pages
import NotFound from "./pages/NotFound";
import PatientDashboard from "./pages/patient/Dashboard";
import DoctorDashboard from "./pages/doctor/Dashboard";

// Patient Pages
import PatientVitals from "./pages/patient/Vitals";
import PatientFindDoctor from "./pages/patient/FindDoctor";
import PatientAppointments from "./pages/patient/Appointments";
import PatientProfile from "./pages/patient/Profile";
import DoctorProfile from "./pages/patient/DoctorProfile";
import MedicationReminders from "./pages/patient/MedicationReminders";
import PatientAIChat from "./pages/patient/PatientAIChat";
import DoctorPatientChat from "./pages/patient/DoctorPatientChat";
import PatientChat from "./pages/patient/Chat";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Roboto', sans-serif;
  }

  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }
`;

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

  // Mock user for development - remove or comment this for production
  const BYPASS_AUTH = true;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Either check for valid user with correct role OR bypass authentication in dev mode
  if ((!user || !allowedRoles.includes(user.role)) && !BYPASS_AUTH) {
    return <Navigate to="/login" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

function AppContent() {
  return (
    <>
      <GlobalStyle />
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

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
          path="/patient/vitals"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientVitals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/find-doctor"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientFindDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAppointments />
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
        <Route
          path="/patient/doctor-profile/:id"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DoctorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/book-appointment/:id"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/medication-reminders"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MedicationReminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/ai-chat"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAIChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/doctor-chat"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DoctorPatientChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/doctor-chat/:id"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DoctorPatientChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/chat"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientChat />
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

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
