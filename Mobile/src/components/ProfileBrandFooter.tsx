import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';
import appConfig from '../../app.json';

interface ProfileBrandFooterProps {
  accountLabel?: string;
  accountName?: string;
  email?: string;
  university?: string;
  version?: string;
}

export default function ProfileBrandFooter({
  university = 'Lovely Professional University',
  version,
}: ProfileBrandFooterProps) {
  const displayVersion = version?.trim() || appConfig.expo.version;

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/fixly-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/fixly-wordmark.png')}
          style={styles.wordmark}
          resizeMode="contain"
          accessibilityLabel="Fixly"
        />
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>v{displayVersion}</Text>
        </View>
      </View>

      <Text style={styles.universityText}>{university}</Text>
      <Text style={styles.campusTagline}>Smart Campus Facilities & Maintenance</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: 5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  wordmark: {
    width: 105,
    height: 32,
  },
  versionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FDE9DC',
    borderWidth: 1,
    borderColor: '#FCD8C1',
  },
  versionText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  universityText: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  campusTagline: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
