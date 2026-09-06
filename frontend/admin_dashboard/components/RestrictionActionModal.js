import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { radius } from '../styles/globalStyles';

const RestrictionActionModal = ({ visible, type, title, message, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      onDismiss && onDismiss();
    });
  };

  const config = {
    success: { icon: 'check-circle', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    error: { icon: 'error', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    warning: { icon: 'warning', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    info: { icon: 'info', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  }[type] || { icon: 'info', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };

  return (
    <Modal transparent visible={!!visible} animationType="fade" onRequestClose={handleDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleDismiss}>
        <Animated.View
          style={[
            styles.modalCard,
            { backgroundColor: config.bg, borderColor: config.border },
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: config.color + '15' }]}>
            <Icon name={config.icon} size={32} color={config.color} />
          </View>
          <Text style={[styles.title, { color: config.color }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.h2,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    ...typography.caption,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RestrictionActionModal;
