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
  // Only override values if env vars are defined; otherwise keep app.json defaults
  const extra = {
    ...config.extra,
    EXPO_PUBLIC_SUPABASE_URL:
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? config.extra?.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? config.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? config.extra?.OPENAI_API_KEY,
    // Pass through all public IAP/RevenueCat vars so they're available via Constants.expoConfig.extra
    EXPO_PUBLIC_IAP_PRODUCT_MONTHLY:
      process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY ?? config.extra?.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY,
    EXPO_PUBLIC_RC_IOS_KEY:
      process.env.EXPO_PUBLIC_RC_IOS_KEY ?? config.extra?.EXPO_PUBLIC_RC_IOS_KEY,
    EXPO_PUBLIC_RC_ANDROID_KEY:
      process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? config.extra?.EXPO_PUBLIC_RC_ANDROID_KEY,
    EXPO_PUBLIC_RC_ENTITLEMENT_ID:
      process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID ?? config.extra?.EXPO_PUBLIC_RC_ENTITLEMENT_ID,
    EXPO_PUBLIC_DISABLE_PAYWALL:
      process.env.EXPO_PUBLIC_DISABLE_PAYWALL ?? config.extra?.EXPO_PUBLIC_DISABLE_PAYWALL,
  };

  return {
    ...config,
    extra,
  };
};
