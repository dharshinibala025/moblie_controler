import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * ImportExcelCard
 * Professional Excel (.xlsx) Import Card with Download Template and Upload Excel buttons.
 */
const ImportExcelCard = ({
  title = 'Import Excel (.xlsx)',
  subtitle = 'Upload a spreadsheet to bulk add records',
  onDownloadTemplate,
  onUploadExcel,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <Icon name="upload-file" size={24} color={colors.primaryBlue} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={onDownloadTemplate}
          activeOpacity={0.8}
        >
          <Icon name="file-download" size={16} color={colors.primaryBlue} />
          <Text style={styles.downloadButtonText}>Download Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={onUploadExcel}
          activeOpacity={0.8}
        >
          <Icon name="file-upload" size={16} color={colors.white} />
          <Text style={styles.uploadButtonText}>Upload Excel</Text>
        </TouchableOpacity>
      </View>
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
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textWrapper: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  downloadButtonText: {
    ...typography.button,
    fontSize: 12,
    color: colors.primaryBlue,
    marginLeft: spacing.xs,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  uploadButtonText: {
    ...typography.button,
    fontSize: 12,
    color: colors.white,
    marginLeft: spacing.xs,
  },
});

export default ImportExcelCard;
