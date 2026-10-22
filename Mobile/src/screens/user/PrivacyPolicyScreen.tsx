import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme/colors';
import { RootStackParamList } from '../../types';
import { useSystemBars } from '../../hooks/useSystemBars';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();

  const sections = [
    {
      icon: 'shield-checkmark' as const,
      color: '#047857',
      bgColor: '#ECFDF5',
      title: '1. Information We Collect',
      body: 'Fixly collects your campus name, institutional email address, phone number (if provided), and campus room/building assignments. When you file a maintenance ticket, photos, descriptions, and location metadata are saved to facilitate technician dispatch.',
    },
    {
      icon: 'analytics' as const,
      color: '#4338CA',
      bgColor: '#E0E7FF',
      title: '2. How Your Data Is Used',
      body: 'Your data is strictly utilized for campus facility operations, technician routing, safety compliance, and resolution progress notifications. We do not sell or monetize personal student or faculty information with third-party advertisers.',
    },
    {
      icon: 'lock-closed' as const,
      color: '#B45309',
      bgColor: '#FEF3C7',
      title: '3. Data Security & Storage',
      body: 'All communications between the mobile application and campus servers use HTTPS/TLS encryption. Sensitive credentials, push registration tokens, and ticket attachments are maintained in protected databases with role-based access control.',
    },
    {
      icon: 'notifications' as const,
      color: '#7E22CE',
      bgColor: '#F3E8FF',
      title: '4. Push Notifications',
      body: 'Push notifications are dispatched through Firebase Cloud Messaging (FCM) to update you when your ticket is assigned, underway, or resolved. You can manage or disable push notification permissions anytime in your device settings.',
    },
    {
      icon: 'person' as const,
      color: '#0369A1',
      bgColor: '#E0F2FE',
      title: '5. Your Rights & Retention',
      body: 'You may update your profile details and campus residence information directly through the app. For full record deletion or campus privacy inquiries, contact your campus administration office.',
    },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Privacy Policy"
        eyebrow="CAMPUS DATA PROTECTION"
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
          <Text style={styles.effectiveDate}>Effective Date: October 2026</Text>
          <Text style={styles.introText}>
            Fixly is committed to protecting the privacy and personal records of all students, faculty, and campus staff members. This policy explains how we collect, store, and manage your campus service data.
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBadge, { backgroundColor: section.bgColor }]}>
                <Ionicons name={section.icon} size={18} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footerCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.footerText}>
            Questions regarding this privacy statement should be directed to the Campus Facilities & Administration desk.
          </Text>
        </View>
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: spacing.sm,
  },
  sectionHeader: {
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
  sectionTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: '#F1EFE9',
  },
  footerText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
