export const colors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryDark: '#1D4ED8',
  
  // Status Colors
  active: '#22C55E',
  activeLight: '#DCFCE7',
  blocked: '#EF4444',
  blockedLight: '#FEE2E2',
  upcoming: '#F97316',
  upcomingLight: '#FFEDD5',

  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadowColor: '#0F172A',
};

export const shadows = {
  soft: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  card: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const borderRadius = {
  card: 18,
  pill: 20,
  button: 12,
};

export default { colors, shadows, borderRadius };
