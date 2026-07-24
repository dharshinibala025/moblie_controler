import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ICON_MAP = {
  // Navigation & Core UI
  home: '🏠',
  analytics: '📊',
  chart: '📈',
  apps: '📱',
  grid: '🔲',
  bell: '🔔',
  user: '👤',
  profile: '👨‍🎓',
  shield: '🛡️',
  'shield-check': '🛡️',
  'shield-alert': '⚠️',
  'shield-off': '🔓',
  lock: '🔒',
  unlock: '🔓',
  key: '🔑',
  battery: '🔋',
  wifi: '📶',
  globe: '🌐',
  internet: '⚡',
  check: '✓',
  'check-circle': '✅',
  alert: '⚠️',
  info: 'ℹ️',
  time: '⏰',
  clock: '🕒',
  calendar: '📅',
  book: '📚',
  phone: '📞',
  email: '✉️',
  mail: '📧',
  building: '🏢',
  office: '🏫',
  logout: '🚪',
  refresh: '🔄',
  search: '🔍',
  filter: '🌪️',
  'chevron-right': '›',
  'chevron-left': '‹',
  close: '✕',
  plus: '+',

  // Stats Icons
  screen: '🖥️',
  target: '🎯',
  history: '📜',
  sparkles: '✨',

  // Blocked App Icons
  instagram: '📸',
  facebook: '👍',
  whatsapp: '💬',
  youtube: '▶️',
  snapchat: '👻',
  telegram: '✈️',
  twitter: '𝕏',
  discord: '🎮',
  gamepad: '🎮',
  'gamepad-variant': '👾',
  movie: '🎬',

  // Allowed Educational App Icons
  'google-classroom': '🎓',
  'microsoft-teams': '👥',
  video: '📹',
  'video-account': '💻',
  web: '🌐',
  'file-pdf-box': '📄',
};

const BRAND_COLORS = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  whatsapp: '#25D366',
  youtube: '#FF0000',
  snapchat: '#FFFC00',
  telegram: '#0088CC',
  twitter: '#000000',
  discord: '#5865F2',
  gamepad: '#9333EA',
  'gamepad-variant': '#DC2626',
  movie: '#E50914',

  'google-classroom': '#0F9D58',
  'microsoft-teams': '#6264A7',
  video: '#2D8CFF',
  'video-account': '#00897B',
  email: '#EA4335',
  web: '#4285F4',
  'file-pdf-box': '#F44336',
};

export const VectorIcon = ({ name, size = 20, color = '#2563EB', style, showBg = false, bgColor }) => {
  const symbol = ICON_MAP[name] || '📌';
  const brandBg = bgColor || BRAND_COLORS[name];

  if (showBg || brandBg) {
    const bg = brandBg || '#EFF6FF';
    return (
      <View
        style={[
          styles.bgIcon,
          {
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: (size * 1.8) / 2.5,
            backgroundColor: bg + (brandBg ? '1A' : ''), // 10% opacity for brand backgrounds
          },
          style,
        ]}
      >
        <Text style={{ fontSize: size }}>{symbol}</Text>
      </View>
    );
  }

  return (
    <Text style={[{ fontSize: size, color: color, textAlign: 'center' }, style]}>
      {symbol}
    </Text>
  );
};

const styles = StyleSheet.create({
  bgIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VectorIcon;
