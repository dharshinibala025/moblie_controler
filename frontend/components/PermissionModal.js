import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * PermissionModal
 * Custom Bottom Sheet Modal for requesting permissions (Notification, Accessibility, Overlay)
 * Styled EXACTLY like Android/iOS native bottom permission sheets (Images 2 & 3).
 */
const PermissionModal = ({
  visible = false,
  type = 'notification', // 'restriction' | 'notification' | 'accessibility' | 'overlay'
  title,
  description,
  primaryText,
  secondaryText,
  tertiaryText,
  onPrimary,
  onSecondary,
  onTertiary,
  onDismiss,
}) => {
  if (!visible) return null;

  // Icon & Default Titles based on permission type
  let iconName = 'notifications';
  let defaultTitle = 'Allow ClassRoom to send you notifications?';
  let defaultDescription = null;
  let defaultPrimaryText = 'Allow';
  let defaultSecondaryText = "Don't allow";
  let defaultTertiaryText = null;

  if (type === 'restriction') {
    iconName = 'security';
    defaultTitle = 'Allow restriction Settings?';
    defaultDescription = 'To enforce your study schedule, apps and the Android Settings app will be blocked during class hours once you complete setup.';
    defaultPrimaryText = 'Allow';
    defaultSecondaryText = 'Ask later';
    defaultTertiaryText = "Don't allow";
  } else if (type === 'accessibility') {
    iconName = 'accessibility-new';
    defaultTitle = 'Grant Accessibility Permission for background app restriction enforcement?';
    defaultPrimaryText = 'Grant Permission';
    defaultSecondaryText = 'Ask later';
    defaultTertiaryText = "Don't allow";
  } else if (type === 'overlay') {
    iconName = 'layers';
    defaultTitle = 'Grant Overlay Permission to display restriction screen over apps?';
    defaultPrimaryText = 'Grant Overlay Permission';
    defaultSecondaryText = 'Ask later';
    defaultTertiaryText = "Don't allow";
  }

  const finalTitle = title || defaultTitle;
  const finalDescription = description !== undefined ? description : defaultDescription;
  const finalPrimaryText = primaryText || defaultPrimaryText;
  const finalSecondaryText = secondaryText !== undefined ? secondaryText : defaultSecondaryText;
  const finalTertiaryText = tertiaryText !== undefined ? tertiaryText : defaultTertiaryText;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss || onSecondary}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Top Icon Badge Container matching Screenshots */}
          <View style={styles.iconCircle}>
            <Icon name={iconName} size={26} color="#374151" />
          </View>

          {/* Question Title */}
          <Text style={styles.titleText}>{finalTitle}</Text>

          {/* Optional Description */}
          {finalDescription ? (
            <Text style={styles.descriptionText}>{finalDescription}</Text>
          ) : null}

          {/* Button Group */}
          <View style={styles.buttonGroup}>
            {/* Primary Action (Blue Pill Button) */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onPrimary}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{finalPrimaryText}</Text>
            </TouchableOpacity>

            {/* Secondary Action (Light Gray Pill Button) */}
            {finalSecondaryText ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onSecondary || onDismiss}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>{finalSecondaryText}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Tertiary Action (Light Gray Pill Button) */}
            {finalTertiaryText ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onTertiary || onDismiss}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>{finalTertiaryText}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 24,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PermissionModal;
