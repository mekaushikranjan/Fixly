import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

interface ProfileHeroStat {
  label: string;
  value: string;
}

interface ProfileHeroProps {
  title: string;
  name?: string;
  email?: string;
  initials?: string;
  avatar?: string;
  subtitle?: string;
  stats?: ProfileHeroStat[];
}

export default function ProfileHero({
  title,
  name,
  email,
  initials,
  avatar,
  subtitle,
  stats = [],
}: ProfileHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#FF763B', '#F26522', '#D94E0F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
    >
      <View pointerEvents="none" style={styles.arcOne} />
      <View pointerEvents="none" style={styles.arcTwo} />
      <View style={styles.topBar}>
        <View style={styles.campusTag}>
          <View style={styles.liveDot} />
          <Text style={styles.campusTagText}>LPU SMART CAMPUS</Text>
        </View>
      </View>
      <View style={styles.accountRow}>
        <View style={styles.avatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials || 'U'}</Text>
          )}
        </View>
        <View style={styles.accountCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{name || 'Campus member'}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
          </View>
          {!!email && <Text style={styles.email} numberOfLines={1}>{email}</Text>}
          <View style={styles.pillRow}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{title}</Text>
            </View>
            {!!subtitle && (
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText} numberOfLines={1}>{subtitle}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {stats.length > 0 ? (
        <View style={styles.statsCard}>
          {stats.map((stat, index) => (
            <React.Fragment key={stat.label}>
              {index > 0 && <View style={styles.statDivider} />}
              <View style={styles.stat}>
                <Text style={styles.statValue} numberOfLines={1}>{stat.value}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  arcOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    right: -78,
    top: -126,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  arcTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    right: -35,
    top: -80,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  topBar: { marginBottom: spacing.md },
  campusTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#86EFAC' },
  campusTagText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 68,
    height: 68,
    flexShrink: 0,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  accountCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: colors.white, fontSize: 20, fontWeight: '800', flexShrink: 1 },
  verifiedBadge: { width: 17, height: 17, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  verifiedCheck: { color: colors.white, fontSize: 12, fontWeight: '900', lineHeight: 15 },
  email: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 3 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7, flexWrap: 'wrap' },
  rolePill: {
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  rolePillText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  statsCard: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: colors.white, fontSize: 16, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '600' },
  statDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.25)' },
});
