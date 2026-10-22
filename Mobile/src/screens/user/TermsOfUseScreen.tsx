import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme/colors';
import { RootStackParamList } from '../../types';
import { useSystemBars } from '../../hooks/useSystemBars';

type Props = NativeStackScreenProps<RootStackParamList, 'TermsOfUse'>;

export default function TermsOfUseScreen({ navigation }: Props) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();

  const rules = [
    {
      icon: 'checkmark-circle' as const,
      color: '#059669',
      bgColor: '#D1FAE5',
      title: '1. Genuine Campus Reports',
      body: 'Users agree to file only legitimate, accurate maintenance and facility issues occurring on the university campus grounds, classrooms, hostels, or common areas.',
    },
    {
      icon: 'alert-circle' as const,
      color: '#DC2626',
      bgColor: '#FEE2E2',
      title: '2. Prohibited Content & Behavior',
      body: 'Do not submit passwords, personal confidential documents, harassing language, or prank requests. Violations are subject to disciplinary review under campus student/staff codes.',
    },
    {
      icon: 'hammer' as const,
      color: '#D97706',
      bgColor: '#FEF3C7',
      title: '3. Technician Access & Scheduling',
      body: 'By reporting an in-room facility issue, residents authorize assigned campus maintenance staff and department supervisors to inspect and service the specified location during operating hours.',
    },
    {
      icon: 'shield' as const,
      color: '#2563EB',
      bgColor: '#DBEAFE',
      title: '4. Critical Escalations',
      body: 'For life-threatening emergencies, major electrical hazards, or active gas leaks, immediately contact campus emergency response personnel rather than waiting for standard app dispatch.',
    },
    {
      icon: 'refresh-circle' as const,
      color: '#7C3AED',
      bgColor: '#EDE9FE',
      title: '5. Account & Policy Updates',
      body: 'The university reserves the right to modify these operational terms as campus facility requirements evolve. Continued use of Fixly indicates agreement with the updated terms.',
    },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Terms of Use"
        eyebrow="CAMPUS SERVICE AGREEMENT"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 40, 60) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.effectiveDate}>LPU Smart Campus Facility Terms</Text>
          <Text style={styles.introText}>
            Welcome to Fixly. By accessing or using this campus maintenance tracking platform, you agree to comply with the standard university guidelines and conditions outlined below.
          </Text>
        </View>

        {rules.map((rule) => (
          <View key={rule.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: rule.bgColor }]}>
                <Ionicons name={rule.icon} size={18} color={rule.color} />
              </View>
              <Text style={styles.cardTitle}>{rule.title}</Text>
            </View>
            <Text style={styles.cardBody}>{rule.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  effectiveDate: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  introText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
