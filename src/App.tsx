import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { createGlobalStyle } from 'styled-components';
import { checkAndClearOldVersionLocalStorage } from "./utils/localStorageUtils"; // Import the version checker
import { lazy, Suspense } from 'react'; // Import lazy and Suspense

// Error Boundary Components
import ErrorBoundary from "./components/ErrorBoundary";
// import PageErrorBoundary from "./components/PageErrorBoundary"; // Assuming this might be used differently or within lazy pages

// Auth Pages
const SplashScreen = lazy(() => import("./pages/auth/SplashScreen"));
const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));

// Pages
const NotFound = lazy(() => import("./pages/NotFound"));
const PatientDashboard = lazy(() => import("./pages/patient/Dashboard"));
const DoctorDashboard = lazy(() => import("./pages/doctor/Dashboard"));

// Patient Pages
const PatientVitals = lazy(() => import("./pages/patient/Vitals"));
const PatientFindDoctor = lazy(() => import("./pages/patient/FindDoctor"));
const PatientAppointments = lazy(() => import("./pages/patient/Appointments"));
const PatientProfile = lazy(() => import("./pages/patient/Profile"));
const DoctorProfile = lazy(() => import("./pages/patient/DoctorProfile")); // Patient view of Doctor Profile
const MedicationReminders = lazy(() => import("./pages/patient/MedicationReminders"));
const PatientAIChatFirebase = lazy(() => import("./pages/patient/PatientAIChatFirebase"));
const FirebaseTestComponent = lazy(() => import("./components/FirebaseTestComponent"));
const PatientAIChat = PatientAIChatFirebase; // Use Firebase version (already lazy)
const AiAssistant = lazy(() => import("./pages/patient/AiAssistant"));
const DoctorPatientChat = lazy(() => import("./pages/patient/DoctorPatientChat"));
const PatientChat = lazy(() => import("./pages/patient/Chat"));
const BookAppointment = lazy(() => import("./pages/patient/BookAppointment"));

// Doctor Pages
const DoctorAppointments = lazy(() => import("./pages/doctor/Appointments"));
const DiagnosisEngine = lazy(() => import("./pages/doctor/DiagnosisEngine"));
const ChatRooms = lazy(() => import("./pages/doctor/ChatRooms"));
const DoctorChat = lazy(() => import("./pages/doctor/DoctorChat"));
const DoctorProfilePage = lazy(() => import("./pages/doctor/Profile")); // Doctor's own profile page
const DoctorAnalytics = lazy(() => import("./pages/doctor/Analytics"));

// Admin Pages
const DatabaseSetup = lazy(() => import("./pages/admin/DatabaseSetup"));

// Shared Pages
const SharedReport = lazy(() => import("./pages/SharedReport"));

// Import test utilities for debugging
import "./utils/testAuth";

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

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Check for valid user with correct role
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

function AppContent() {
  return (
    <>
      <GlobalStyle />
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-xl font-semibold">Loading page...</div>}>
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/firebase-test" element={<FirebaseTestComponent />} />

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
              <BookAppointment />
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
          path="/patient/ai-assistant"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AiAssistant />
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
          path="/patient/ai-chat/:conversationId"
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
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/diagnosis-engine"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DiagnosisEngine />
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
          path="/doctor/chat-rooms"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <ChatRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/doctor-chat/:id"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/chat/:id"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route path="/admin/database-setup" element={<DatabaseSetup />} />

        {/* Shared routes (no authentication required) */}
        <Route path="/shared-report/:reportId" element={<SharedReport />} />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </>
  );
}

const App = () => {
  checkAndClearOldVersionLocalStorage(); // Call the version checker early

  return (
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
}; // Added closing brace and semicolon for the App arrow function

export default App;
