import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import StatusBadge from '../../components/StatusBadge';
import { colors, radius, spacing } from '../../theme/colors';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useAuth } from '../../context/AuthContext';
import { IssueStatus, mobileApi } from '../../lib/api';
import { useIssues } from '../../hooks/useIssues';

export default function ActiveTaskScreen() {
  useSystemBars(colors.primary, 'light');
  const route = useRoute();
  const { token } = useAuth();
  const { issues, loading, error, refresh } = useIssues();
  const [saving, setSaving] = useState(false);
  const params = route.params;
  const issueId = params && 'jobId' in params && typeof params.jobId === 'string' ? params.jobId : undefined;
  const issue = useMemo(
    () => issues.find((item) => item.id === issueId || item.ticketId === issueId) || (issueId ? undefined : issues[0]),
    [issues, issueId],
  );

  const updateStatus = async (status: IssueStatus) => {
    if (!token || !issue) return;
    setSaving(true);
    try {
      await mobileApi.updateIssueStatus(token, issue.id, status);
      await refresh();
      Alert.alert('Issue updated', `Issue status is now ${status.replace('_', ' ')}.`);
    } catch (updateError) {
      Alert.alert('Unable to update issue', updateError instanceof Error ? updateError.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!issue) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Active task" />
        <View style={styles.centerContent}>
          <Ionicons name="construct-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{error ? 'Could not load task' : 'No active task'}</Text>
          <Text style={styles.bodyText}>{error || 'Accept an available issue to see its task details here.'}</Text>
          {error && <Pressable onPress={() => void refresh()}><Text style={styles.retry}>Retry</Text></Pressable>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Issue task" eyebrow={`Ticket #${issue.ticketId}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{issue.title}</Text>
            <StatusBadge status={issue.status} />
          </View>
          <Text style={styles.bodyText}>{issue.description}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={17} color={colors.primary} />
            <Text style={styles.infoText}>{[issue.building, issue.floor, issue.room].filter(Boolean).join(' · ')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={17} color={colors.primary} />
            <Text style={styles.infoText}>Reported by {issue.reportedBy}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="construct-outline" size={17} color={colors.primary} />
            <Text style={styles.infoText}>{issue.department} · {issue.category}</Text>
          </View>
          {issue.photoUrl ? (
            <Image source={{ uri: issue.photoUrl }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Text style={styles.bodyText}>No issue photo was attached.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Task status</Text>
          <Text style={styles.bodyText}>
            SLA deadline: {new Date(issue.slaDeadline).toLocaleString()}
          </Text>
          {issue.status === 'assigned' && (
            <Pressable disabled={saving} style={styles.action} onPress={() => void updateStatus('in_progress')}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionText}>Start work</Text>}
            </Pressable>
          )}
          {issue.status === 'in_progress' && (
            <Pressable disabled={saving} style={styles.action} onPress={() => void updateStatus('resolved')}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionText}>Mark resolved</Text>}
            </Pressable>
          )}
          {issue.status === 'resolved' && <Text style={styles.bodyText}>This issue has been resolved.</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  bodyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  photo: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.bg },
  action: { minHeight: 48, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  emptyTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  retry: { color: colors.primaryDark, fontWeight: '700', marginTop: spacing.sm },
});
