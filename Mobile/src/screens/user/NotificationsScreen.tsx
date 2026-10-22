import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import { colors, radius, spacing } from '../../theme/colors';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useApiCacheRefresh } from '../../hooks/useApiCacheRefresh';
import { ApiNotification, mobileApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList, UserTabParamList } from '../../types';

interface FilterItem {
  id: 'all' | 'unread' | 'alert' | 'assignment';
  label: string;
}

const FILTERS: FilterItem[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'alert', label: 'Alerts' },
  { id: 'assignment', label: 'Jobs' },
];

export default function NotificationsScreen() {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CompositeNavigationProp<
    BottomTabNavigationProp<UserTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >>();
  const { token, role } = useAuth();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'alert' | 'assignment'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = items.filter((notification) => !notification.readAt).length;

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const response = await mobileApi.getNotifications(token);
      setItems(response.notifications);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadNotifications();
  }, [loadNotifications]));
  useApiCacheRefresh('/notifications', token ?? undefined, loadNotifications);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    if (!token) return;
    try {
      await mobileApi.markAllNotificationsRead(token);
      await loadNotifications();
    } catch (markError) {
      Alert.alert('Unable to update notifications', markError instanceof Error ? markError.message : 'Please try again.');
    }
  };

  const handleToggleRead = async (item: ApiNotification) => {
    if (!item.readAt && token) {
      try {
        await mobileApi.markNotificationRead(token, item.id);
        await loadNotifications();
      } catch (markError) {
        Alert.alert('Unable to update notification', markError instanceof Error ? markError.message : 'Please try again.');
      }
    }
    const reportId = typeof item.data?.issueId === 'string'
      ? item.data.issueId
      : typeof item.data?.ticketId === 'string'
      ? item.data.ticketId
      : undefined;
    if (reportId && role !== 'worker') {
      navigation.navigate('Tracking', { reportId });
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'unread') return !item.readAt;
    if (filter === 'alert') return item.type === 'alert';
    if (filter === 'assignment') return item.type === 'assignment';
    return true;
  });
  const notificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type === 'assignment') return 'construct-outline';
    if (type === 'alert') return 'alert-circle-outline';
    if (type === 'welcome') return 'hand-left-outline';
    if (type === 'system') return 'notifications-circle-outline';
    return 'notifications-outline';
  };
  const notificationTime = (date: string): string => {
    const timestamp = new Date(date).getTime();
    if (!Number.isFinite(timestamp)) return '';
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
    if (elapsedMinutes < 1) return 'Just now';
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
    if (elapsedMinutes < 24 * 60) return `${Math.floor(elapsedMinutes / 60)}h ago`;
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Header Container: Title, Unread Count, Mark as Read & Filter Buttons */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + spacing.sm }]}>
        {/* Top Navigation Row: Back button, Title + unread beneath, and Parallel "Mark all as read" button */}
        <View style={styles.headerTopRow}>
          <View style={styles.titleArea}>
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else if (role === 'worker') {
                  navigation.navigate('WorkerApp');
                } else {
                  navigation.navigate('UserApp');
                }
              }}
              hitSlop={12}
              style={styles.backBtn}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </Pressable>

            <View style={styles.titleWrap}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {/* Unread count directly below Notifications text, matching its alignment */}
              <View style={styles.unreadRow}>
                <View style={[styles.statusDot, unreadCount > 0 && styles.statusDotActive]} />
                <Text style={styles.statusText}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </Text>
              </View>
            </View>
          </View>

          {/* Parallel to Notifications text on the right side */}
          {unreadCount > 0 && (
            <Pressable
              style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.8 }]}
              onPress={handleMarkAllRead}
              accessibilityLabel="Mark all as read"
            >
              <Ionicons name="checkmark-done" size={15} color={colors.white} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {/* Filter buttons row inside header container */}
        <View style={styles.headerFilterChipsRow}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const count =
              f.id === 'all'
                ? items.length
                : f.id === 'unread'
                ? unreadCount
                : items.filter((i) => i.type === f.id).length;

            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                  {f.label} {count > 0 ? `(${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : error ? (
              <>
                <Text style={styles.emptyTitle}>Could not load notifications</Text>
                <Text style={styles.emptySub}>{error}</Text>
                <Pressable style={styles.resetFilterBtn} onPress={() => void loadNotifications()}>
                  <Text style={styles.resetFilterText}>Try again</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="notifications-off-outline" size={32} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptySub}>
                  {filter === 'unread' ? 'All notifications have been read.' : 'No alerts found in this category.'}
                </Text>
              </>
            )}
            {!loading && !error && filter !== 'all' && (
              <Pressable style={styles.resetFilterBtn} onPress={() => setFilter('all')}>
                <Text style={styles.resetFilterText}>Show all</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = !item.readAt;
          const isPrimary = item.type === 'assignment' || item.type === 'alert';

          return (
            <Pressable onPress={() => void handleToggleRead(item)}>
              <Card
                style={[
                  styles.card,
                  isUnread && styles.cardUnread,
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    isPrimary ? styles.iconBoxPrimary : styles.iconBoxNeutral,
                  ]}
                >
                  <Ionicons
                    name={notificationIcon(item.type)}
                    size={20}
                    color={isPrimary ? colors.primaryDark : colors.textSecondary}
                  />
                </View>

                <View style={{ flex: 1, paddingRight: 6 }}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.timeText}>{notificationTime(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.body}>{item.body}</Text>
                </View>

                {/* Unread Indicator Dot */}
                {isUnread && <View style={styles.unreadDot} />}
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Unified Header Container in Fixly primary orange
  headerContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  backBtn: {
    paddingRight: 4,
    justifyContent: 'center',
  },
  titleWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 24,
  },
  unreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  statusDotActive: {
    backgroundColor: '#FFE600',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  // Filter chips inside header container
  headerFilterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  chipActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  chipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  chipTextInactive: {
    color: colors.white,
  },

  // List
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 28,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  cardUnread: {
    backgroundColor: '#FFFBF8',
    borderColor: '#FCDCCB',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxPrimary: {
    backgroundColor: colors.primaryTint,
  },
  iconBoxNeutral: {
    backgroundColor: colors.gray,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    paddingRight: 6,
  },
  titleUnread: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  body: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginLeft: 4,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 240,
  },
  resetFilterBtn: {
    marginTop: 14,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  resetFilterText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
});
