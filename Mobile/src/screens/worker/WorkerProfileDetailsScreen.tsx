import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { mobileApi, MobileWorker } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useApiCacheRefresh } from '../../hooks/useApiCacheRefresh';
import { colors, spacing } from '../../theme/colors';
import { RootStackParamList } from '../../types';

type WorkerProfileDetailsProps = NativeStackScreenProps<RootStackParamList, 'WorkerProfileDetails'>;

export default function WorkerProfileDetailsScreen({ navigation }: WorkerProfileDetailsProps) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [worker, setWorker] = useState<MobileWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorker = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const result = await mobileApi.getCurrentWorker(token);
      setWorker(result.worker);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load worker details.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadWorker();
  }, [loadWorker]));
  useApiCacheRefresh('/worker/me', token ?? undefined, loadWorker);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Worker details" showBack={navigation.canGoBack()} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void loadWorker()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : worker ? (
          <View style={styles.card}>
            <Detail icon="person-outline" label="Name" value={worker.name} />
            <Detail icon="mail-outline" label="Email" value={worker.email} />
            <Detail icon="call-outline" label="Phone" value={worker.phone} />
            <Detail icon="construct-outline" label="Department" value={worker.department} />
            <Detail icon="time-outline" label="Assigned shift" value={worker.shift} />
            <Detail icon="business-outline" label="Assigned building" value={worker.currentBuilding} />
            <Detail icon="ellipse-outline" label="Availability" value={worker.status.replace('_', ' ')} />
          </View>
        ) : (
          <View style={styles.card}><Text style={styles.error}>No worker details are available for this account.</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

function Detail({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  label: { color: colors.textSecondary, fontSize: 12 },
  value: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 3, textTransform: 'capitalize' },
  loader: { marginTop: 48 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, paddingVertical: spacing.lg },
  retry: { alignSelf: 'flex-start', paddingBottom: spacing.md },
  retryText: { color: colors.primary, fontWeight: '700' },
});
