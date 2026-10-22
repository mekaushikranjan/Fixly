import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileApi, MobileWorker } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useApiCacheRefresh } from '../../hooks/useApiCacheRefresh';
import { colors, spacing } from '../../theme/colors';

export default function WorkerShiftScreen() {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [worker, setWorker] = useState<MobileWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorker = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const result = await mobileApi.getCurrentWorker(token);
      setWorker(result.worker);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your shift details.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadWorker();
  }, [loadWorker]));
  useApiCacheRefresh('/worker/me', token ?? undefined, loadWorker);

  const updateAvailability = async (available: boolean) => {
    if (!token || saving) return;
    setSaving(true);
    try {
      const result = await mobileApi.updateWorkerStatus(token, available ? 'available' : 'off_duty');
      setWorker(result.worker);
    } catch (updateError) {
      Alert.alert('Availability not updated', updateError instanceof Error ? updateError.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const available = worker?.status === 'available';
  const busy = worker?.status === 'busy';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: Math.max(insets.bottom + 110, 120) }]}>
        <View style={styles.header}>
          <View style={styles.icon}>
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Shift & availability</Text>
            <Text style={styles.subtitle}>Your current assignment from Fixly</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void loadWorker()} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : worker ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dispatch availability</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: available ? colors.success : busy ? colors.primary : colors.textMuted }]} />
                <Text style={styles.statusText}>{busy ? 'Working on an assigned task' : available ? 'Available for jobs' : 'Off duty'}</Text>
                <Switch
                  value={available}
                  disabled={saving || busy}
                  onValueChange={(value) => void updateAvailability(value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Text style={styles.helper}>
                {busy ? 'Finish your active task before changing availability.' : 'When off duty, you will not receive new job assignments.'}
              </Text>
              {saving && <ActivityIndicator color={colors.primary} style={styles.inlineLoader} />}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Assigned shift</Text>
              <InfoRow icon="time-outline" label="Shift" value={worker.shift} />
              <InfoRow icon="business-outline" label="Department" value={worker.department} />
              <InfoRow icon="location-outline" label="Assigned building" value={worker.currentBuilding} />
            </View>
          </>
        ) : (
          <View style={styles.card}><Text style={styles.error}>No worker profile is associated with this account.</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
      </View>
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
  card: { backgroundColor: colors.white, borderRadius: 18, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { flex: 1, color: colors.textPrimary, fontWeight: '600' },
  helper: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 9 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  infoCopy: { flex: 1 },
  infoLabel: { color: colors.textSecondary, fontSize: 12 },
  infoValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 3 },
  loader: { marginTop: 48 },
  inlineLoader: { marginTop: 12, alignSelf: 'flex-start' },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  retry: { alignSelf: 'flex-start', marginTop: 12, padding: 8 },
  retryText: { color: colors.primary, fontWeight: '700' },
});
