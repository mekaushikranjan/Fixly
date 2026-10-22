import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';
import ProfileHero from './ProfileHero';
import ProfileBrandFooter from './ProfileBrandFooter';

export interface AccountOverviewRow {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export interface AccountOverviewAction {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

export interface AccountOverviewStat {
  label: string;
  value: string;
}

interface AccountOverviewProps {
  title: string;
  name?: string;
  email?: string;
  initials?: string;
  avatar?: string;
  subtitle?: string;
  details: AccountOverviewRow[];
  stats?: AccountOverviewStat[];
  actions: AccountOverviewAction[];
  supportActions?: AccountOverviewAction[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onLogout: () => Promise<void>;
}

export default function AccountOverview({
  title,
  name,
  email,
  initials,
  avatar,
  subtitle,
  details,
  stats = [],
  actions,
  supportActions = [],
  loading = false,
  error,
  onRetry,
  onLogout,
}: AccountOverviewProps) {
  const insets = useSafeAreaInsets();
  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void onLogout() },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 110, 120) }]}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHero
        title={title}
        name={name}
        email={email}
        initials={initials}
        avatar={avatar}
        subtitle={subtitle}
        stats={stats}
      />

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {error ? (
        <View style={styles.card}>
          <Text style={styles.error}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {details.length > 0 ? (
        <View style={styles.card}>
          {details.map((detail, index) => (
            <View key={detail.label} style={[styles.detailRow, index === details.length - 1 && styles.lastRow]}>
              <View style={styles.detailIcon}>
                <Ionicons name={detail.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>{detail.label}</Text>
                <Text style={styles.detailValue}>{detail.value || 'Not provided'}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {actions.map((action, index) => (
            <Pressable
              key={action.label}
              style={[styles.action, index === actions.length - 1 && styles.lastRow]}
              onPress={action.onPress}
            >
              <View style={styles.actionIconBadge}>
                <Ionicons name={action.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>

      {supportActions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings & support</Text>
          <View style={styles.card}>
            {supportActions.map((action, index) => (
              <Pressable
                key={action.label}
                style={[styles.action, index === supportActions.length - 1 && styles.lastRow]}
                onPress={action.onPress}
              >
                <View style={styles.actionIconBadge}>
                  <Ionicons name={action.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable style={styles.logoutButton} onPress={confirmLogout}>
        <View style={styles.logoutIcon}>
          <Ionicons name="log-out-outline" size={19} color="#DC2626" />
        </View>
        <View style={styles.logoutCopy}>
          <Text style={styles.logoutText}>Log out</Text>
          <Text style={styles.logoutSubtitle}>Sign out of this Fixly account</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color="#DC2626" />
      </Pressable>
      <View style={styles.footer}>
        <ProfileBrandFooter accountLabel={title} accountName={name} email={email} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 0, gap: spacing.md, backgroundColor: colors.bg },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: '#EFECE6', shadowColor: '#1A1817', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  lastRow: { borderBottomWidth: 0 },
  detailIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  detailCopy: { flex: 1 },
  detailLabel: { color: colors.textSecondary, fontSize: 12 },
  detailValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 3, textTransform: 'capitalize' },
  section: { marginHorizontal: spacing.lg, gap: spacing.sm },
  sectionTitle: { color: '#8A8780', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginLeft: 4, marginBottom: 4, textTransform: 'uppercase' },
  action: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F2EFEB' },
  actionIconBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, color: colors.textPrimary, fontWeight: '600' },
  logoutButton: {
    minHeight: 66,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  logoutIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  logoutCopy: { flex: 1 },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  logoutSubtitle: { color: '#991B1B', fontSize: 11, marginTop: 2, opacity: 0.8 },
  footer: { marginHorizontal: spacing.lg },
  loader: { marginVertical: 24 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, paddingVertical: spacing.lg },
  retry: { alignSelf: 'flex-start', paddingBottom: spacing.md },
  retryText: { color: colors.primary, fontWeight: '700' },
});
