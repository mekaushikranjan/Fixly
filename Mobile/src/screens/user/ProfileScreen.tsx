import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useIssues } from '../../hooks/useIssues';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { useApiCacheRefresh } from '../../hooks/useApiCacheRefresh';
import { colors, spacing } from '../../theme/colors';
import { RootStackParamList, UserTabParamList } from '../../types';
import ProfileBrandFooter from '../../components/ProfileBrandFooter';
import { openDeviceSettings } from '../../lib/profileSupport';
import { mobileApi } from '../../lib/api';

type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<UserTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  useSystemBars('#FF763B', 'light');
  const insets = useSafeAreaInsets();
  const { profile, logout } = useAuth();
  const { issues, error, refresh } = useIssues();
  const { count: unreadCount, refresh: refreshUnread } = useUnreadNotificationCount();
  const [appConfig, setAppConfig] = useState<{ version?: string; university?: string }>({});

  const loadConfig = useCallback(async () => {
    try {
      const config = await mobileApi.getAppConfig();
      if (config) {
        setAppConfig({
          version: config.version,
          university: config.university,
        });
      }
    } catch {
      // Fallback to local default if offline
    }
  }, []);
  useApiCacheRefresh('/app/config', undefined, loadConfig);

  useEffect(() => {
    void loadConfig();
    void refresh();
    void refreshUnread();
  }, [loadConfig, refresh, refreshUnread]);

  const resolvedCount = issues.filter((issue) => issue.status === 'resolved').length;
  const inProgressCount = Math.max(0, issues.length - resolvedCount);

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your Fixly account on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 110, 120) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Top color anchor matching header gradient so top scroll/notch never shows a white line */}
        <View pointerEvents="none" style={styles.topColorAnchor} />

        {/* Taller Curved Gradient Hero Banner with Reduced Radius */}
        <LinearGradient
          colors={['#FF763B', '#F26522', '#D94E0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          style={[styles.heroContainer, { paddingTop: insets.top + spacing.md }]}
        >
          {/* Decorative Background Elements */}
          <View pointerEvents="none" style={styles.arcOne} />
          <View pointerEvents="none" style={styles.arcTwo} />
          <View pointerEvents="none" style={styles.glowSpot} />

          {/* Clean Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.campusTag}>
              <View style={styles.campusDot} />
              <Text style={styles.campusTagText}>
                {appConfig.university ? appConfig.university.toUpperCase() : 'LPU SMART CAMPUS'}
              </Text>
            </View>
          </View>

          {/* User Identity Profile Details */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{profile.initials || 'U'}</Text>
              )}
            </View>

            <View style={styles.profileCopy}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {profile.name || 'Campus Member'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.userEmail} numberOfLines={1}>
                {profile.email || 'campus.member@fixly.local'}
              </Text>

              <View style={styles.pillRow}>
                <View style={styles.rolePill}>
                  <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" />
                  <Text style={styles.rolePillText}>Campus Member</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Compact Stats Bar Shown INSIDE Header */}
          <View style={styles.headerStatsCard}>
            <Pressable
              style={styles.headerStatCol}
              onPress={() => navigation.navigate('MyReports')}
              accessibilityRole="button"
              accessibilityLabel="View all reports"
            >
              <View style={styles.headerStatRow}>
                <Ionicons name="document-text" size={14} color="#FFFFFF" />
                <Text style={styles.headerStatNumber}>{issues.length}</Text>
              </View>
              <Text style={styles.headerStatLabel}>Total Reports</Text>
            </Pressable>

            <View style={styles.headerStatDivider} />

            <Pressable
              style={styles.headerStatCol}
              onPress={() => navigation.navigate('MyReports')}
              accessibilityRole="button"
              accessibilityLabel="View resolved reports"
            >
              <View style={styles.headerStatRow}>
                <Ionicons name="checkmark-circle" size={14} color="#86EFAC" />
                <Text style={[styles.headerStatNumber, { color: '#86EFAC' }]}>
                  {resolvedCount}
                </Text>
              </View>
              <Text style={styles.headerStatLabel}>Resolved</Text>
            </Pressable>

            <View style={styles.headerStatDivider} />

            <Pressable
              style={styles.headerStatCol}
              onPress={() => navigation.navigate('MyReports')}
              accessibilityRole="button"
              accessibilityLabel="View in progress reports"
            >
              <View style={styles.headerStatRow}>
                <Ionicons name="time" size={14} color="#FDE047" />
                <Text style={[styles.headerStatNumber, { color: '#FDE047' }]}>
                  {inProgressCount}
                </Text>
              </View>
              <Text style={styles.headerStatLabel}>In Progress</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Sync Error Banner if any */}
        {error ? (
          <View style={styles.errorBanner}>
            <View style={styles.errorIconWrapper}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.errorBannerTitle}>Unable to refresh tickets</Text>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
            <Pressable
              onPress={() => void refresh()}
              style={styles.retryButton}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Account & Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT & ACTIVITY</Text>
          <View style={styles.card}>
            {/* Personal Details */}
            <Pressable
              style={styles.actionRow}
              onPress={() => navigation.navigate('ProfileDetails')}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="person" size={18} color="#4338CA" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Personal Details</Text>
                <Text style={styles.actionSubtitle}>Name, phone, room & avatar</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* My Reports */}
            <Pressable
              style={styles.actionRow}
              onPress={() => navigation.navigate('MyReports')}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#FDE9DC' }]}>
                <Ionicons name="receipt" size={18} color={colors.primary} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>My Reports</Text>
                <Text style={styles.actionSubtitle}>
                  {issues.length > 0 ? `${issues.length} reported tickets` : 'View past submissions'}
                </Text>
              </View>
              {issues.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{issues.length}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Notifications */}
            <Pressable
              style={styles.actionRow}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="notifications" size={18} color="#7E22CE" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Notifications</Text>
                <Text style={styles.actionSubtitle}>
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'Dispatches & campus alerts'}
                </Text>
              </View>
              {unreadCount > 0 && (
                <View style={styles.unreadRowBadge}>
                  <Text style={styles.unreadRowBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Campus Feed */}
            <Pressable
              style={styles.actionRow}
              onPress={() => navigation.navigate('CampusFeed')}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#CCFBF1' }]}>
                <Ionicons name="megaphone" size={18} color="#0F766E" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Campus Feed</Text>
                <Text style={styles.actionSubtitle}>Public notices & maintenance updates</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Change Password */}
            <Pressable
              style={[styles.actionRow, styles.lastRow]}
              onPress={() => navigation.navigate('ForgotPassword', { email: profile?.email })}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="key-outline" size={18} color="#D97706" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Change Password</Text>
                <Text style={styles.actionSubtitle}>Update or reset account credentials</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Preferences & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES & SUPPORT</Text>
          <View style={styles.card}>
            {/* App Permissions */}
            <Pressable
              style={styles.actionRow}
              onPress={() => void openDeviceSettings()}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="settings-sharp" size={18} color="#475569" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>App Permissions</Text>
                <Text style={styles.actionSubtitle}>Push notifications & device access</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Report a Bug - Dedicated Screen */}
            <Pressable
              style={styles.actionRow}
              onPress={() => navigation.navigate('BugReport')}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#FFE4E6' }]}>
                <Ionicons name="bug" size={18} color="#BE123C" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Report a Bug</Text>
                <Text style={styles.actionSubtitle}>Encountered an issue with Fixly?</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Send Feedback - Dedicated Screen */}
            <Pressable
              style={styles.actionRow}
              onPress={() => navigation.navigate('Feedback')}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#0369A1" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Send Feedback</Text>
                <Text style={styles.actionSubtitle}>Help us improve your experience</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Privacy Policy - Dedicated Screen */}
            <Pressable
              style={styles.actionRow}
              onPress={() => navigation.navigate('PrivacyPolicy')}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#047857" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Privacy Policy</Text>
                <Text style={styles.actionSubtitle}>Data protection & student privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Terms of Use - Dedicated Screen */}
            <Pressable
              style={[styles.actionRow, styles.lastRow]}
              onPress={() => navigation.navigate('TermsOfUse')}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#F4F4F5' }]}>
                <Ionicons name="document-text" size={18} color="#52525B" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Terms of Use</Text>
                <Text style={styles.actionSubtitle}>Campus service agreement</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Sign Out Card */}
        <Pressable
          style={styles.logoutCard}
          onPress={confirmLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out of account"
        >
          <View style={styles.logoutIconBadge}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </View>
          <View style={styles.logoutInfo}>
            <Text style={styles.logoutTitle}>Sign Out</Text>
            <Text style={styles.logoutSubtitle}>Log out of this device securely</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#DC2626" />
        </Pressable>

        {/* Brand Footer with live Admin-configured version and university */}
        <ProfileBrandFooter
          version={appConfig.version}
          university={appConfig.university || 'Lovely Professional University'}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  topColorAnchor: {
    position: 'absolute',
    top: -500,
    left: 0,
    right: 0,
    height: 500,
    backgroundColor: '#FF763B',
  },
  content: {
    gap: spacing.md,
    backgroundColor: '#F8F7F4',
  },
  heroContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F26522',
    paddingHorizontal: spacing.lg,
    paddingBottom: 22,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  arcOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -70,
    top: -90,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  arcTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -30,
    top: -40,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  glowSpot: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    left: -60,
    bottom: -60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  campusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  campusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#86EFAC',
  },
  campusTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 7,
    flexWrap: 'wrap',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  rolePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerStatsCard: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  headerStatCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerStatNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerStatLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10.5,
    fontWeight: '600',
  },
  headerStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  section: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  sectionTitle: {
    color: '#8A8780',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 4,
    marginBottom: 4,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: spacing.lg,
    shadowColor: '#1A1817',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EFEB',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  actionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#F4F2EC',
  },
  countBadgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  unreadRowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#DC2626',
  },
  unreadRowBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  logoutCard: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutInfo: {
    flex: 1,
    minWidth: 0,
  },
  logoutTitle: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutSubtitle: {
    color: '#991B1B',
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIconWrapper: {
    marginTop: 2,
  },
  errorBannerTitle: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 11,
    marginTop: 2,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
