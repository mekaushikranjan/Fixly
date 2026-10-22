import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenHeader from '../../components/ScreenHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { colors, spacing } from '../../theme/colors';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useIssues } from '../../hooks/useIssues';
import { toReportItem } from '../../lib/issues';
import { ReportItem, UserReportsStackParamList } from '../../types';

type MyReportsScreenProps = NativeStackScreenProps<UserReportsStackParamList, 'MyReportsList'>;

export default function MyReportsScreen({ navigation }: MyReportsScreenProps) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { issues, loading, error } = useIssues();
  const reports = issues.map(toReportItem);

  const renderItem = ({ item }: { item: ReportItem }) => {
    const starCount = item.rating ?? item.feedback?.rating;
    return (
      <Pressable
        onPress={() => navigation.navigate('Tracking', { reportId: item.id })}
      >
        <Card style={{ marginBottom: spacing.sm, opacity: item.status === 'resolved' ? 0.75 : 1 }}>
          <View style={styles.rowTop}>
            <Text style={styles.title}>{item.title}</Text>
            <StatusBadge
              status={item.status}
              textOverride={item.status === 'queued' ? `Queued · #${item.queuePosition}` : undefined}
            />
          </View>
          <Text style={styles.sub}>
            {item.status === 'assigned' && item.worker
              ? `${item.worker.name} · ETA ${item.eta} min`
              : item.status === 'queued'
              ? 'Waiting for department team'
              : item.status === 'resolved'
              ? starCount ? `Rated ${'★'.repeat(starCount)}${'☆'.repeat(5 - starCount)}` : 'Resolved'
              : item.reportedAt}
          </Text>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader eyebrow={`${reports.filter((report) => report.status !== 'resolved').length} active`} title="My reports" />
      <FlatList
        data={reports}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(insets.bottom + 120, 130) },
        ]}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>{error || 'No reports yet'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 110 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  sub: { fontSize: 11, color: colors.textSecondary },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 13 },
});
