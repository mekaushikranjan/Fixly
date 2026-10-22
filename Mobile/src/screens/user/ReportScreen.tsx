import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenHeader from '../../components/ScreenHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ReportConfirmationModal, { ReportConfirmationData } from '../../components/ReportConfirmationModal';
import { colors, radius, spacing } from '../../theme/colors';
import { issueCategories } from '../../data/catalog';
import { useSystemBars } from '../../hooks/useSystemBars';
import { RootStackParamList, UserTabParamList } from '../../types';
import { mobileApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const FLOORS = ['Ground', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'];

type ReportScreenProps = CompositeScreenProps<
  BottomTabScreenProps<UserTabParamList, 'Report'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ReportScreen({ navigation, route }: ReportScreenProps) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { profile, token } = useAuth();

  const [building, setBuilding] = useState(profile.block || '');
  const initialCategory = route?.params?.categoryId || route?.params?.category || 'Electrical';
  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    const selected = route?.params?.categoryId || route?.params?.category;
    if (selected) {
      setCategory(selected);
    }
  }, [route?.params?.categoryId, route?.params?.category]);
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showFloorPicker, setShowFloorPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ReportConfirmationData | null>(null);

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Sign in to submit a report.');
      return;
    }
    if (!building.trim() || !floor.trim() || !room.trim() || !description.trim()) {
      Alert.alert('Required details', 'Enter the building, floor, room, and a description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedCategory = issueCategories.find((item) => item.id === category);
      const { issue } = await mobileApi.createIssue(token, {
        title: `${selectedCategory?.label || category} issue`,
        description: description.trim(),
        category,
        department: category,
        building: building.trim(),
        floor: floor.trim(),
        room: room.trim(),
        ...(imageBase64 ? { photoBase64: imageBase64, photoMimeType: imageMimeType } : {}),
      });
      setConfirmationData({
        ticketId: issue.ticketId,
        building: issue.building,
        room: `${issue.floor}, Room ${issue.room}`,
        categoryLabel: selectedCategory?.label || category,
      });
      setShowConfirmation(true);
    } catch (submitError) {
      Alert.alert('Unable to submit report', submitError instanceof Error ? submitError.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pickImage = async (camera: boolean) => {
    try {
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: true, quality: 0.75 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.75 });
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return;
      if (!asset.base64) {
        Alert.alert('Photo unavailable', 'Could not read the selected photo. Please choose another image.');
        return;
      }
      setAttachedImage(asset.uri);
      setImageBase64(asset.base64);
      setImageMimeType(asset.mimeType || 'image/jpeg');
      setShowPhotoPicker(false);
    } catch (error) {
      Alert.alert('Photo unavailable', error instanceof Error ? error.message : 'Unable to open the selected photo source.');
    }
  };

  const handleTrack = () => {
    setShowConfirmation(false);
    if (confirmationData?.ticketId) {
      navigation.navigate('Tracking', { reportId: confirmationData.ticketId });
    } else {
      navigation.navigate('MyReports');
    }
  };

  const handleBackToDashboard = () => {
    setShowConfirmation(false);
    setRoom('');
    setDescription('');
    setAttachedImage(null);
    setImageBase64(null);
    navigation.navigate('Home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader eyebrow="Direct Facilities Dispatch" title="Report an Issue" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom + 120, 130) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Location details */}
        <View style={styles.locationInputsCard}>
          <Text style={styles.sectionHeaderTitle}>Campus location</Text>
          <Text style={styles.label}>Building / Block *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter building or block"
            placeholderTextColor={colors.textMuted}
            value={building}
            onChangeText={setBuilding}
          />
          <View style={styles.row}>
            {/* Floor Selector */}
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Floor *</Text>
              <Pressable
                style={styles.selectLike}
                onPress={() => setShowFloorPicker(true)}
              >
                <Text style={styles.selectText}>{floor || 'Select floor'}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Room / Unit Number */}
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Room / Unit Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 301, Lab 4"
                placeholderTextColor={colors.textMuted}
                value={room}
                onChangeText={setRoom}
              />
            </View>
          </View>
        </View>

        {/* 2. Issue Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipsWrap}>
          {issueCategories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.chip, category === c.id && styles.chipActive]}
            >
              <Ionicons
                name={c.icon as any}
                size={14}
                color={category === c.id ? colors.primaryDark : colors.textSecondary}
              />
              <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Optional issue photo */}
        <View style={styles.photoSectionHeader}>
          <Text style={styles.label}>Issue Photo (optional)</Text>
          <View style={styles.compulsoryBadge}>
            <Ionicons
              name={attachedImage ? 'checkmark-circle' : 'image-outline'}
              size={12}
              color={attachedImage ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.compulsoryBadgeText,
                attachedImage && { color: colors.success },
              ]}
            >
              {attachedImage ? 'Photo attached' : 'Optional'}
            </Text>
          </View>
        </View>

        {attachedImage ? (
          <View style={styles.photoAttachedCard}>
            <Image source={{ uri: attachedImage }} style={styles.attachedImagePreview} />
            <View style={styles.photoAttachedInfo}>
              <View style={styles.attachedSuccessRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.attachedSuccessText}>Photo ready for technician</Text>
              </View>
              <Text style={styles.attachedSubText}>
                Photo selected from this device.
              </Text>
              <View style={styles.photoActionsRow}>
                <Pressable
                  style={styles.photoChangeBtn}
                  onPress={() => setShowPhotoPicker(true)}
                >
                  <Text style={styles.photoChangeText}>Change Photo</Text>
                </Pressable>
                <Pressable
                  style={styles.photoRemoveBtn}
                  onPress={() => {
                    setAttachedImage(null);
                    setImageBase64(null);
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.photoBox}
            onPress={() => setShowPhotoPicker(true)}
          >
            <View style={styles.photoIconCircle}>
              <Ionicons
                name="camera"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.photoText}>Choose a photo from your device</Text>
            <Text style={styles.photoSubtext}>An optional image can help explain the issue.</Text>
          </Pressable>
        )}

        <Text style={[styles.label, { marginTop: spacing.md }]}>Description *</Text>
        <TextInput
          style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
          placeholder="Briefly describe what is happening (e.g. sparking, leaking, water pooling)..."
          placeholderTextColor={colors.textMuted}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Submit Button */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
          <PrimaryButton label="Submit Report" onPress={handleSubmit} loading={submitting} />
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <ReportConfirmationModal
        visible={showConfirmation}
        reportData={confirmationData}
        onClose={() => setShowConfirmation(false)}
        onTrack={handleTrack}
        onDashboard={handleBackToDashboard}
      />

      {/* Device photo picker */}
      <Modal
        visible={showPhotoPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Attach Issue Photo</Text>
                <Text style={styles.modalSubtitle}>Choose an optional issue image</Text>
              </View>
              <Pressable onPress={() => setShowPhotoPicker(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.manualUploadBox}>
              <Pressable
                style={styles.manualUploadBtn}
                onPress={() => void pickImage(true)}
              >
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                <Text style={styles.manualUploadText}>Take a photo</Text>
              </Pressable>
              <Pressable
                style={styles.manualUploadBtn}
                onPress={() => void pickImage(false)}
              >
                <Ionicons name="images-outline" size={18} color={colors.primary} />
                <Text style={styles.manualUploadText}>Choose from library</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floor Picker Modal */}
      <Modal
        visible={showFloorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFloorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingVertical: spacing.md }]}>
            <Text style={[styles.modalTitle, { marginBottom: 12, paddingHorizontal: spacing.md }]}>
              Select floor
            </Text>
            {FLOORS.map((f) => (
              <Pressable
                key={f}
                style={[styles.floorItem, floor === f && styles.floorItemActive]}
                onPress={() => {
                  setFloor(f);
                  setShowFloorPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.floorItemText,
                    floor === f && styles.floorItemTextActive,
                  ]}
                >
                  {f}
                </Text>
                {floor === f && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.lg,
    paddingBottom: 110,
  },

  // Block Detection Card
  blockDetectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(242, 101, 34, 0.3)',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  blockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  gpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.3,
  },
  accuracyText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  selectedBlockTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  blockPromptText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 16,
  },
  blockChipsScroll: {
    flexDirection: 'row',
    paddingTop: 2,
  },
  blockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    backgroundColor: colors.gray,
  },
  blockChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  blockChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  blockChipTextActive: {
    color: colors.white,
  },

  // Location inputs card
  locationInputsCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  selectLike: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.gray,
  },
  selectText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },

  // Photo Section
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  compulsoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  compulsoryBadgeError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  compulsoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  photoBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: colors.white,
  },
  photoBoxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  photoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  photoText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  photoSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // Photo Attached
  photoAttachedCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
    marginTop: 6,
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attachedImagePreview: {
    width: 70,
    height: 70,
    borderRadius: radius.sm,
    backgroundColor: colors.gray,
  },
  photoAttachedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attachedSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  attachedSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  attachedSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  photoChangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
  },
  photoChangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  photoRemoveBtn: {
    padding: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  presetsList: {
    gap: 8,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  presetThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  presetCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  manualUploadBox: {
    marginTop: spacing.md,
  },
  manualUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  manualUploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  // Floor Picker
  floorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  floorItemActive: {
    backgroundColor: colors.primaryTint,
  },
  floorItemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  floorItemTextActive: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
