/**
 * FocusSync Typography Styles
 */

import { StyleSheet } from 'react-native';
import colors from './colors';

export const typography = StyleSheet.create({
  // App Title (FocusSync)
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  
  // App Subtitle (Smart Classroom Mobile Usage Control)
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  
  // Card Titles (Welcome Back)
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  
  // Card Subtitle (Sign in to continue)
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Section Title (Select Your Role)
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Input Label
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  
  // Button Text
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 0.3,
  },
  
  // Role Text
  roleTextSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  roleTextUnselected: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  // Utility Link
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  
  // Footer text
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerHighlight: {
    fontWeight: '600',
    color: colors.primary,
  },
});

export default typography;
