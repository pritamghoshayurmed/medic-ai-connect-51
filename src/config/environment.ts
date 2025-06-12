/**
 * Environment Configuration and Validation
 * Centralizes all environment variable access and validation
 */

// Environment variable interface for type safety
interface EnvironmentConfig {
  // Application
  APP_ENV: string;
  APP_URL: string;
  
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // Firebase
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_DATABASE_URL: string;
  FIREBASE_MEASUREMENT_ID?: string;
  
  // AI Services
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  
  // Feature Flags
  ENABLE_DOCTOR_AI: boolean;
  ENABLE_AI_CHAT: boolean;
  ENABLE_IMAGE_ANALYSIS: boolean;
  ENABLE_DOCTOR_COLLABORATION: boolean;
  ENABLE_EXPORT_FEATURES: boolean;
  ENABLE_SHARE_FEATURES: boolean;
  
  // Configuration
  MAX_FILE_SIZE: number;
  API_TIMEOUT: number;
}

// Helper function to parse boolean environment variables
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

// Helper function to parse number environment variables
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Load and validate environment variables
const loadEnvironmentConfig = (): EnvironmentConfig => {
  const config: EnvironmentConfig = {
    // Application
    APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
    APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    
    // Supabase
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    
    // Firebase
    FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
    FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',
    FIREBASE_DATABASE_URL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    
    // AI Services
    GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    
    // Feature Flags
    ENABLE_DOCTOR_AI: parseBoolean(import.meta.env.VITE_ENABLE_DOCTOR_AI, true),
    ENABLE_AI_CHAT: parseBoolean(import.meta.env.VITE_ENABLE_AI_CHAT, true),
    ENABLE_IMAGE_ANALYSIS: parseBoolean(import.meta.env.VITE_ENABLE_IMAGE_ANALYSIS, true),
    ENABLE_DOCTOR_COLLABORATION: parseBoolean(import.meta.env.VITE_ENABLE_DOCTOR_COLLABORATION, true),
    ENABLE_EXPORT_FEATURES: parseBoolean(import.meta.env.VITE_ENABLE_EXPORT_FEATURES, true),
    ENABLE_SHARE_FEATURES: parseBoolean(import.meta.env.VITE_ENABLE_SHARE_FEATURES, true),
    
    // Configuration
    MAX_FILE_SIZE: parseNumber(import.meta.env.VITE_MAX_FILE_SIZE, 10485760), // 10MB default
    API_TIMEOUT: parseNumber(import.meta.env.VITE_API_TIMEOUT, 30000), // 30 seconds default
  };

  return config;
};

// Validate required environment variables
const validateEnvironmentConfig = (config: EnvironmentConfig): void => {
  const errors: string[] = [];
  
  // Required variables for basic functionality
  const requiredVars = [
    { key: 'SUPABASE_URL', value: config.SUPABASE_URL },
    { key: 'SUPABASE_ANON_KEY', value: config.SUPABASE_ANON_KEY },
    { key: 'FIREBASE_API_KEY', value: config.FIREBASE_API_KEY },
    { key: 'FIREBASE_AUTH_DOMAIN', value: config.FIREBASE_AUTH_DOMAIN },
    { key: 'FIREBASE_PROJECT_ID', value: config.FIREBASE_PROJECT_ID },
    { key: 'FIREBASE_STORAGE_BUCKET', value: config.FIREBASE_STORAGE_BUCKET },
    { key: 'FIREBASE_MESSAGING_SENDER_ID', value: config.FIREBASE_MESSAGING_SENDER_ID },
    { key: 'FIREBASE_APP_ID', value: config.FIREBASE_APP_ID },
    { key: 'FIREBASE_DATABASE_URL', value: config.FIREBASE_DATABASE_URL },
  ];

  // Check for missing required variables
  requiredVars.forEach(({ key, value }) => {
    if (!value || value.trim() === '' || value === `your_${key.toLowerCase()}_here`) {
      errors.push(`Missing or invalid environment variable: VITE_${key}`);
    }
  });

  // Validate URLs
  if (config.SUPABASE_URL && !config.SUPABASE_URL.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must be a valid HTTPS URL');
  }

  if (config.FIREBASE_DATABASE_URL && !config.FIREBASE_DATABASE_URL.startsWith('https://')) {
    errors.push('VITE_FIREBASE_DATABASE_URL must be a valid HTTPS URL');
  }

  // Warn about missing optional but important variables
  const warnings: string[] = [];
  
  if (!config.GEMINI_API_KEY && config.ENABLE_DOCTOR_AI) {
    warnings.push('VITE_GEMINI_API_KEY is not set - AI features will require manual API key entry');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn(`⚠️  ${warning}`));
  }

  // Throw error if critical variables are missing
  if (errors.length > 0) {
    console.error('Environment Configuration Errors:');
    errors.forEach(error => console.error(`❌ ${error}`));
    
    if (config.APP_ENV === 'production') {
      throw new Error(`Missing required environment variables in production: ${errors.join(', ')}`);
    } else {
      console.error('⚠️  Application may not function correctly with missing environment variables');
    }
  }
};

