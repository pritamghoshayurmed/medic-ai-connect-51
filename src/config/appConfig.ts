// App Storage Versioning
export const APP_STORAGE_VERSION = "1.0.0";
export const APP_STORAGE_VERSION_KEY = "app_storage_version";

// Known Custom Local Storage Keys and Prefixes
// Used for clearing outdated storage on version change.

// Prefixes for keys that are dynamically generated (e.g., shared_report_XYZ)
export const CUSTOM_KEY_PREFIXES_TO_CLEAR = [
  "shared_report_", // For shared reports
];

// Exact keys for items stored directly by the application
export const CUSTOM_EXACT_KEYS_TO_CLEAR = [
  "geminiApiKey",                 // From DiagnosisEngine and doctorAiService
  "bookedAppointments",           // From patient appointment features
  "doctor_collaboration_invitations", // From collaborationService.ts (INVITATIONS_KEY)
  "doctor_collaborations",        // From collaborationService.ts (COLLABORATIONS_KEY)
  "doctor_ai_analysis_history",   // From doctorAiService.ts (LOCAL_STORAGE_HISTORY_KEY)
  // LOCAL_STORAGE_API_KEY from doctorAiService.ts is 'geminiApiKey', already included.
];
