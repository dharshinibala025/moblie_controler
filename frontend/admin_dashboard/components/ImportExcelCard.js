import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * ImportExcelCard
 * Professional Excel (.xlsx) Import Card with Drag-and-Drop & File Picker support.
 */
const ImportExcelCard = ({
  title = 'Import Excel (.xlsx)',
  subtitle = 'Bulk import student records. Drag & drop or click Upload Excel.',
  onDownloadTemplate,
  onUploadExcel,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);

    const files = e?.dataTransfer?.files || e?.nativeEvent?.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileName = file.name;

      if (typeof FileReader !== 'undefined') {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const arrayBuffer = evt.target.result;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const fileBase64 = typeof global.btoa === 'function' ? global.btoa(binary) : null;
          if (onUploadExcel) {
            onUploadExcel(fileBase64, fileName);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } else if (onUploadExcel) {
      onUploadExcel();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isDragging && styles.cardDragging,
      ]}
      onPress={() => onUploadExcel && onUploadExcel()}
      activeOpacity={0.9}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <View style={[styles.iconWrapper, isDragging && styles.iconWrapperDragging]}>
        <Icon name="upload-file" size={24} color={isDragging ? colors.white : colors.primaryBlue} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {isDragging ? 'Release file to drop & process Excel spreadsheet' : subtitle}
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={(e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            onDownloadTemplate && onDownloadTemplate();
          }}
          activeOpacity={0.8}
        >
          <Icon name="file-download" size={16} color={colors.primaryBlue} />
          <Text style={styles.downloadButtonText}>Download Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={(e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            onUploadExcel && onUploadExcel();
          }}
          activeOpacity={0.8}
        >
          <Icon name="file-upload" size={16} color={colors.white} />
          <Text style={styles.uploadButtonText}>Upload Excel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
  cardDragging: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.lightBlueBackground || '#EFF6FF',
    borderWidth: 2,
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
  iconWrapperDragging: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
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
