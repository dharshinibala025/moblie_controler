/**
 * globalStyles.js
 * Shared spacing, radius, and shadow tokens for the Admin Panel module.
 */

import { Platform } from 'react-native';
import colors from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  round: 999,
};

export const softShadow = Platform.select({
  ios: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
});

export const raisedShadow = Platform.select({
  ios: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 8 },
  default: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
});

export default { spacing, radius, softShadow, raisedShadow };
