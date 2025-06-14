import {
  APP_STORAGE_VERSION,
  APP_STORAGE_VERSION_KEY,
  CUSTOM_EXACT_KEYS_TO_CLEAR,
  CUSTOM_KEY_PREFIXES_TO_CLEAR
} from '../config/appConfig'; // Adjusted path assuming utils is sibling to config

export function checkAndClearOldVersionLocalStorage() {
  const storedVersion = localStorage.getItem(APP_STORAGE_VERSION_KEY);

  if (storedVersion !== APP_STORAGE_VERSION) {
    console.log(
      `Old storage version detected (Stored: ${storedVersion}, Current: ${APP_STORAGE_VERSION}). Clearing custom app data.`
    );

    // Clear known exact keys
    CUSTOM_EXACT_KEYS_TO_CLEAR.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`Removed item: ${key}`);
      } catch (error) {
        console.error(`Error removing item ${key}:`, error);
      }
    });

    // Clear keys matching prefixes
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Avoid clearing Supabase/Firebase keys, other common SDK keys, or our own version key
        if (
          key.startsWith('sb-') ||             // Supabase
          key.startsWith('supabase') ||        // Supabase (alt)
          key.startsWith('firebase:') ||       // Firebase
          key.startsWith('gtm') ||             // Google Tag Manager
          key.startsWith('_ga') ||             // Google Analytics
          key.startsWith('amplitude') ||       // Amplitude
          key === APP_STORAGE_VERSION_KEY
        ) {
          continue;
        }

        CUSTOM_KEY_PREFIXES_TO_CLEAR.forEach(prefix => {
          if (key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        });
      }
    }

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`Removed item matching prefix: ${key}`);
      } catch (error) {
        console.error(`Error removing item matching prefix ${key}:`, error);
      }
    });

    try {
      localStorage.setItem(APP_STORAGE_VERSION_KEY, APP_STORAGE_VERSION);
      console.log(`Set storage version to: ${APP_STORAGE_VERSION}`);
    } catch (error) {
      console.error(`Error setting storage version ${APP_STORAGE_VERSION_KEY}:`, error);
    }
  } else {
    console.log(`Storage version is up to date (Version: ${APP_STORAGE_VERSION}).`);
  }
}
