import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ScreenHeader from '../../components/ScreenHeader';
import { useSystemBars } from '../../hooks/useSystemBars';
import { colors, spacing } from '../../theme/colors';
import { UserTabParamList } from '../../types';

type CampusFeedScreenProps = BottomTabScreenProps<UserTabParamList, 'CampusFeed'>;

export default function CampusFeedScreen(_props: CampusFeedScreenProps) {
  useSystemBars(colors.primary, 'light');

  return (
    <View style={styles.container}>
      <ScreenHeader eyebrow="LPU SMART CAMPUS" title="Campus Feed" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="school-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>Updates from your campus</Text>
            <Text style={styles.introText}>
              Campus announcements and facilities updates will appear here.
            </Text>
          </View>
        </View>

        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="newspaper-outline" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No updates yet</Text>
          <Text style={styles.emptyText}>
            Check back later for the latest campus news and service updates.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  introCopy: { flex: 1, gap: 4 },
  introTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  introText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  emptyCard: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 280,
  },
});
