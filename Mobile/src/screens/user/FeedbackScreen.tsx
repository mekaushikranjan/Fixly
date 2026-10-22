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

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

const TOPICS = [
  'General Experience',
  'Speed of Resolution',
  'Campus Technician Service',
  'App Usability & Design',
  'New Feature Request',
];

const RATING_LABELS = ['', 'Needs Improvement', 'Fair', 'Good', 'Very Good', 'Excellent!'];

export default function FeedbackScreen({ navigation }: Props) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [rating, setRating] = useState(5);
  const [selectedTopic, setSelectedTopic] = useState('General Experience');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!comment.trim()) {
      Alert.alert('Missing Feedback', 'Please share a few words about your experience.');
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScreenHeader
        title="Send Feedback"
        eyebrow="COMMUNITY VOICE"
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
              <Ionicons name="heart" size={44} color="#EA580C" />
            </View>
            <Text style={styles.successTitle}>Thank You, {profile.name || 'Campus Member'}!</Text>
            <Text style={styles.successSubtitle}>
              Your feedback helps our facilities and development teams improve the Fixly smart campus experience every day.
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
            {/* Rating Stars Card */}
            <View style={styles.ratingCard}>
              <Text style={styles.ratingPrompt}>HOW HAS YOUR FIXLY EXPERIENCE BEEN?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    hitSlop={8}
                    style={styles.starButton}
                    accessibilityLabel={`Rate ${star} stars`}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
            </View>

            {/* Topic Selector */}
            <View style={styles.section}>
              <Text style={styles.label}>WHAT IS THIS FEEDBACK ABOUT?</Text>
              <View style={styles.topicWrap}>
                {TOPICS.map((topic) => {
                  const isSelected = selectedTopic === topic;
                  return (
                    <Pressable
                      key={topic}
                      style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                      onPress={() => setSelectedTopic(topic)}
                    >
                      <Text
                        style={[
                          styles.topicChipText,
                          isSelected && styles.topicChipTextSelected,
                        ]}
                      >
                        {topic}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Comment Area */}
            <View style={styles.section}>
              <Text style={styles.label}>YOUR THOUGHTS & SUGGESTIONS</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What did you like? What could we do better?"
                placeholderTextColor={colors.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <Pressable
              style={styles.primaryButton}
              onPress={handleSubmit}
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-ellipses" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Submit Feedback</Text>
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
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: spacing.sm,
  },
  ratingPrompt: {
    color: '#8A8780',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  starButton: {
    padding: 2,
  },
  ratingLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
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
  topicWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFD8',
  },
  topicChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topicChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  topicChipTextSelected: {
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
    minHeight: 120,
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
    backgroundColor: '#FFEDD5',
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
