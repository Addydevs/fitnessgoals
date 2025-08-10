/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: tintColorLight, // '#0a7ea4'
    success: '#22c55e', // green
    warning: '#f59e0b', // amber
    info: '#3b82f6', // blue
    error: '#ef4444', // red
    surface: '#f3f4f6', // light gray
    textSecondary: '#687076', // same as icon
    secondary: '#60a5fa', // light blue
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#60a5fa', // blue
    success: '#22c55e', // green
    warning: '#f59e0b', // amber
    info: '#3b82f6', // blue
    error: '#ef4444', // red
    surface: '#27272a', // dark gray
    textSecondary: '#9BA1A6', // same as icon
    secondary: '#93c5fd', // lighter blue
  },
};
