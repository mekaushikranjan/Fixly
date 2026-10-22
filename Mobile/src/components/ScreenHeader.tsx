import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
  left?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
  roundedBottom?: boolean;
}

export default function ScreenHeader({
  eyebrow,
  title,
  right,
  left,
  showBack,
  onBack,
  style,
  roundedBottom = true,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.wrap,
        roundedBottom && styles.roundedBottom,
        { paddingTop: insets.top + spacing.md },
        style,
      ]}
    >
      {showBack && (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </Pressable>
      )}
      {left}
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roundedBottom: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backBtn: {
    paddingRight: 4,
    justifyContent: 'center',
  },
  eyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginBottom: 2 },
  title: { color: colors.white, fontSize: 18, fontWeight: '600' },
});
