import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme/colors';

export interface ReportConfirmationData {
  ticketId?: string;
  building?: string;
  room?: string;
  categoryLabel?: string;
  workerName?: string;
  eta?: string;
}

interface ReportConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onTrack: () => void;
  onDashboard: () => void;
  reportData: ReportConfirmationData | null;
}

export default function ReportConfirmationModal({
  visible,
  onClose,
  onTrack,
  onDashboard,
  reportData,
}: ReportConfirmationModalProps) {
  const insets = useSafeAreaInsets();

  // Animation values for the tick button
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.7);

      // Spring bounce the badge in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4.5,
        tension: 80,
        useNativeDriver: true,
      }).start(() => {
        // Continuous soft ripple/halo pulse effect
        Animated.loop(
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.6,
              duration: 1800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 1800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });

      // Pop the checkmark icon with slight delay
      Animated.sequence([
        Animated.delay(120),
        Animated.spring(checkAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Tactile bounce when tapping the tick button
  const handleBadgePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3.5,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!reportData) return null;

  const {
    ticketId,
    building,
    room,
    categoryLabel,
    workerName,
    eta,
  } = reportData;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 28 },
              ]}
            >
              {/* Tick Button with Animated Spring & Ripple Halo */}
              <View style={styles.badgeContainer}>
                {/* Continuous expanding pulse ring */}
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseOpacity,
                    },
                  ]}
                />

                {/* Spring-animated interactive badge */}
                <Animated.View
                  style={[
                    styles.iconHalo,
                    {
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  <Pressable
                    onPress={handleBadgePress}
                    style={styles.iconCircle}
                    accessibilityLabel="Report confirmed"
                  >
                    <Animated.View style={{ transform: [{ scale: checkAnim }] }}>
                      <Ionicons name="checkmark" size={28} color={colors.white} />
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              </View>

              {/* Title */}
              <Text style={styles.title}>Report submitted</Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                {ticketId ? <>Reference <Text style={{ fontWeight: '700', color: colors.primaryDark }}>{ticketId}</Text> submitted. </> : 'Your report was submitted. '}
                {workerName && eta
                  ? <>Assigned to <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{workerName}</Text>, with an estimated arrival in <Text style={{ fontWeight: '600', color: colors.primary }}>{eta}</Text>.</>
                  : 'You can follow its status from My Reports.'}
              </Text>

              {/* Summary Card Styled to Fixly Theme */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Reference</Text>
                  <View style={styles.referenceBadge}>
                    <Text style={styles.referenceText}>{ticketId || 'Pending'}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryValue}>
                    {[building, room].filter(Boolean).join(' · ') || 'Not provided'}
                  </Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.summaryLabel}>Category</Text>
                  <Text style={styles.summaryValue}>{categoryLabel || 'Not provided'}</Text>
                </View>
              </View>

              {/* Primary Action Button (Fixly Orange Theme) */}
              <Pressable
                style={({ pressed }) => [
                  styles.trackBtn,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={onTrack}
                accessibilityLabel="Track worker"
              >
                <Ionicons name="location-outline" size={18} color={colors.white} />
                <Text style={styles.trackBtnText}>View report</Text>
              </Pressable>

              {/* Secondary Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.dashboardBtn,
                  pressed && { opacity: 0.85, backgroundColor: colors.gray },
                ]}
                onPress={onDashboard}
                accessibilityLabel="Back to dashboard"
              >
                <Text style={styles.dashboardBtnText}>Back to dashboard</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  badgeContainer: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.successTint,
  },
  iconHalo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.successTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4E9BE',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  referenceBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm - 2,
  },
  referenceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  trackBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  trackBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  dashboardBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
