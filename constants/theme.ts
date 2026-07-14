/**
 * StreakUp Theme Configuration
 * 
 * This file defines the core design system tokens for StreakUp, including colors,
 * typography, spacing, border radiuses, and animation configurations.
 * Supports light and dark modes with a modern, high-contrast, premium aesthetic.
 */

export const colors = {
  // Brand Colors
  primary: {
    light: '#FF4757', // Coral red for active streaks, energy, fire
    dark: '#FF5E6C',
  },
  secondary: {
    light: '#2ED573', // Emerald green for completed habits
    dark: '#2EE59D',
  },
  accent: {
    light: '#70A1FF', // Electric blue for stats, details, information
    dark: '#82B1FF',
  },
  warning: {
    light: '#FFA502', // Orange for warning, almost breaking streak
    dark: '#FFB82E',
  },
  
  // Neutral Colors (Light Mode)
  light: {
    background: '#F8F9FA',      // Clean, slightly cool background
    card: '#FFFFFF',            // Crisp white card background
    text: '#2F3542',            // Deep charcoal for high readability
    textMuted: '#747D8C',       // Muted slate for captions/subtitles
    border: '#E8ECEF',          // Subtle light divider lines
    overlay: 'rgba(0, 0, 0, 0.05)',
  },

  // Neutral Colors (Dark Mode)
  dark: {
    background: '#0F1115',      // Premium deep dark black/slate
    card: '#161920',            // Elevated slate card background
    text: '#F1F2F6',            // Crisp off-white text
    textMuted: '#A4B0BE',       // Muted text for secondary info
    border: '#2A2E3D',          // Dark divider lines
    overlay: 'rgba(255, 255, 255, 0.05)',
  },

  // Gradients (to be used with React Native Linear Gradient or custom components)
  gradients: {
    streak: ['#FF416C', '#FF4B2B'], // Red-orange energy fire gradient
    fitness: ['#11998E', '#38EF7D'], // Green active fitness gradient
    stats: ['#00C6FF', '#0072FF'], // Deep blue-sky blue stats gradient
    darkCard: ['#161920', '#1E2330'],
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const typography = {
  // Fonts family mapping
  fonts: {
    regular: 'System', // System default, can be updated to Outfit/Inter when custom fonts load
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Sizes & Weights
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 12,
    caption: 10,
  },
  
  lineHeights: {
    h1: 40,
    h2: 30,
    h3: 26,
    bodyLarge: 24,
    bodyMedium: 20,
    bodySmall: 16,
    caption: 14,
  }
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  })
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

export default theme;
