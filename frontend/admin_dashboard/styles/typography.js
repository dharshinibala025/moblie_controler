/**
 * typography.js
 * Clean, enterprise-friendly typography scale using system default fonts.
 */

import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const typography = {
  fontFamily,

  h1: { fontFamily, fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  h2: { fontFamily, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontFamily, fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },

  bodyLarge: { fontFamily, fontSize: 16, fontWeight: '400' },
  body: { fontFamily, fontSize: 14, fontWeight: '400' },
  bodyMedium: { fontFamily, fontSize: 14, fontWeight: '600' },

  caption: { fontFamily, fontSize: 12, fontWeight: '400' },
  captionMedium: { fontFamily, fontSize: 12, fontWeight: '600' },

  statValue: { fontFamily, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },

  button: { fontFamily, fontSize: 14, fontWeight: '600' },
  tabLabel: { fontFamily, fontSize: 11, fontWeight: '600' },
};

export default typography;
