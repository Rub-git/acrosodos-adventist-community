import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom colors for the Adventist Community App
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4A90E2', // Soft blue
    secondary: '#F5A623', // Warm gold
    tertiary: '#7B68EE', // Sabbath purple
    background: '#F7F7F7', // Light gray
    surface: '#FFFFFF',
    error: '#D32F2F',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A1A',
    onSurface: '#1A1A1A',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4A90E2',
    secondary: '#F5A623',
    tertiary: '#9B8FEE',
    background: '#121212',
    surface: '#1E1E1E',
    error: '#EF5350',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
  },
};

// Sabbath Mode colors (peaceful, calming)
export const sabbathColors = {
  primary: '#7B68EE', // Soft purple
  background: '#F0E6FF', // Very light purple
  surface: '#FFFFFF',
  text: '#4A4A4A',
};
