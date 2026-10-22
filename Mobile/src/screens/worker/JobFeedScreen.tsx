import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useApiCacheRefresh } from '../../hooks/useApiCacheRefresh';
import { useAuth } from '../../context/AuthContext';
import { mobileApi, MobileIssue, MobileWorkerPerformance } from '../../lib/api';
import { WorkerJobItem, WorkerJobsStackParamList } from '../../types';

type JobFeedScreenProps = NativeStackScreenProps<WorkerJobsStackParamList, 'JobFeedList'>;

const FILTERS = [
  { id: 'all', label: 'All Jobs', icon: 'layers-outline' },
  { id: 'critical', label: 'Critical', icon: 'alert-circle-outline' },
  { id: 'academic', label: 'Academic', icon: 'business-outline' },
  { id: 'hostel', label: 'Hostels', icon: 'home-outline' },
];

function toWorkerJob(issue: MobileIssue): WorkerJobItem {
  const slaMinutes = Math.max(0, Math.ceil((new Date(issue.slaDeadline).getTime() - Date.now()) / 60_000));
  return {
    id: issue.id,
    ticketId: issue.ticketId,
    title: issue.title,
    floor: issue.floor,
    room: issue.room,
    distance: 'Distance not available',
    photo: !!issue.photoUrl,
    status: issue.status,
    category: issue.category,
    priority: issue.priority === 'Low' ? 'Normal' : issue.priority,
    priorityColor: issue.priority === 'Critical' ? '#DC2626' : colors.primary,
    description: issue.description,
    reportedBy: issue.reportedBy,
    reportedAt: issue.reportedAt,
    slaTime: `${slaMinutes} min SLA`,
    photoUrl: issue.photoUrl,
    building: issue.building,
  };
}

