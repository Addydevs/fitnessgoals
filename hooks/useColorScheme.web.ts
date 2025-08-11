import { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '@/app/_layout';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const themeContext = useContext(ThemeContext);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // If ThemeContext is available, prefer it so user-selected theme is used.
  if (themeContext) {
    return themeContext.isDarkMode ? 'dark' : 'light';
  }

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
