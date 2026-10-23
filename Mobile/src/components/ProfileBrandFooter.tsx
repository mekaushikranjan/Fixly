import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';

interface ProfileBrandFooterProps {
  accountLabel?: string;
  accountName?: string;
  email?: string;
  appName?: string;
  university?: string;
  version?: string;
}

export default function ProfileBrandFooter({
  appName,
  university,
  version,
}: ProfileBrandFooterProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/fixly-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        {appName && <Text style={styles.brandName}>{appName}</Text>}
        {version && (
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>v{version}</Text>
          </View>
        )}
      </View>

      {university && <Text style={styles.universityText}>{university}</Text>}
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
  brandName: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
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
