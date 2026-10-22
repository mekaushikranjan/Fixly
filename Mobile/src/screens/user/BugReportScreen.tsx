import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme/colors';
import { RootStackParamList } from '../../types';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'BugReport'>;

const CATEGORIES = [
  { id: 'ui', label: 'Display & UI', icon: 'color-palette-outline' as const },
  { id: 'push', label: 'Push Notifications', icon: 'notifications-outline' as const },
  { id: 'camera', label: 'Photo & Uploads', icon: 'camera-outline' as const },
  { id: 'ticket', label: 'Ticket Status', icon: 'receipt-outline' as const },
  { id: 'other', label: 'Other Glitch', icon: 'help-circle-outline' as const },
];

export default function BugReportScreen({ navigation }: Props) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('ui');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a short title for the bug.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please explain what went wrong.');
      return;
    }

    // In a real backend, this would POST to /api/support or /api/bugs
    setIsSubmitted(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScreenHeader
        title="Report a Bug"
        eyebrow="SUPPORT & FEEDBACK"
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
        {isSubmitted ? (
          <View style={styles.successCard}>
            <View style={styles.successIconBadge}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
            </View>
            <Text style={styles.successTitle}>Bug Report Received!</Text>
            <Text style={styles.successSubtitle}>
              Thank you for helping us make Fixly better. Our engineering team has logged this report with diagnostic information for account {profile.email}.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Return to Profile</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.helperCard}>
              <Ionicons name="bug-outline" size={20} color={colors.primary} />
              <Text style={styles.helperText}>
                Describe the issue you experienced and the steps to reproduce it. We'll investigate and patch it in an upcoming release.
              </Text>
            </View>

            {/* Category Selector */}
            <View style={styles.section}>
              <Text style={styles.label}>WHAT TYPE OF ISSUE IS THIS?</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={15}
                        color={isSelected ? '#FFFFFF' : colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Bug Title */}
            <View style={styles.section}>
              <Text style={styles.label}>ISSUE TITLE</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cannot view push notifications outside app"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
            </View>

            {/* Bug Description */}
            <View style={styles.section}>
              <Text style={styles.label}>WHAT HAPPENED?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what occurred, what you expected, and any error messages seen..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Steps to Reproduce */}
            <View style={styles.section}>
              <Text style={styles.label}>STEPS TO REPRODUCE (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                placeholder="1. Open profile tab&#10;2. Tap on notifications&#10;3. Observe crash or freeze"
                placeholderTextColor={colors.textMuted}
                value={steps}
                onChangeText={setSteps}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Device Info Tag */}
            <View style={styles.deviceInfoCard}>
              <Ionicons name="phone-portrait-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.deviceInfoText}>
                Device: {Platform.OS.toUpperCase()} • Account: {profile.name || profile.email}
              </Text>
            </View>

            {/* Submit Button */}
            <Pressable
              style={styles.primaryButton}
              onPress={handleSubmit}
              accessibilityRole="button"
            >
              <Ionicons name="paper-plane" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Submit Bug Report</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: '#FDE9DC',
    borderWidth: 1,
    borderColor: '#FCD8C1',
  },
  helperText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: 6,
  },
  label: {
    color: '#8A8780',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFD8',
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2DFD8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
  },
  textAreaSmall: {
    minHeight: 75,
  },
  deviceInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EFECE6',
  },
  deviceInfoText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: spacing.lg,
  },
  successIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  successSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