// Load and validate configuration
const environmentConfig = loadEnvironmentConfig();
validateEnvironmentConfig(environmentConfig);

// Export configuration
export default environmentConfig;

// Export individual config sections for convenience
export const appConfig = {
  env: environmentConfig.APP_ENV,
  url: environmentConfig.APP_URL,
  isProduction: environmentConfig.APP_ENV === 'production',
  isDevelopment: environmentConfig.APP_ENV === 'development',
};

export const supabaseConfig = {
  url: environmentConfig.SUPABASE_URL,
  anonKey: environmentConfig.SUPABASE_ANON_KEY,
};

export const firebaseConfig = {
  apiKey: environmentConfig.FIREBASE_API_KEY,
  authDomain: environmentConfig.FIREBASE_AUTH_DOMAIN,
  projectId: environmentConfig.FIREBASE_PROJECT_ID,
  storageBucket: environmentConfig.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: environmentConfig.FIREBASE_MESSAGING_SENDER_ID,
  appId: environmentConfig.FIREBASE_APP_ID,
  databaseURL: environmentConfig.FIREBASE_DATABASE_URL,
  measurementId: environmentConfig.FIREBASE_MEASUREMENT_ID,
};

export const aiConfig = {
  geminiApiKey: environmentConfig.GEMINI_API_KEY,
  openaiApiKey: environmentConfig.OPENAI_API_KEY,
};

export const featureFlags = {
  enableDoctorAI: environmentConfig.ENABLE_DOCTOR_AI,
  enableAIChat: environmentConfig.ENABLE_AI_CHAT,
  enableImageAnalysis: environmentConfig.ENABLE_IMAGE_ANALYSIS,
  enableDoctorCollaboration: environmentConfig.ENABLE_DOCTOR_COLLABORATION,
  enableExportFeatures: environmentConfig.ENABLE_EXPORT_FEATURES,
  enableShareFeatures: environmentConfig.ENABLE_SHARE_FEATURES,
};

export const appLimits = {
  maxFileSize: environmentConfig.MAX_FILE_SIZE,
  apiTimeout: environmentConfig.API_TIMEOUT,
};

// Utility function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof featureFlags): boolean => {
  return featureFlags[feature];
};

// Utility function to get environment-specific configuration
export const getEnvironmentSpecificConfig = () => {
  const baseConfig = {
    apiTimeout: appLimits.apiTimeout,
    maxFileSize: appLimits.maxFileSize,
  };

  if (appConfig.isProduction) {
    return {
      ...baseConfig,
      enableDebugLogs: false,
      enableMockData: false,
      strictErrorHandling: true,
    };
  }

  return {
    ...baseConfig,
    enableDebugLogs: true,
    enableMockData: false,
    strictErrorHandling: false,
  };
};
