import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * ImportExcelCard
 * UI-only card representing an Excel (.xlsx) import action. No file
 * picker or parsing logic is wired up; onPress is exposed so a future
 * backend/file-picker integration can be attached without touching
 * this component's markup.
 *
 * Props:
 * - title: string
 * - subtitle: string
 * - onPress: function
 */
const ImportExcelCard = ({
  title = 'Import Excel (.xlsx)',
  subtitle = 'Upload a spreadsheet to bulk add records',
  onPress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <Icon name="upload-file" size={22} color={colors.primaryBlue} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Icon name="file-upload" size={14} color={colors.white} />
        <Text style={styles.buttonText}>Choose file</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.skyBlue,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    backgroundColor: colors.secondaryBackground,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  textWrapper: { alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.bodyMedium, color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  buttonText: { ...typography.button, color: colors.white, marginLeft: spacing.xs },
});

export default ImportExcelCard;
