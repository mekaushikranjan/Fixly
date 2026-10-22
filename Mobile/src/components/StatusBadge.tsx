import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { ReportStatus } from '../types';

interface ToneStyle {
  bg: string;
  fg: string;
  label: string;
}

const TONES: Record<string, ToneStyle> = {
  assigned: { bg: colors.primaryTint, fg: colors.primaryDark, label: 'Assigned' },
  queued: { bg: colors.gray, fg: colors.textSecondary, label: 'Queued' },
  resolved: { bg: colors.successTint, fg: colors.success, label: 'Resolved' },
  pending: { bg: colors.gray, fg: colors.textSecondary, label: 'Pending' },
  in_progress: { bg: colors.primaryTint, fg: colors.primaryDark, label: 'In progress' },
};

interface StatusBadgeProps {
  status: ReportStatus | string;
  textOverride?: string;
}

export default function StatusBadge({ status, textOverride }: StatusBadgeProps) {
  const tone = TONES[status] || TONES.pending;
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{textOverride || tone.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
