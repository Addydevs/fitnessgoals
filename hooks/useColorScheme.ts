import React, { createContext, useContext } from 'react';
import { ColorSchemeName } from 'react-native';

export type ColorScheme = NonNullable<ColorSchemeName>;

interface ColorSchemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const ColorSchemeContext = createContext<ColorSchemeContextValue>({
  colorScheme: 'light',
  setColorScheme: () => {},
});

export function useColorScheme(): ColorScheme {
  return useContext(ColorSchemeContext).colorScheme;
}

export function useColorSchemeContext() {
  return useContext(ColorSchemeContext);
}
