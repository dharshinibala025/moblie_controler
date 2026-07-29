import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const StudentIcon = ({ size = 20, color, active = false }) => (
  <MaterialCommunityIcons
    name="account"
    size={size}
    color={color || (active ? '#FFFFFF' : '#2563EB')}
  />
);

export const StaffIcon = ({ size = 20, color, active = false }) => (
  <MaterialCommunityIcons
    name="briefcase"
    size={size}
    color={color || (active ? '#FFFFFF' : '#2563EB')}
  />
);

export const AdminIcon = ({ size = 20, color, active = false }) => (
  <MaterialCommunityIcons
    name="shield-account"
    size={size}
    color={color || (active ? '#FFFFFF' : '#2563EB')}
  />
);

export const LockIcon = ({ size = 20, color = '#64748B' }) => (
  <MaterialCommunityIcons name="lock" size={size} color={color} />
);

export const EyeIcon = ({ size = 20, color = '#64748B' }) => (
  <MaterialCommunityIcons name="eye" size={size} color={color} />
);

export const EyeOffIcon = ({ size = 20, color = '#64748B' }) => (
  <MaterialCommunityIcons name="eye-off" size={size} color={color} />
);

export const InfoIcon = ({ size = 20, color = '#2563EB' }) => (
  <MaterialCommunityIcons name="information" size={size} color={color} />
);

export const SuccessCheckIcon = ({ size = 64, color = '#22C55E' }) => (
  <MaterialCommunityIcons name="check-circle" size={size} color={color} />
);

export const CheckCircleIcon = ({ size = 18, satisfied = false }) => (
  <MaterialCommunityIcons
    name={satisfied ? 'check-circle' : 'circle-outline'}
    size={size}
    color={satisfied ? '#22C55E' : '#94A3B8'}
  />
);

export default {
  StudentIcon,
  StaffIcon,
  AdminIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  SuccessCheckIcon,
  CheckCircleIcon,
};