export default function JobFeedScreen({ navigation }: JobFeedScreenProps) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { token } = useAuth();

  const [jobs, setJobs] = useState<WorkerJobItem[]>([]);
  const [performance, setPerformance] = useState<MobileWorkerPerformance | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!token) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [jobsResponse, performanceResponse] = await Promise.all([
        mobileApi.getAvailableJobs(token, true),
        mobileApi.getWorkerPerformance(token),
      ]);
      setJobs(jobsResponse.issues.map(toWorkerJob));
      setPerformance(performanceResponse.performance);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load available issues.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadJobs();
  }, [loadJobs]));
  useApiCacheRefresh('/worker/jobs', token ?? undefined, loadJobs);
  useApiCacheRefresh('/worker/performance', token ?? undefined, loadJobs);

  const handleAccept = (job: WorkerJobItem) => {
    Alert.alert(
      'Accept Job',
      `Accept ticket ${job.ticketId || job.id}: ${job.title}?\nThis will assign the issue to you and notify the user.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Job Now',
          style: 'default',
          onPress: () => {
            if (!token) return;
            void mobileApi.acceptIssue(token, job.id).then(() => {
              void loadJobs();
            Alert.alert(
              'Job accepted',
              `Ticket #${job.ticketId || job.id} is now assigned to you.`,
              [
                {
                  text: 'Open Task Navigation',
                  onPress: () =>
                    navigation.navigate('JobDetail', {
                      jobId: job.id,
                      title: job.title,
                    }),
                },
                { text: 'OK', style: 'cancel' },
              ]
            );
            }).catch((acceptError: unknown) => {
              Alert.alert('Unable to accept issue', acceptError instanceof Error ? acceptError.message : 'Please refresh and try again.');
            });
          },
        },
      ]
    );
  };

  const filteredJobs = jobs.filter((job) => {
    if (selectedFilter === 'critical') return job.priority === 'Critical';
    if (selectedFilter === 'academic') return job.building?.includes('Block') || job.building?.includes('Library');
    if (selectedFilter === 'hostel') return job.building?.includes('Hostel');
    return true;
  });

  const criticalJob = jobs.find((j) => j.priority === 'Critical');

  return (
    <View style={styles.container}>
      {/* Orange Gradient Hero Header */}
      <LinearGradient
        colors={['#FF763B', '#F26522', '#D94E0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.headerDecoArc1} pointerEvents="none" />
        <View style={styles.headerDecoArc2} pointerEvents="none" />
        <View style={styles.headerDecoCircle} pointerEvents="none" />

        {/* Top Tag Row */}
        <View style={styles.topTagRow}>
          <View style={styles.campusTag}>
            <View style={styles.liveDot} />
            <Text style={styles.campusTagText}>FIXLY DISPATCH POOL</Text>
          </View>

          <View style={styles.dutyPill}>
            <Text style={styles.dutyPillText}>DISPATCH</Text>
          </View>
        </View>

        {/* Worker Greeting Row */}
        <View style={styles.workerGreetingRow}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{profile.initials || '—'}</Text>
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.workerNameCol}>
            <Text style={styles.greetingSub}>Available issues for</Text>
            <Text style={styles.workerName} numberOfLines={1}>
              {profile.name || 'Worker'}
            </Text>
            <Text style={styles.deptSub}>
              {profile.department || 'Department not assigned'}
            </Text>
          </View>
        </View>

        {/* Shift Summary Bar */}
        <View style={styles.shiftBanner}>
          <Ionicons name="time" size={14} color="#FFFFFF" />
          <Text style={styles.shiftBannerText}>Available issues are loaded from the Fixly service</Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 120, 130) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Shift Stat Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Ionicons name="flash" size={16} color="#D97706" />
              <Text style={styles.kpiVal}>{jobs.length}</Text>
            </View>
            <Text style={styles.kpiLabel}>Open Tickets</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Ionicons name="checkmark-done" size={16} color="#059669" />
              <Text style={styles.kpiVal}>{performance?.jobsCompleted ?? '—'}</Text>
            </View>
            <Text style={styles.kpiLabel}>Resolved Fixes</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Ionicons name="star" size={16} color="#D97706" />
              <Text style={styles.kpiVal}>
                {performance?.ratingsCount ? performance.rating.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={styles.kpiLabel}>Rating</Text>
          </View>
        </View>

        {/* Emergency Atomic Lock Broadcast Banner (Flowchart #2) */}
        {criticalJob && (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <View style={styles.emergencyPill}>
                <View style={styles.emergencyPulseDot} />
                <Text style={styles.emergencyPillText}>URGENT BROADCAST</Text>
              </View>
              <Text style={styles.timerText}>Critical priority</Text>
            </View>

            <Text style={styles.emergencyTitle}>{criticalJob.title}</Text>
            <Text style={styles.emergencyLocation}>
              📍 {criticalJob.building} · {criticalJob.floor}, {criticalJob.room}
            </Text>
            <Text style={styles.emergencyDesc}>{criticalJob.description}</Text>

            <Pressable
              style={styles.emergencyAcceptBtn}
              onPress={() => handleAccept(criticalJob)}
            >
              <LinearGradient
                colors={['#DC2626', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emergencyBtnGradient}
              >
                <Ionicons name="flash" size={16} color="#FFFFFF" />
                <Text style={styles.emergencyBtnText}>
                  Accept critical issue
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Available issues</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTERS.map((f) => {
              const active = selectedFilter === f.id;
              return (
                <Pressable
                  key={f.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(f.id)}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={14}
                    color={active ? '#FFFFFF' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Job Cards List */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptySub}>{error}</Text>
            <Pressable onPress={() => void loadJobs()}>
              <Text style={styles.sectionTitle}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No available issues</Text>
            <Text style={styles.emptySub}>
              New issues for your department will appear here.
            </Text>
          </View>
        ) : (
          filteredJobs.map((item) => (
            <View key={item.id} style={styles.jobCard}>
              {/* Card Header */}
              <View style={styles.jobCardHeader}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: item.priority === 'Critical' ? '#FEE2E2' : '#FEF3C7' },
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: item.priorityColor || colors.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: item.priorityColor || colors.primaryDark },
                      ]}
                    >
                      {item.priority || 'Normal'} Priority
                    </Text>
                  </View>

                  <View style={styles.slaBadge}>
                    <Ionicons name="stopwatch-outline" size={12} color="#475569" />
                    <Text style={styles.slaText}>{item.slaTime || 'SLA Active'}</Text>
                  </View>
                </View>

                {item.ticketId && (
                  <Text style={styles.ticketIdText}>#{item.ticketId}</Text>
                )}
              </View>

              {/* Title & Description */}
              <Text style={styles.jobTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.jobDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              {/* Location & Walking Distance */}
              <View style={styles.locationBox}>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={16} color={colors.primary} />
                  <Text style={styles.locationText}>
                    {item.building || 'Campus Facility'} · {item.floor}, {item.room}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="walk-outline" size={13} color="#64748B" />
                    <Text style={styles.metaItemText}>{item.distance}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={13} color="#64748B" />
                    <Text style={styles.metaItemText}>
                      {item.reportedBy || 'User Reported'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Required Tools Hint */}
              {item.toolsNeeded && item.toolsNeeded.length > 0 && (
                <View style={styles.toolsWrap}>
                  <Text style={styles.toolsHeading}>Required Equipment:</Text>
                  <View style={styles.toolsChips}>
                    {item.toolsNeeded.map((t, idx) => (
                      <View key={idx} style={styles.toolBadge}>
                        <Ionicons name="build-outline" size={11} color="#64748B" />
                        <Text style={styles.toolBadgeText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Card Footer Action Buttons */}
              <View style={styles.cardFooter}>
                <Pressable
                  style={styles.detailsBtn}
                  onPress={() =>
                    navigation.navigate('JobDetail', {
                      jobId: item.id,
                      title: item.title,
                    })
                  }
                >
                  <Text style={styles.detailsBtnText}>View Details</Text>
                </Pressable>

                <Pressable
                  style={styles.acceptActionBtn}
                  onPress={() => handleAccept(item)}
                >
                  <LinearGradient
                    colors={['#FF763B', '#F26522']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.acceptGradient}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Accept & Dispatch</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    top: -50,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 32,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerDecoArc2: {
    position: 'absolute',
    top: 30,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerDecoCircle: {
    position: 'absolute',
    bottom: -30,
    right: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  topTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    zIndex: 2,
  },
  campusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  campusTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dutyPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dutyPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  workerGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    zIndex: 2,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  workerNameCol: {
    marginLeft: 12,
    flex: 1,
  },
  greetingSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  workerName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 1,
  },
  deptSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  shiftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    zIndex: 2,
  },
  shiftBannerText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emergencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emergencyPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  emergencyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  emergencyLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: 6,
  },
  emergencyDesc: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 17,
    marginBottom: 12,
  },
  emergencyAcceptBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  emergencyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  filterSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slaText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  ticketIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 6,
  },
  jobDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  locationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  toolsWrap: {
    marginBottom: 12,
  },
  toolsHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  toolsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  toolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toolBadgeText: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  detailsBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  acceptActionBtn: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
