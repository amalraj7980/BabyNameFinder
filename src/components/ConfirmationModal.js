import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Colors, Fonts} from '../styles';

/**
 * CareerMate-style confirmation modal (exit / generic confirm).
 */
const ConfirmationModal = ({
  visible,
  title,
  description,
  primaryText = 'Confirm',
  secondaryText = 'Cancel',
  onPrimary,
  onSecondary,
  onClose,
  type = 'default',
}) => {
  const isExit = type === 'exit';
  const iconName = isExit ? 'log-out-outline' : 'alert-circle-outline';
  const iconBg = isExit
    ? 'rgba(200, 90, 110, 0.12)'
    : 'rgba(95, 168, 160, 0.12)';
  const iconColor = isExit ? Colors.primary : Colors.Boy;

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose || onSecondary}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose || onSecondary} />
        <View style={styles.card}>
          <View style={[styles.iconWrap, {backgroundColor: iconBg}]}>
            <Ionicons name={iconName} size={28} color={iconColor} />
          </View>

          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {isExit ? (
            <View style={styles.infoBanner}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={Colors.Boy}
              />
              <Text style={styles.infoText}>
                Your likes and account stay saved on this device.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onPrimary}
            activeOpacity={0.85}>
            <Text style={styles.primaryText}>{primaryText}</Text>
          </TouchableOpacity>

          {secondaryText ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onSecondary || onClose}
              activeOpacity={0.85}>
              <Text style={styles.secondaryText}>{secondaryText}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  card: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    zIndex: 2,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.textGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.statusGreenLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textGray,
    marginLeft: 8,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryText: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.WHITE,
  },
  secondaryBtn: {
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  secondaryText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textGray,
  },
});

export default ConfirmationModal;
