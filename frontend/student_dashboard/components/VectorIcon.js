import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

/**
 * Set of icon names handled by FontAwesome6 (Social & Media Applications)
 */
const FA6_ICONS = new Set([
  'instagram',
  'facebook',
  'whatsapp',
  'youtube',
  'telegram',
  'x-twitter',
  'twitter',
  'discord',
  'snapchat',
  'gamepad',
  'controller-classic',
]);

/**
 * FontAwesome6 Name Normalization Map
 */
const FA6_NAME_MAP = {
  twitter: 'x-twitter',
  'controller-classic': 'gamepad',
};

/**
 * MaterialCommunityIcons Name Normalization Map
 */
const MCI_NAME_MAP = {
  home: 'home',
  analytics: 'chart-bar',
  chart: 'chart-line',
  apps: 'cellphone',
  grid: 'apps',
  bell: 'bell',
  notifications: 'bell',
  account: 'account',
  user: 'account-circle',
  profile: 'account-circle',
  'account-circle': 'account-circle',
  groups: 'account-group',
  users: 'account-group',
  shield: 'shield',
  'shield-check': 'shield-check',
  'shield-alert': 'shield-alert',
  'shield-off': 'shield-off',
  'shield-account': 'shield-account',
  lock: 'lock',
  blocked: 'lock',
  unlock: 'lock-open',
  unblocked: 'lock-open',
  'lock-open': 'lock-open',
  'lock-open-variant': 'lock-open',
  key: 'key',
  'key-variant': 'key-variant',
  battery: 'battery',
  wifi: 'wifi',
  earth: 'earth',
  web: 'earth',
  internet: 'earth',
  public: 'earth',
  calendar: 'calendar',
  'calendar-month': 'calendar-month',
  time: 'clock-outline',
  clock: 'clock-outline',
  schedule: 'clock-outline',
  'clock-outline': 'clock-outline',
  'timer-outline': 'clock-outline',
  information: 'information',
  info: 'information',
  alert: 'alert-circle',
  'alert-circle': 'alert-circle',
  check: 'check-circle',
  'check-circle': 'check-circle',
  active: 'check-circle',
  close: 'close-circle',
  'close-circle': 'close-circle',
  inactive: 'close-circle',
  magnify: 'magnify',
  search: 'magnify',
  filter: 'filter-variant',
  refresh: 'refresh',
  logout: 'logout',
  'office-building': 'office-building',
  office: 'office-building',
  building: 'office-building',
  school: 'school',
  department: 'school',
  email: 'email',
  mail: 'email',
  phone: 'phone',
  call: 'phone',
  'file-pdf-box': 'file-pdf-box',
  book: 'book-open-page-variant',
  'book-open-page-variant': 'book-open-page-variant',
  settings: 'cog',
  cog: 'cog',
  plus: 'plus',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  campaign: 'bullhorn',
  announcement: 'bullhorn',
  'card-account-details-outline': 'card-account-details-outline',
  'student-id': 'card-account-details-outline',
  'location-on': 'map-marker',
  'account-outline': 'account-outline',
  'email-outline': 'email-outline',
  'school-outline': 'school-outline',
  'account-group-outline': 'account-group-outline',
  'check-decagram': 'check-decagram',
};

/**
 * Reusable VectorIcon component that automatically selects between
 * MaterialCommunityIcons and FontAwesome6.
 */
export default function VectorIcon({
  name,
  size = 24,
  color = '#2563EB',
  style,
}) {
  const normalizedName = name ? name.toLowerCase() : 'help-circle-outline';

  // Automatically dispatch to FontAwesome6 for social media and brand icons
  if (FA6_ICONS.has(normalizedName)) {
    const faName = FA6_NAME_MAP[normalizedName] || normalizedName;
    const isBrand = faName !== 'gamepad';

    return (
      <FontAwesome6
        name={faName}
        size={size}
        color={color}
        style={style}
        brand={isBrand}
        iconStyle={isBrand ? 'brand' : 'solid'}
      />
    );
  }

  // Dispatch to MaterialCommunityIcons for standard UI icons
  const mciName = MCI_NAME_MAP[normalizedName] || normalizedName || 'help-circle-outline';

  return (
    <MaterialCommunityIcons
      name={mciName}
      size={size}
      color={color}
      style={style}
    />
  );
}

export { VectorIcon };
