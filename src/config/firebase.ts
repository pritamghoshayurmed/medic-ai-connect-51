// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, Database, connectDatabaseEmulator } from "firebase/database";
import { getAuth, Auth, signInWithCustomToken, connectAuthEmulator } from "firebase/auth";
import { firebaseConfig, appConfig } from './environment';

// Firebase configuration is now loaded from centralized environment config
// This ensures proper validation and type safety

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized');
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error);
  }
}

export const database: Database = getDatabase(app);
export const firebaseAuth: Auth = getAuth(app);

// Configure Firebase for development/production
if (appConfig.isDevelopment) {
  console.log('Firebase initialized in development mode');
  console.log('Project ID:', firebaseConfig.projectId);
} else {
  console.log('Firebase initialized in production mode');
}

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    console.log('Database URL:', firebaseConfig.databaseURL);
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

// Export the app instance
export default app;

// Database paths constants
export const DB_PATHS = {
  DOCTOR_PATIENT_CHATS: 'chats/doctor-patient',
  AI_CHAT_HISTORY: 'chats/ai-history',
  USER_PRESENCE: 'presence',
  TYPING_STATUS: 'typing'
} as const;

export { analytics };
