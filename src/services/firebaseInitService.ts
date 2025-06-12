import { database, firebaseAuth, testFirebaseConnection } from '@/config/firebase';
import { firebaseAuthService } from './firebaseAuthService';
import { ref, set, get } from 'firebase/database';

class FirebaseInitService {
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;

  /**
   * Initialize Firebase services and test connectivity
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  private async performInitialization(): Promise<boolean> {
    try {
      console.log('🔥 Initializing Firebase services...');

      // Step 1: Test Firebase connection
      const connectionTest = await testFirebaseConnection();
      if (!connectionTest) {
        throw new Error('Firebase connection test failed');
      }

      // Step 2: Initialize authentication
      console.log('🔐 Initializing Firebase Authentication...');
      const user = await firebaseAuthService.ensureAuthenticated();
      console.log('✅ Firebase Authentication successful:', user.uid);

      // Step 3: Test database connectivity
      console.log('🗄️ Testing Firebase Database connectivity...');
      await this.testDatabaseConnectivity();

      // Step 4: Mark as initialized
      this.isInitialized = true;
      console.log('✅ Firebase initialization complete');

      return true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      this.initPromise = null;
      return false;
    }
  }

  /**
   * Test database connectivity by writing and reading a test value
   */
  private async testDatabaseConnectivity(): Promise<void> {
    try {
      const testRef = ref(database, 'test/connectivity');
      const testValue = {
        timestamp: Date.now(),
        test: true
      };

      // Write test data
      await set(testRef, testValue);
      console.log('✅ Database write test successful');

      // Read test data
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        console.log('✅ Database read test successful');
        
        // Clean up test data
        await set(testRef, null);
        console.log('✅ Database cleanup successful');
      } else {
        throw new Error('Database read test failed - no data found');
      }
    } catch (error) {
      console.error('❌ Database connectivity test failed:', error);
      throw error;
    }
  }

  /**
   * Check if Firebase is initialized
   */
  isFirebaseReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): {
    isInitialized: boolean;
    isAuthReady: boolean;
    isDatabaseReady: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      isAuthReady: firebaseAuthService.isAuthenticated(),
      isDatabaseReady: !!database
    };
  }

  /**
   * Force re-initialization (useful for error recovery)
   */
  async reinitialize(): Promise<boolean> {
    console.log('🔄 Force re-initializing Firebase...');
    this.isInitialized = false;
    this.initPromise = null;
    return this.initialize();
  }
}

export const firebaseInitService = new FirebaseInitService();
export default firebaseInitService;
