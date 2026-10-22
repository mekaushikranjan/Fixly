import React, { useCallback, useState } from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useApiCacheRefresh } from '../../hooks/useApiCacheRefresh';
import { colors } from '../../theme/colors';
import AccountOverview, { AccountOverviewRow } from '../../components/AccountOverview';
import { mobileApi, MobileWorker } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, WorkerTabParamList } from '../../types';
import { openDeviceSettings, shareSupportRequest, showPolicyInformation } from '../../lib/profileSupport';

type WorkerProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<WorkerTabParamList, 'WorkerProfile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function WorkerProfileScreen({ navigation }: WorkerProfileScreenProps) {
  useSystemBars(colors.primary, 'light');
  const { profile, token, logout } = useAuth();
  const [worker, setWorker] = useState<MobileWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorker = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setWorker((await mobileApi.getCurrentWorker(token)).worker);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load worker profile.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadWorker();
  }, [loadWorker]));
  useApiCacheRefresh('/worker/me', token ?? undefined, loadWorker);

  const details: AccountOverviewRow[] = worker ? [
    { label: 'Assigned shift', value: worker.shift, icon: 'time-outline' },
    { label: 'Department', value: worker.department, icon: 'construct-outline' },
    { label: 'Assigned building', value: worker.currentBuilding, icon: 'business-outline' },
  ] : [];

  return (
    <AccountOverview
      title="Worker account"
      name={worker?.name || profile.name}
      email={worker?.email || profile.email}
      initials={profile.initials}
      avatar={profile.avatar}
      subtitle={worker?.department}
      details={details}
      stats={worker ? [
        { label: 'Jobs completed', value: String(worker.jobsCompleted) },
        { label: 'Rating', value: worker.rating ? `${worker.rating.toFixed(1)} / 5` : 'New' },
        { label: 'Availability', value: worker.status.replace('_', ' ') },
      ] : []}
      loading={loading}
      error={error}
      onRetry={() => void loadWorker()}
      onLogout={logout}
      actions={[
        { label: 'Worker details', icon: 'id-card-outline', onPress: () => navigation.navigate('WorkerProfileDetails') },
        { label: 'Notifications', icon: 'notifications-outline', onPress: () => navigation.navigate('Notifications') },
        { label: 'Shift & availability', icon: 'calendar-outline', onPress: () => navigation.navigate('Shift') },
        { label: 'Performance', icon: 'stats-chart-outline', onPress: () => navigation.navigate('Performance') },
        { label: 'Change password', icon: 'key-outline', onPress: () => navigation.navigate('ForgotPassword', { email: worker?.email || profile.email }) },
      ]}
      supportActions={[
        { label: 'App settings', icon: 'settings-outline', onPress: () => void openDeviceSettings() },
        { label: 'Privacy policy', icon: 'shield-checkmark-outline', onPress: () => showPolicyInformation('privacy') },
        { label: 'Terms of use', icon: 'document-text-outline', onPress: () => showPolicyInformation('terms') },
        { label: 'Report a bug', icon: 'bug-outline', onPress: () => void shareSupportRequest('bug', 'worker') },
        { label: 'Send feedback', icon: 'chatbubble-ellipses-outline', onPress: () => void shareSupportRequest('feedback', 'worker') },
      ]}
    />
  );
}
