import { firebaseAuth } from '@/config/firebase';
import { signInAnonymously, onAuthStateChanged, User, connectAuthEmulator } from 'firebase/auth';

class FirebaseAuthService {
  private currentUser: User | null = null;
  private authPromise: Promise<User> | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize Firebase Auth with proper configuration
   */
  private async initializeAuth() {
    try {
      // Skip emulator connection in development - use production Firebase directly
      console.log('Initializing Firebase Auth for production...');

      // Listen to auth state changes
      onAuthStateChanged(firebaseAuth, (user) => {
        this.currentUser = user;
        console.log('Firebase auth state changed:', user ? `signed in as ${user.uid}` : 'signed out');
      });

      this.isInitialized = true;
      console.log('Firebase Auth initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Auth:', error);
      throw error;
    }
  }

  /**
   * Ensure user is authenticated with Firebase
   * Uses anonymous authentication for simplicity
   */
  async ensureAuthenticated(): Promise<User> {
    try {
      // Wait for initialization if needed
      if (!this.isInitialized) {
        console.log('Initializing Firebase Auth...');
        await this.initializeAuth();
        // Give more time for auth state to settle
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // If already authenticated, return current user
      if (this.currentUser) {
        console.log('Using existing Firebase user:', this.currentUser.uid);
        return this.currentUser;
      }

      // If authentication is in progress, wait for it
      if (this.authPromise) {
        console.log('Waiting for existing authentication promise...');
        return this.authPromise;
      }

      // Start authentication process
      console.log('Starting new Firebase authentication...');
      this.authPromise = this.authenticateUser();

      try {
        const user = await this.authPromise;
        this.authPromise = null;
        return user;
      } catch (error) {
        this.authPromise = null;
        throw error;
      }
    } catch (error) {
      console.error('Error in ensureAuthenticated:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with Firebase using anonymous auth
   */
  private async authenticateUser(): Promise<User> {
    try {
      console.log('Attempting Firebase anonymous authentication...');
      console.log('Firebase Auth instance:', !!firebaseAuth);

      // Check if Firebase Auth is ready
      if (!firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }

      // Add timeout to prevent hanging
      const authPromise = signInAnonymously(firebaseAuth);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Authentication timeout after 10 seconds')), 10000)
      );

      const userCredential = await Promise.race([authPromise, timeoutPromise]) as any;
      const user = userCredential.user;

      if (!user) {
        throw new Error('Authentication succeeded but no user returned');
      }

      console.log('Firebase authentication successful:', user.uid);
      this.currentUser = user;

      return user;
    } catch (error: any) {
      console.error('Firebase authentication failed:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error);

      // Provide more specific error messages
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('❌ Anonymous authentication is not enabled in Firebase Console. Please enable it in Authentication → Sign-in method → Anonymous');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('❌ Network error - check your internet connection and Firebase project settings');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('❌ Too many authentication attempts - please try again later');
      } else if (error.message?.includes('timeout')) {
        throw new Error('❌ Authentication timeout - check your network connection and Firebase configuration');
      } else {
        throw new Error(`❌ Firebase authentication failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Sign out from Firebase
   */
  async signOut(): Promise<void> {
    try {
      await firebaseAuth.signOut();
      this.currentUser = null;
      console.log('Signed out from Firebase');
    } catch (error) {
      console.error('Error signing out from Firebase:', error);
      throw error;
    }
  }

  /**
   * Get Firebase user ID for database operations
   */
  async getUserId(): Promise<string> {
    const user = await this.ensureAuthenticated();
    return user.uid;
  }
}

export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
