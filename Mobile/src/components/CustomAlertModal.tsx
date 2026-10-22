import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme/colors';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconType?: 'info' | 'success' | 'warning' | 'danger' | 'break';
}

export function getAlertVisuals(
  title: string = '',
  message: string = '',
  explicitType?: 'info' | 'success' | 'warning' | 'danger' | 'break',
  explicitIcon?: keyof typeof Ionicons.glyphMap
) {
  if (explicitIcon) {
    return {
      icon: explicitIcon,
      tint: colors.primaryTint,
      accent: colors.primary,
      btnGradient: ['#FF763B', colors.primary] as [string, string],
    };
  }

  const combined = (title + ' ' + message).toLowerCase();

  if (explicitType === 'break' || combined.includes('break') || combined.includes('pause')) {
    return {
      icon: 'cafe' as keyof typeof Ionicons.glyphMap,
      tint: '#FEF3C7',
      accent: '#D97706',
      btnGradient: ['#F59E0B', '#D97706'] as [string, string],
    };
  }

  if (
    explicitType === 'danger' ||
    combined.includes('log out') ||
    combined.includes('delete') ||
    combined.includes('cancel job')
  ) {
    return {
      icon: 'log-out' as keyof typeof Ionicons.glyphMap,
      tint: colors.dangerTint,
      accent: colors.danger,
      btnGradient: ['#E03E3E', '#A32D2D'] as [string, string],
    };
  }

  if (
    explicitType === 'success' ||
    combined.includes('success') ||
    combined.includes('resolved') ||
    combined.includes('locked') ||
    combined.includes('verified') ||
    combined.includes('updated') ||
    combined.includes('assigned') ||
    combined.includes('done') ||
    combined.includes('thank you')
  ) {
    return {
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      tint: colors.successTint,
      accent: colors.success,
      btnGradient: ['#4E8C17', '#3B6D11'] as [string, string],
    };
  }

  if (
    explicitType === 'warning' ||
    combined.includes('required') ||
    combined.includes('warning') ||
    combined.includes('missing') ||
    combined.includes('error') ||
    combined.includes('cannot')
  ) {
    return {
      icon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
      tint: '#FFEDD5',
      accent: '#EA580C',
      btnGradient: ['#F97316', '#EA580C'] as [string, string],
    };
  }

  if (combined.includes('navigation') || combined.includes('gps') || combined.includes('route')) {
    return {
      icon: 'navigate' as keyof typeof Ionicons.glyphMap,
      tint: '#E0F2FE',
      accent: '#0284C7',
      btnGradient: ['#0EA5E9', '#0284C7'] as [string, string],
    };
  }

  // Default Fixly Brand Theme
  return {
    icon: 'sparkles' as keyof typeof Ionicons.glyphMap,
    tint: colors.primaryTint,
    accent: colors.primary,
    btnGradient: ['#FF763B', colors.primary] as [string, string],
  };
}

export function CustomAlertModal({
  visible,
  title,
  message,
  buttons,
  onDismiss,
  iconName,
  iconType,
}: CustomAlertProps) {
  const animFade = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(animFade, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(animScale, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animFade, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(animScale, {
          toValue: 0.9,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const visuals = getAlertVisuals(title, message, iconType, iconName);

  // Normalize buttons: fallback to single 'OK' button
  const alertButtons: AlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }];

  const handleButtonPress = (btn: AlertButton) => {
    onDismiss();
    if (btn.onPress) {
      setTimeout(() => {
        btn.onPress?.();
      }, 80);
    }
  };

  const isTwoButtons = alertButtons.length === 2;
  const hasLongText = alertButtons.some((b) => b.text.length > 13);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {/* Soft warm backdrop matching app theme */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: animFade.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        {/* Compact, clean, rounded-corner modal */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: animFade,
              transform: [{ scale: animScale }],
            },
          ]}
        >
          {/* Subtle Top Decorative Tint Arc */}
          <View
            style={[
              styles.topGlowDecor,
              { backgroundColor: visuals.tint },
            ]}
          />

          {/* Compact Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: visuals.tint }]}>
            <Ionicons name={visuals.icon} size={20} color={visuals.accent} />
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{title}</Text>

          {/* Message */}
          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          {/* Compact Action Buttons */}
          <View
            style={[
              styles.buttonsWrapper,
              isTwoButtons && !hasLongText && styles.buttonsRow,
            ]}
          >
            {alertButtons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              if (isCancel) {
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.cancelBtn,
                      isTwoButtons && !hasLongText && styles.flexBtn,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => handleButtonPress(btn)}
                  >
                    <Text style={styles.cancelBtnText}>{btn.text}</Text>
                  </Pressable>
                );
              }

              if (isDestructive) {
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.flexBtnWrapper,
                      isTwoButtons && !hasLongText && styles.flexBtn,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => handleButtonPress(btn)}
                  >
                    <LinearGradient
                      colors={['#E03E3E', '#A32D2D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryGradientBtn}
                    >
                      <Text style={styles.primaryBtnText}>{btn.text}</Text>
                    </LinearGradient>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.flexBtnWrapper,
                    isTwoButtons && !hasLongText && styles.flexBtn,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <LinearGradient
                    colors={visuals.btnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradientBtn}
                  >
                    <Text style={styles.primaryBtnText}>{btn.text}</Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1E1D1B',
  },
  cardContainer: {
    width: Math.min(width - 64, 296),
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  topGlowDecor: {
    position: 'absolute',
    top: -30,
    width: 140,
    height: 60,
    borderRadius: 30,
    opacity: 0.6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  buttonsWrapper: {
    width: '100%',
    gap: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexBtn: {
    flex: 1,
  },
  flexBtnWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryGradientBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  cancelBtn: {
    height: 40,
    backgroundColor: colors.gray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 13.5,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
