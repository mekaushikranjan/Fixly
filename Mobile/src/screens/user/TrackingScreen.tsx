import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenHeader from '../../components/ScreenHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, spacing, radius } from '../../theme/colors';
import { useSystemBars } from '../../hooks/useSystemBars';
import { useIssues } from '../../hooks/useIssues';
import { toReportItem } from '../../lib/issues';
import { mobileApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../types';

const FEEDBACK_TAGS = [
  '⚡ Fast arrival',
  '🛠️ Perfect repair',
  '🧼 Clean workspace',
  '🤝 Polite technician',
  '🔒 Safety compliant',
];

type TrackingScreenProps = NativeStackScreenProps<RootStackParamList, 'Tracking'>;

export default function TrackingScreen({ route, navigation }: TrackingScreenProps) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const reportId = route?.params?.reportId;
  const { token } = useAuth();
  const { issues, loading, error, refresh } = useIssues();
  const issue = issues.find((item) => item.id === reportId || item.ticketId === reportId) || issues[0];
  const report = issue ? toReportItem(issue) : null;
  const currentStage = report?.status === 'resolved'
    ? 'resolved'
    : report?.status === 'in_progress'
      ? 'in_progress'
      : 'on_the_way';

  // Feedback State
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Fullscreen photo modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setRating(issue?.feedback?.rating || 5);
    setFeedbackText(issue?.feedback?.comment || '');
    setFeedbackSubmitted(!!issue?.feedback);
  }, [issue?.id, issue?.feedback?.rating, issue?.feedback?.comment]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating needed', 'Please select at least 1 star.');
      return;
    }
    if (!issue || !token) return;
    try {
      await mobileApi.submitIssueFeedback(token, issue.id, rating, feedbackText);
      setFeedbackSubmitted(true);
      await refresh();
      Alert.alert('Feedback submitted', 'Your feedback has been saved.');
    } catch (submitError) {
      Alert.alert('Unable to submit feedback', submitError instanceof Error ? submitError.message : 'Please try again.');
    }
  };

  if (loading) return <View style={styles.loadingState}><ActivityIndicator color={colors.primary} /></View>;
  if (!report) {
    return (
      <View style={styles.loadingState}>
        <ScreenHeader title="Issue tracking" showBack={navigation?.canGoBack?.()} onBack={() => navigation?.goBack?.()} />
        <Text style={styles.emptyTrackingText}>{error || 'This issue is not available in your account.'}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={
          currentStage === 'resolved'
            ? 'Issue Resolved'
            : currentStage === 'in_progress'
            ? 'Work In Progress'
            : 'Worker On The Way'
        }
        eyebrow={`Ticket #${report.ticketId} · ${report.building}`}
        showBack={navigation?.canGoBack?.()}
        onBack={() => navigation?.goBack?.()}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="navigate-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Current status</Text>
          </View>
          <Text style={styles.timelineStepLabel}>{report.status.replace('_', ' ')}</Text>
          <Text style={styles.timelineDesc}>Status and assignment details are supplied by the Fixly service.</Text>
        </View>

        {/* 2. Worker Details Card (Only Name and Rating) */}
        {report.worker && (
          <View style={styles.workerCard}>
            <View style={styles.workerRow}>
              <View style={styles.workerAvatarWrap}>
                {report.worker.avatar ? (
                  <Image source={{ uri: report.worker.avatar }} style={styles.workerAvatar} />
                ) : (
                  <View style={styles.workerAvatarFallback}>
                    <Text style={styles.workerAvatarText}>{report.worker.initials || 'W'}</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.workerName}>{report.worker.name}</Text>
                <View style={styles.workerRatingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.workerRatingText}>
                    {report.worker.rating ? `${report.worker.rating} ★ Rating` : 'Assigned technician'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 3. Detailed Step-by-Step Tracking Timeline */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="git-network-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Live Tracking Steps</Text>
          </View>

          <View style={styles.timelineList}>
            {(report.timeline || []).map((step, idx) => {
              const isPast =
                currentStage === 'resolved'
                  ? true
                  : currentStage === 'in_progress'
                  ? idx <= 3
                  : idx <= 2;
              const isCurrent =
                currentStage === 'resolved'
                  ? idx === 4
                  : currentStage === 'in_progress'
                  ? idx === 3
                  : idx === 2;

              return (
                <View key={step.id || idx} style={styles.timelineItem}>
                  {/* Left Column: Icon and connecting line */}
                  <View style={styles.timelineLeftCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        isCurrent && styles.timelineDotCurrent,
                        isPast && !isCurrent && styles.timelineDotDone,
                      ]}
                    >
                      {isPast && !isCurrent ? (
                        <Ionicons name="checkmark" size={12} color={colors.white} />
                      ) : isCurrent ? (
                        <View style={styles.currentInnerDot} />
                      ) : (
                        <View style={styles.upcomingDot} />
                      )}
                    </View>

                    {idx < (report.timeline || []).length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isPast && styles.timelineLineDone,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Step details */}
                  <View style={styles.timelineRightCol}>
                    <View style={styles.timelineTitleRow}>
                      <Text
                        style={[
                          styles.timelineStepLabel,
                          isCurrent && styles.timelineStepLabelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                      <Text style={styles.timelineTime}>{step.time}</Text>
                    </View>
                    <Text style={styles.timelineDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
            {!(report.timeline || []).length && (
              <Text style={styles.timelineDesc}>No additional status history is available yet.</Text>
            )}
          </View>
        </View>

        {/* 4. Before & After Images Comparison Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="images-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Before & After Inspection Photos</Text>
          </View>

          <View style={styles.photoComparisonRow}>
            {/* Before Photo */}
            <View style={styles.photoCard}>
              <View style={styles.photoBadgeBefore}>
                <Text style={styles.photoBadgeText}>BEFORE REPORT</Text>
              </View>
              {report.beforeImage ? (
                <Pressable onPress={() => setSelectedImage(report.beforeImage!)}>
                  <Image source={{ uri: report.beforeImage }} style={styles.inspectionPhoto} />
                  <View style={styles.zoomHint}>
                    <Ionicons name="expand-outline" size={14} color={colors.white} />
                  </View>
                </Pressable>
              ) : (
                <View style={styles.noPhotoBox}>
                  <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                  <Text style={styles.noPhotoText}>No image</Text>
                </View>
              )}
              <Text style={styles.photoCaption}>Reported Issue Condition</Text>
            </View>

            {/* After Photo */}
            <View style={styles.photoCard}>
              <View
                style={[
                  styles.photoBadgeAfter,
                  currentStage !== 'resolved' && { backgroundColor: '#64748B' },
                ]}
              >
                <Text style={styles.photoBadgeText}>
                  {currentStage === 'resolved' ? 'AFTER RESOLUTION' : 'AWAITING REPAIR'}
                </Text>
              </View>
              {currentStage === 'resolved' && report.afterImage ? (
                <Pressable onPress={() => setSelectedImage(report.afterImage!)}>
                  <Image source={{ uri: report.afterImage }} style={styles.inspectionPhoto} />
                  <View style={styles.zoomHint}>
                    <Ionicons name="expand-outline" size={14} color={colors.white} />
                  </View>
                </Pressable>
              ) : (
                <View style={[styles.noPhotoBox, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons
                    name={currentStage === 'in_progress' ? 'construct-outline' : 'camera-outline'}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.noPhotoText}>
                    {currentStage === 'in_progress' ? 'Technician repairing...' : 'Pending resolution'}
                  </Text>
                </View>
              )}
              <Text style={styles.photoCaption}>
                {currentStage === 'resolved' ? 'Post-Service Verification' : 'Uploaded upon completion'}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Post-Completion Feedback & Rating Section */}
        {currentStage === 'resolved' && (
          <View style={[styles.sectionCard, styles.feedbackCard]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Service Feedback & Rating</Text>
            </View>

            {feedbackSubmitted ? (
              <View style={styles.feedbackSubmittedBox}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                </View>
                <Text style={styles.feedbackSubmittedTitle}>Thank you for your feedback!</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= rating ? 'star' : 'star-outline'}
                      size={20}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                {selectedTags.length > 0 && (
                  <View style={styles.submittedTagsWrap}>
                    {selectedTags.map((t, i) => (
                      <View key={i} style={styles.submittedTagBadge}>
                        <Text style={styles.submittedTagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {feedbackText ? (
                  <Text style={styles.submittedComment}>"{feedbackText}"</Text>
                ) : null}
                <Pressable
                  style={styles.editFeedbackBtn}
                  onPress={() => setFeedbackSubmitted(false)}
                >
                  <Text style={styles.editFeedbackText}>Edit Rating</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text style={styles.feedbackPrompt}>
                  How was your repair experience with {report.worker?.name || 'the technician'}?
                </Text>

                {/* 5-Star interactive selector */}
                <View style={styles.starsSelectorRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setRating(star)}
                      hitSlop={8}
                      style={styles.starTouch}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color="#F59E0B"
                      />
                    </Pressable>
                  ))}
                </View>

                {/* Quick Compliment / Feedback Chips */}
                <Text style={styles.chipsPrompt}>Select what went well:</Text>
                <View style={styles.tagsWrap}>
                  {FEEDBACK_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        style={[styles.tagChip, active && styles.tagChipActive]}
                        onPress={() => toggleTag(tag)}
                      >
                        <Text
                          style={[styles.tagChipText, active && styles.tagChipTextActive]}
                        >
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Written Comments */}
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Additional comments for Facilities Team (optional)..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                />

                <View style={{ marginTop: spacing.md }}>
                  <PrimaryButton label="Submit Feedback" onPress={handleFeedbackSubmit} />
                </View>
              </View>
            )}
          </View>
        )}

        {/* 6. Ticket Information Details Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Ticket & Location Details</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ticket ID</Text>
            <Text style={styles.detailVal}>#{report.ticketId}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Campus Location</Text>
            <Text style={styles.detailVal}>
              {report.building} · {report.floor} · {report.room}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issue Category</Text>
            <Text style={[styles.detailVal, { textTransform: 'capitalize' }]}>
              {report.category || 'General Repair'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reported At</Text>
            <Text style={styles.detailVal}>{report.reportedAt || 'Today, 9:40 AM'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Problem Description</Text>
            <Text style={[styles.detailVal, { flex: 1, textAlign: 'right' }]}>
              {report.description || 'Power socket sparking near desk.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Photo Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.fullscreenModal}>
          <Pressable
            style={styles.closeModalBtn}
            onPress={() => setSelectedImage(null)}
            hitSlop={10}
          >
            <Ionicons name="close" size={26} color={colors.white} />
          </Pressable>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTrackingText: {
    margin: spacing.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Stage Switcher
  stageSwitcher: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stageSwitcherLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stageBtnGroup: {
    flexDirection: 'row',
    backgroundColor: colors.gray,
    borderRadius: radius.pill,
    padding: 3,
  },
  stageBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  stageBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  stageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stageBtnTextActive: {
    color: colors.white,
  },

  // Map
  mapContainer: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Worker Card
  workerCard: {
    margin: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'relative',
  },
  workerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  workerAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 16,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  workerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  workerRatingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Sections
  sectionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Timeline
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    minHeight: 56,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    zIndex: 2,
  },
  timelineDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  timelineDotCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryTint,
    borderWidth: 3,
  },
  currentInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  upcomingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineLineDone: {
    backgroundColor: colors.success,
  },
  timelineRightCol: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineStepLabelCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  timelineTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  timelineDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Before & After Photos
  photoComparisonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoCard: {
    flex: 1,
  },
  photoBadgeBefore: {
    backgroundColor: '#DC2626',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  photoBadgeAfter: {
    backgroundColor: colors.success,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  photoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  inspectionPhoto: {
    width: '100%',
    height: 115,
    borderRadius: radius.sm,
    backgroundColor: colors.gray,
  },
  zoomHint: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoBox: {
    width: '100%',
    height: 115,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  noPhotoText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  photoCaption: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },

  // Feedback Card
  feedbackCard: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: '#FFFDF9',
  },
  feedbackPrompt: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 10,
  },
  starsSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  starTouch: {
    padding: 4,
  },
  chipsPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 6,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  tagChipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  tagChipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tagChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    height: 70,
    textAlignVertical: 'top',
  },
  feedbackSubmittedBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconCircle: {
    marginBottom: 6,
  },
  feedbackSubmittedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  submittedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  submittedTagBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  submittedTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  submittedComment: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  editFeedbackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editFeedbackText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Details
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Fullscreen Modal
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '92%',
    height: '75%',
  },
});
