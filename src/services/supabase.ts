// ============================================================================
// Supabase Client
// Initializes the Supabase JS client with AsyncStorage for persistent sessions
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key';

if (supabaseUrl === 'https://dummy.supabase.co') {
  console.error(
    '⚠️ SUPABASE CONFIG MISSING: Environment variables are not set. ' +
    'The app will not be able to connect to the backend.'
  );
}// In-memory backup storage to bypass broken native modules in local emulators or older Expo environments.
const memoryStorage: Record<string, string> = {};

// Custom safe storage adapter to prevent uncaught promise rejections.
// Seamlessly falls back to in-memory storage if AsyncStorage native modules are missing/broken.
const safeAsyncStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      delete memoryStorage[key];
    }
  },
};
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeAsyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not needed in React Native
  },
});
