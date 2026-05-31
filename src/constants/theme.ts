// ============================================================================
// PaniApp Design System
// A warm, premium, mobile-first design system for the Indian labor market
// ============================================================================

export const Colors = {
  // ─── Brand Colors ───────────────────────────────────────────────────
  primary: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107', // Primary amber — warmth & trust
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  accent: {
    50: '#E8EAF6',
    100: '#C5CAE9',
    200: '#9FA8DA',
    300: '#7986CB',
    400: '#5C6BC0',
    500: '#3F51B5', // Indigo accent — professionalism
    600: '#3949AB',
    700: '#303F9F',
    800: '#283593',
    900: '#1A237E',
  },

  // ─── Semantic Colors ────────────────────────────────────────────────
  success: {
    light: '#E8F5E9',
    main: '#4CAF50',
    dark: '#2E7D32',
  },
  warning: {
    light: '#FFF3E0',
    main: '#FF9800',
    dark: '#E65100',
  },
  error: {
    light: '#FFEBEE',
    main: '#F44336',
    dark: '#C62828',
  },
  info: {
    light: '#E3F2FD',
    main: '#2196F3',
    dark: '#1565C0',
  },

  // ─── Neutral Palette ───────────────────────────────────────────────
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },

  // ─── Dark Mode ─────────────────────────────────────────────────────
  dark: {
    background: '#0F1120',
    surface: '#1A1D32',
    surfaceElevated: '#242842',
    border: '#2E3354',
    textPrimary: '#EEEEF0',
    textSecondary: '#9BA1B7',
    textMuted: '#5D6380',
  },

  // ─── Light Mode ────────────────────────────────────────────────────
  light: {
    background: '#F8F9FC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E8EBF0',
    textPrimary: '#1A1D32',
    textSecondary: '#5D6380',
    textMuted: '#9BA1B7',
  },

  // ─── Gradients (as array tuples for LinearGradient) ────────────────
  gradients: {
    worker: ['#FF8F00', '#FFB300', '#FFCA28'] as const,
    recruiter: ['#283593', '#3F51B5', '#5C6BC0'] as const,
    gold: ['#FF8F00', '#FFC107'] as const,
    sunset: ['#FF6F00', '#FF9800', '#FFC107'] as const,
    ocean: ['#1A237E', '#3F51B5', '#7986CB'] as const,
    card: ['#FFFFFF', '#F8F9FC'] as const,
    darkCard: ['#1A1D32', '#242842'] as const,
  },

  // ─── Online/Offline Status ─────────────────────────────────────────
  online: '#4CAF50',
  offline: '#9E9E9E',
  busy: '#FF9800',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const Typography = {
  // Font families — will be loaded via expo-font
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    black: 'Inter_900Black',
  },

  // ─── Type Scale ────────────────────────────────────────────────────
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },

  lineHeight: {
    xs: 16,
    sm: 18,
    base: 22,
    md: 24,
    lg: 28,
    xl: 32,
    '2xl': 38,
    '3xl': 44,
    '4xl': 56,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  }),
} as const;

// ─── Predefined Skill Categories ───────────────────────────────────────
export const SKILL_CATEGORIES = [
  { id: 'construction', label: 'Construction', icon: '🏗️', labelTe: 'నిర్మాణం', labelHi: 'निर्माण' },
  { id: 'painting', label: 'Painting', icon: '🎨', labelTe: 'పెయింటింగ్', labelHi: 'पेंटिंग' },
  { id: 'plumbing', label: 'Plumbing', icon: '🔧', labelTe: 'ప్లంబింగ్', labelHi: 'प्लंबिंग' },
  { id: 'electrical', label: 'Electrical', icon: '⚡', labelTe: 'ఎలక్ట్రికల్', labelHi: 'इलेक्ट्रिकल' },
  { id: 'carpentry', label: 'Carpentry', icon: '🪚', labelTe: 'వడ్రంగం', labelHi: 'बढ़ईगीरी' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹', labelTe: 'శుభ్రపరచడం', labelHi: 'सफाई' },
  { id: 'gardening', label: 'Gardening', icon: '🌱', labelTe: 'తోటపని', labelHi: 'बागवानी' },
  { id: 'driving', label: 'Driving', icon: '🚗', labelTe: 'డ్రైవింగ్', labelHi: 'ड्राइविंग' },
  { id: 'cooking', label: 'Cooking', icon: '👨‍🍳', labelTe: 'వంట', labelHi: 'खाना बनाना' },
  { id: 'loading', label: 'Loading/Unloading', icon: '📦', labelTe: 'లోడింగ్', labelHi: 'लोडिंग' },
  { id: 'farming', label: 'Farming', icon: '🌾', labelTe: 'వ్యవసాయం', labelHi: 'खेती' },
  { id: 'welding', label: 'Welding', icon: '🔥', labelTe: 'వెల్డింగ్', labelHi: 'वेल्डिंग' },
  { id: 'masonry', label: 'Masonry', icon: '🧱', labelTe: 'మేస్ట్రీ', labelHi: 'राजमिस्त्री' },
  { id: 'tailoring', label: 'Tailoring', icon: '🧵', labelTe: 'టైలరింగ్', labelHi: 'सिलाई' },
  { id: 'other', label: 'Other', icon: '🛠️', labelTe: 'ఇతర', labelHi: 'अन्य' },
] as const;

// ─── App Config ────────────────────────────────────────────────────────
export const APP_CONFIG = {
  DEFAULT_SEARCH_RADIUS_KM: 10,
  MAX_SEARCH_RADIUS_KM: 50,
  CURRENCY_SYMBOL: '₹',
  DEFAULT_LANGUAGE: 'en' as const,
  SUPPORTED_LANGUAGES: ['en', 'te', 'hi'] as const,
  OTP_LENGTH: 6,
  OTP_RESEND_SECONDS: 60,
  COUNTRY_CODE: '+91',
  PHONE_LENGTH: 10,
} as const;
