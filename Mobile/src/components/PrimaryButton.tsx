import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { colors, radius } from '../theme/colors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
}

export default function PrimaryButton({
  label,
  onPress,
  icon,
  loading,
  disabled,
  variant = 'solid',
}: PrimaryButtonProps) {
  const solid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        solid ? styles.solid : styles.outline,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={solid ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.label, { color: solid ? colors.white : colors.primary }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  solid: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  label: { fontSize: 14, fontWeight: '600' },
});
