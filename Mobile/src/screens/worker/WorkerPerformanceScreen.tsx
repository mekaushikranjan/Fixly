import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileApi, MobileWorkerPerformance } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useApiCacheRefresh } from '../../hooks/useApiCacheRefresh';
import { colors, spacing } from '../../theme/colors';

export default function WorkerPerformanceScreen() {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [performance, setPerformance] = useState<MobileWorkerPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPerformance = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const result = await mobileApi.getWorkerPerformance(token);
      setPerformance(result.performance);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load performance details.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadPerformance();
  }, [loadPerformance]));
  useApiCacheRefresh('/worker/performance', token ?? undefined, loadPerformance);

  const metrics = performance ? [
    { label: 'Average rating', value: performance.ratingsCount ? `${performance.rating.toFixed(1)} / 5` : 'No ratings yet', icon: 'star-outline' as const },
    { label: 'Completed jobs', value: String(performance.jobsCompleted), icon: 'checkmark-circle-outline' as const },
    { label: 'Resolved assigned issues', value: String(performance.resolvedIssues), icon: 'construct-outline' as const },
    { label: 'Active assignments', value: String(performance.activeIssues), icon: 'time-outline' as const },
    { label: 'Rework rate', value: `${performance.reworkRate.toFixed(1)}%`, icon: 'refresh-outline' as const },
    { label: 'Average resolution time', value: performance.averageResolutionMinutes === null ? 'Not available' : `${performance.averageResolutionMinutes.toFixed(0)} min`, icon: 'stopwatch-outline' as const },
  ] : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: Math.max(insets.bottom + 110, 120) }]}>
        <View style={styles.header}>
          <View style={styles.icon}><Ionicons name="stats-chart-outline" size={22} color={colors.primary} /></View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Performance</Text>
            <Text style={styles.subtitle}>Calculated from your Fixly work records</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void loadPerformance()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : performance ? (
          <View style={styles.card}>
            {metrics.map((metric) => (
              <View key={metric.label} style={styles.metric}>
                <View style={styles.metricIcon}><Ionicons name={metric.icon} size={18} color={colors.primary} /></View>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            ))}
            <Text style={styles.note}>
              Ratings use submitted user feedback. Timing and rework figures include resolved issues assigned to your account.
            </Text>
          </View>
        ) : (
          <View style={styles.card}><Text style={styles.error}>No performance record is available for this account.</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  card: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border },
  metric: { flexDirection: 'row', alignItems: 'center', minHeight: 64, gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  metricIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  metricValue: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, textAlign: 'right' },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, paddingVertical: spacing.md },
  loader: { marginTop: 48 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, paddingVertical: spacing.lg },
  retry: { alignSelf: 'flex-start', paddingBottom: spacing.md },
  retryText: { color: colors.primary, fontWeight: '700' },
});
