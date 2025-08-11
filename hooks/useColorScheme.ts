import { useContext } from 'react';
import { ThemeContext } from '@/app/_layout';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Custom hook that returns the current color scheme for the app.
// It first tries to read the value from our ThemeContext (which is
// controlled by the user via the settings screen). If the context is
// not available, we fall back to the system color scheme provided by
// React Native. This ensures that toggling dark mode in settings
// affects the entire application.
export function useColorScheme() {
  const themeContext = useContext(ThemeContext);
  const systemScheme = useRNColorScheme();

  if (themeContext) {
    return themeContext.isDarkMode ? 'dark' : 'light';
  }

  return systemScheme;
}

