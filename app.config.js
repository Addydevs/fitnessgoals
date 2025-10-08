// Usage example for environment variables in your app:
// import Constants from 'expo-constants';
// const supabaseUrl = Constants.expoConfig.extra.EXPO_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = Constants.expoConfig.extra.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// const openaiApiKey = Constants.expoConfig.extra.OPENAI_API_KEY;
// const cloudinaryUrl = Constants.expoConfig.extra.EXPO_PUBLIC_CLOUDINARY_URL;
// const uploadPreset = Constants.expoConfig.extra.EXPO_PUBLIC_UPLOAD_PRESET;
// const supabaseProjectRef = Constants.expoConfig.extra.EXPO_PUBLIC_SUPABASE_PROJECT_REF;
// expo app.config.js to inject env variables from .env
// Load .env if dotenv is available; don't crash if not installed yet
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch (_) {
  // noop – allow Expo CLI to run even before deps are installed
}

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  };
};
