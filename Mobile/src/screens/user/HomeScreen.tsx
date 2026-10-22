import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { colors, radius, spacing } from '../../theme/colors';
import { issueCategories } from '../../data/catalog';
import { useAuth } from '../../context/AuthContext';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useIssues } from '../../hooks/useIssues';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { toReportItem } from '../../lib/issues';
import { RootStackParamList, UserTabParamList } from '../../types';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<UserTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  useSystemBars('#FF763B', 'light');
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { issues, loading, error } = useIssues();
  const { count: unreadCount, error: notificationCountError } = useUnreadNotificationCount();
  const { width } = useWindowDimensions();
  const isTablet = width > 700;
  const [imageError, setImageError] = useState(false);

  const quickCategories = issueCategories.slice(0, 4);
  const reports = issues.map(toReportItem);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 120, 130) },
          isTablet && { maxWidth: 680, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Taller Curved Orange Header with Layered Background Curves */}
        <LinearGradient
          colors={['#FF763B', '#F26522', '#D94E0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.curvedHeader, { paddingTop: insets.top + spacing.md }]}
        >
          {/* Subtle Decorative Curved Arcs */}
          <View style={styles.headerDecoArc1} />
          <View style={styles.headerDecoArc2} />
          <View style={styles.headerDecoCircle} />

          {/* Top Bar: Campus Tag & Notification Bell */}
          <View style={styles.topBar}>
            <View style={styles.campusTag}>
              <View style={styles.campusDot} />
              <Text style={styles.campusTagText}>LPU SMART CAMPUS</Text>
            </View>

            <Pressable
              style={styles.bellBtn}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityLabel={notificationCountError
                ? 'Notifications, unread count unavailable'
                : `Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              hitSlop={8}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          {/* Hero Greeting & Prominent Name */}
          <View style={styles.heroProfileRow}>
            {/* User Avatar */}
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarWrap}
              accessibilityLabel="View profile"
            >
              {profile.avatar && !imageError ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={styles.avatarImg}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{profile.initials || 'U'}</Text>
                </View>
              )}
            </Pressable>

            {/* Prominent Greeting & Name! */}
            <View style={styles.greetingWrap}>
              <Text style={styles.greetingSub}>{getGreeting()},</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {profile.name || 'there'}!
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Body Content */}
        <View style={styles.bodyContent}>
          {/* Quick Primary Report CTA Card */}
          <Pressable
            style={styles.reportBanner}
            onPress={() => navigation.navigate('Report')}
          >
            <LinearGradient
              colors={['#FF763B', '#E65100']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.reportBannerGradient}
            >
              <View style={styles.reportBannerIcon}>
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportBannerTitle}>Report an Issue</Text>
                <Text style={styles.reportBannerSubtitle}>
                  Describe the issue and follow updates in the app
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>

          {/* Quick Categories Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Categories</Text>
            <Pressable onPress={() => navigation.navigate('Report')}>
              <Text style={styles.sectionActionText}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.categoriesGrid}>
            {quickCategories.map((c) => (
              <Pressable
                key={c.id}
                style={styles.categoryItem}
                onPress={() => navigation.navigate('Report', { categoryId: c.id, category: c.id })}
              >
                <View style={styles.categoryIconWrap}>
                  <Ionicons name={c.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={styles.categoryLabel}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Recent Reports Section */}
          <View style={[styles.sectionHeaderRow, { marginTop: spacing.md }]}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <Pressable onPress={() => navigation.navigate('MyReports')}>
              <Text style={styles.sectionActionText}>View history</Text>
            </Pressable>
          </View>

          {loading ? (
            <Text style={styles.reportSub}>Loading reports…</Text>
          ) : error ? (
            <Text style={styles.reportSub}>{error}</Text>
          ) : reports.length === 0 ? (
            <Text style={styles.reportSub}>No reports yet.</Text>
          ) : reports.slice(0, 3).map((r) => (
            <Pressable
              key={r.id}
              onPress={() => navigation.navigate('Tracking', { reportId: r.id })}
              style={styles.reportItemWrap}
            >
              <Card style={styles.reportRow}>
                <View style={styles.reportIconWrap}>
                  <Ionicons
                    name={
                      r.category === 'electrical'
                        ? 'flash'
                        : r.category === 'plumbing'
                        ? 'water'
                        : r.category === 'wifi'
                        ? 'wifi'
                        : 'construct'
                    }
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={styles.reportSub}>
                    {r.building} · {r.reportedAt}
                  </Text>
                </View>
                <StatusBadge status={r.status} />
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 115,
  },

  // Taller Header with Subtle Bottom Curve
  curvedHeader: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  headerDecoArc1: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    top: -140,
    right: -100,
  },
  headerDecoArc2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    top: -90,
    right: -70,
  },
  headerDecoCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -20,
    left: -30,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  campusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  campusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  campusTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },

  // Hero Profile Greeting
  heroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  greetingWrap: {
    flex: 1,
  },
  greetingSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  greetingName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // Body Content
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  // Report CTA Banner
  reportBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  reportBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  reportBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reportBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionActionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primary,
  },

  // Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  categoryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },

  // Reports Rows
  reportItemWrap: {
    marginBottom: 10,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  reportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  reportSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
});
