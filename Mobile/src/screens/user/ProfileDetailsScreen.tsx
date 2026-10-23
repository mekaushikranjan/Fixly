import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useSystemBars } from '../../hooks/useSystemBars';
import { RootStackParamList } from '../../types';

type ProfileDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfileDetails'>;
type ResidenceType = 'hostel' | 'day_scholar';

export default function ProfileDetailsScreen({ navigation }: ProfileDetailsScreenProps) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, updateProfilePhoto } = useAuth();

  const [phone, setPhone] = useState(profile.phone || '');
  const [room, setRoom] = useState(profile.room || '');
  const [block, setBlock] = useState(profile.block || '');
  const [residenceType, setResidenceType] = useState<ResidenceType>(
    profile.residenceType || (profile.block || profile.room ? 'hostel' : 'day_scholar'),
  );
  const [address, setAddress] = useState(profile.address || '');
  const [city, setCity] = useState(profile.city || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [tempPhone, setTempPhone] = useState(phone);
  const [tempRoom, setTempRoom] = useState(room);
  const [tempBlock, setTempBlock] = useState(block);
  const [tempResidenceType, setTempResidenceType] = useState<ResidenceType>(residenceType);
  const [tempAddress, setTempAddress] = useState(address);
  const [tempCity, setTempCity] = useState(city);
  const residenceDetails = residenceType === 'hostel' ? [block, room] : [address, city];
  const profileProgress = Math.round(([phone, ...residenceDetails].filter(Boolean).length / 3) * 100);

  useEffect(() => {
    setPhone(profile.phone || '');
    setRoom(profile.room || '');
    setBlock(profile.block || '');
    setResidenceType(profile.residenceType || (profile.block || profile.room ? 'hostel' : 'day_scholar'));
    setAddress(profile.address || '');
    setCity(profile.city || '');
  }, [profile.phone, profile.room, profile.block, profile.residenceType, profile.address, profile.city]);

  const openEditModal = () => {
    setTempPhone(phone);
    setTempRoom(room);
    setTempBlock(block);
    setTempResidenceType(residenceType);
    setTempAddress(address);
    setTempCity(city);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const nextPhone = tempPhone.trim();
      const nextBlock = tempBlock.trim();
      const nextRoom = tempRoom.trim();
      const nextAddress = tempAddress.trim();
      const nextCity = tempCity.trim();
      await updateProfile({
        phone: nextPhone,
        residenceType: tempResidenceType,
        block: tempResidenceType === 'hostel' ? nextBlock : '',
        room: tempResidenceType === 'hostel' ? nextRoom : '',
        address: tempResidenceType === 'day_scholar' ? nextAddress : '',
        city: tempResidenceType === 'day_scholar' ? nextCity : '',
      });
      setPhone(nextPhone);
      setResidenceType(tempResidenceType);
      setBlock(tempResidenceType === 'hostel' ? nextBlock : '');
      setRoom(tempResidenceType === 'hostel' ? nextRoom : '');
      setAddress(tempResidenceType === 'day_scholar' ? nextAddress : '');
      setCity(tempResidenceType === 'day_scholar' ? nextCity : '');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Profile not updated', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    if (isSavingPhoto) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo library access to choose a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const photo = result.assets[0];
      if (!photo.base64 || !photo.mimeType) {
        Alert.alert('Photo unavailable', 'Could not read this photo. Choose another image and try again.');
        return;
      }
      setIsSavingPhoto(true);
      await updateProfilePhoto(photo.base64, photo.mimeType);
    } catch (error) {
      Alert.alert('Photo not updated', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        eyebrow="ACCOUNT"
        title="Profile details"
        showBack={navigation.canGoBack()}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 36, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introRow}>
          <View style={styles.introCopy}>
            <Text style={styles.introEyebrow}>YOUR FIXLY ID</Text>
            <Text style={styles.introTitle}>Campus, connected.</Text>
          </View>
          <View style={styles.completionBadge}>
            <Text style={styles.completionValue}>
              {([phone, block, room].filter(Boolean).length)}/3
            </Text>
            <Text style={styles.completionLabel}>DETAILS</Text>
          </View>
        </View>

        <LinearGradient
          colors={['#FF763B', '#F26522', '#D94E0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.passCard}
        >
          <View pointerEvents="none" style={styles.passOrb} />
          <View pointerEvents="none" style={styles.passOrbit} />
          <View style={styles.passTopline}>
            <View style={styles.passBrand}>
              <View style={styles.passBrandIcon}>
                <Ionicons name="flash" size={14} color={colors.primaryDark} />
              </View>
              <Text style={styles.passBrandText}>FIXLY <Text style={styles.passBrandSub}>CAMPUS PASS</Text></Text>
            </View>
            <View style={styles.passStatus}>
              <View style={styles.passStatusDot} />
              <Text style={styles.passStatusText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.passIdentity}>
            <Pressable
              style={styles.avatarFrame}
              onPress={() => void handleChangePhoto()}
              disabled={isSavingPhoto}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarFallback}>{profile.initials || 'U'}</Text>
              )}
              <View style={styles.avatarEditBadge}>
                {isSavingPhoto
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Ionicons name="camera" size={13} color="#FFFFFF" />}
              </View>
            </Pressable>
            <View style={styles.identityCopy}>
              <Text style={styles.userName} numberOfLines={1}>{profile.name || 'Campus Member'}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{profile.email || 'Email not provided'}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#FFF1B8" />
          </View>

          <View style={styles.passFooter}>
            <View style={styles.memberNumber}>
              <Text style={styles.memberLabel}>MEMBER NUMBER</Text>
              <Text style={styles.memberValue} numberOfLines={1}>
                {profile.userId || 'FIXLY CAMPUS MEMBER'}
              </Text>
            </View>
            <View style={styles.barcode} accessibilityElementsHidden>
              {[12, 4, 8, 3, 6, 3, 10, 4, 6, 3, 8, 4, 12].map((width, index) => (
                <View key={index} style={[styles.barcodeLine, { width }]} />
              ))}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.completionCard}>
          <View style={styles.completionTop}>
            <View style={styles.completionIcon}>
              <Ionicons name="sparkles-outline" size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.completionCopy}>
              <Text style={styles.completionTitle}>Your profile strength</Text>
              <Text style={styles.completionHint}>A few details help us find you faster.</Text>
            </View>
            <Text style={styles.completionPercent}>{profileProgress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${profileProgress}%` }]} />
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIndex}>01</Text>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.sectionRule} />
          <Text style={styles.sectionMeta}>HOW TO REACH YOU</Text>
        </View>

        <View style={styles.contactCard}>
          <View style={styles.contactMain}>
            <View style={styles.contactIcon}>
              <Ionicons name="call" size={17} color="#FFFFFF" />
            </View>
            <View style={styles.contactCopy}>
              <Text style={styles.detailEyebrow}>MOBILE NUMBER</Text>
              <Text style={styles.phoneValue} numberOfLines={1}>{phone || 'Add your phone number'}</Text>
            </View>
            <View style={styles.contactEndMark}>
              <Ionicons name="arrow-up-outline" size={16} color="#F26522" />
            </View>
          </View>
          <View style={styles.contactDivider} />
          <View style={styles.emailRow}>
            <View style={styles.emailIcon}>
              <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.emailCopy}>
              <Text style={styles.detailEyebrow}>ACCOUNT EMAIL</Text>
              <Text style={styles.emailValue} numberOfLines={1}>{profile.email || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIndex}>02</Text>
          <Text style={styles.sectionTitle}>Campus address</Text>
          <View style={styles.sectionRule} />
        </View>

        <View style={styles.addressCard}>
          <View pointerEvents="none" style={styles.addressDecor}>
            <View style={styles.addressDecorInner} />
          </View>
          <View style={styles.addressHeading}>
            <View style={styles.addressPin}>
              <Ionicons name="location" size={17} color={colors.primaryDark} />
            </View>
            <View>
              <Text style={styles.addressEyebrow}>
                {residenceType === 'hostel' ? 'HOSTEL RESIDENCE' : 'DAY SCHOLAR ADDRESS'}
              </Text>
              <Text style={styles.addressTitle}>
                {residenceType === 'hostel' ? 'Your campus residence.' : 'Your home address.'}
              </Text>
            </View>
          </View>
          <View style={styles.addressGrid}>
            <View style={styles.addressCell}>
              <Text style={styles.addressCellLabel}>
                {residenceType === 'hostel' ? 'BUILDING / BLOCK' : 'ADDRESS'}
              </Text>
              <Text style={styles.addressCellValue} numberOfLines={2}>
                {(residenceType === 'hostel' ? block : address) || 'Not added'}
              </Text>
            </View>
            <View style={styles.addressConnector}>
              <Ionicons name="arrow-forward" size={15} color={colors.primaryDark} />
            </View>
            <View style={styles.addressCell}>
              <Text style={styles.addressCellLabel}>
                {residenceType === 'hostel' ? 'ROOM / UNIT' : 'CITY'}
              </Text>
              <Text style={styles.addressCellValue} numberOfLines={2}>
                {(residenceType === 'hostel' ? room : city) || 'Not added'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          onPress={openEditModal}
          accessibilityRole="button"
        >
          <View style={styles.editButtonIcon}>
            <Ionicons name="create-outline" size={18} color={colors.primaryDark} />
          </View>
          <Text style={styles.editButtonText}>Update my details</Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
          {' '}Your details are only used to support campus services.
        </Text>
      </ScrollView>

      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalScrim} onPress={() => setIsEditing(false)} />
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl) }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingCopy}>
                <Text style={styles.modalEyebrow}>ACCOUNT SETTINGS</Text>
                <Text style={styles.modalTitle}>Edit your details</Text>
                <Text style={styles.modalSubtitle}>Keep your campus information up to date.</Text>
              </View>
              <Pressable
                onPress={() => setIsEditing(false)}
                hitSlop={8}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close edit profile"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.form}
            >
              <InputField
                icon="call-outline"
                label="Phone number"
                value={tempPhone}
                onChangeText={setTempPhone}
                keyboardType="phone-pad"
                placeholder="+91 XXXXX XXXXX"
              />
              <View style={styles.residenceSelector}>
                <Text style={styles.fieldLabel}>Where do you live?</Text>
                <View style={styles.residenceOptions}>
                  <ResidenceOption
                    icon="business-outline"
                    label="Hostel"
                    selected={tempResidenceType === 'hostel'}
                    onPress={() => setTempResidenceType('hostel')}
                  />
                  <ResidenceOption
                    icon="home-outline"
                    label="Day scholar"
                    selected={tempResidenceType === 'day_scholar'}
                    onPress={() => setTempResidenceType('day_scholar')}
                  />
                </View>
              </View>
              {tempResidenceType === 'hostel' ? (
                <>
                  <InputField
                    icon="business-outline"
                    label="Building name / block"
                    value={tempBlock}
                    onChangeText={setTempBlock}
                    placeholder="e.g. Block 32"
                  />
                  <InputField
                    icon="bed-outline"
                    label="Room number"
                    value={tempRoom}
                    onChangeText={setTempRoom}
                    placeholder="e.g. Room 301"
                    returnKeyType="done"
                  />
                </>
              ) : (
                <>
                  <InputField
                    icon="location-outline"
                    label="Address"
                    value={tempAddress}
                    onChangeText={setTempAddress}
                    placeholder="House, street, or locality"
                  />
                  <InputField
                    icon="navigate-outline"
                    label="City name"
                    value={tempCity}
                    onChangeText={setTempCity}
                    placeholder="e.g. Phagwara"
                    returnKeyType="done"
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, isSaving && styles.disabled]}
                onPress={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={colors.white} />
                    <Text style={styles.saveButtonText}>Save changes</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function InputField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  returnKeyType = 'next',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  returnKeyType?: 'next' | 'done';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

function ResidenceOption({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.residenceOption, selected && styles.residenceOptionSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Ionicons
        name={icon}
        size={17}
        color={selected ? colors.primaryDark : colors.textSecondary}
      />
      <Text style={[styles.residenceOptionText, selected && styles.residenceOptionTextSelected]}>
        {label}
      </Text>
      {selected ? <Ionicons name="checkmark-circle" size={16} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: 17 },
  introRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  introCopy: { flex: 1, paddingRight: spacing.sm },
  introEyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  introTitle: { color: colors.textPrimary, fontSize: 23, lineHeight: 29, fontWeight: '800', marginTop: 4 },
  completionBadge: {
    width: 59,
    height: 59,
    borderRadius: 20,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '5deg' }],
  },
  completionValue: { color: colors.primaryDark, fontSize: 18, fontWeight: '900' },
  completionLabel: { color: colors.textSecondary, fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginTop: 1 },
  passCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 25,
    padding: 19,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.17,
    shadowRadius: 15,
    elevation: 5,
  },
  passOrb: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.1)',
    right: -93,
    top: -101,
  },
  passOrbit: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 73,
    right: -27,
    top: -79,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  passTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passBrandIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#FFF1B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBrandText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  passBrandSub: { color: 'rgba(255,255,255,0.75)', fontSize: 8, fontWeight: '700', letterSpacing: 0.7 },
  passStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  passStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF1B8' },
  passStatusText: { color: '#FFF1B8', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  passIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 23, marginBottom: 18 },
  avatarFrame: {
    width: 62,
    height: 62,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarFallback: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  avatarEditBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  identityCopy: { flex: 1, minWidth: 0 },
  userName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  userEmail: { color: 'rgba(255,255,255,0.82)', fontSize: 11, marginTop: 5 },
  passFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  memberNumber: { flex: 1, minWidth: 0 },
  memberLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  memberValue: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 4 },
  barcode: { height: 25, flexDirection: 'row', alignItems: 'stretch', gap: 2, opacity: 0.8 },
  barcodeLine: { height: '100%', backgroundColor: '#FFF1B8', borderRadius: 1 },
  completionCard: {
    padding: 14,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAE4',
  },
  completionTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  completionIcon: { width: 33, height: 33, borderRadius: 11, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  completionCopy: { flex: 1 },
  completionTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' },
  completionHint: { color: colors.textSecondary, fontSize: 10, marginTop: 3 },
  completionPercent: { color: colors.primaryDark, fontSize: 12, fontWeight: '900' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: '#F0EEE9', overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  sectionIndex: { color: '#F26522', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  sectionRule: { height: 1, flex: 1, backgroundColor: '#E5E2DA', marginLeft: 3 },
  sectionMeta: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  contactCard: {
    padding: 15,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAE4',
  },
  contactMain: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  contactIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F26522', alignItems: 'center', justifyContent: 'center' },
  contactCopy: { flex: 1, minWidth: 0 },
  detailEyebrow: { color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  phoneValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 4 },
  contactEndMark: { width: 29, height: 29, borderRadius: 10, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  contactDivider: { height: 1, backgroundColor: '#F0EEE9', marginVertical: 13 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F3F1EC', alignItems: 'center', justifyContent: 'center' },
  emailCopy: { flex: 1, minWidth: 0 },
  emailValue: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 4 },
  addressCard: {
    position: 'relative',
    overflow: 'hidden',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFF1E7',
    borderWidth: 1,
    borderColor: '#F3DCCB',
  },
  addressDecor: { position: 'absolute', width: 128, height: 128, borderRadius: 64, right: -48, top: -51, borderWidth: 1, borderColor: 'rgba(242,101,34,0.16)' },
  addressDecorInner: { position: 'absolute', width: 88, height: 88, borderRadius: 44, right: 19, top: 19, borderWidth: 1, borderColor: 'rgba(242,101,34,0.13)' },
  addressHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addressPin: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#F8DCC9', alignItems: 'center', justifyContent: 'center' },
  addressEyebrow: { color: colors.primaryDark, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  addressTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '800', marginTop: 3 },
  addressGrid: { flexDirection: 'row', alignItems: 'center', marginTop: 17, gap: 8 },
  addressCell: { flex: 1, minHeight: 74, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.78)' },
  addressCellLabel: { color: colors.textSecondary, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  addressCellValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '800', marginTop: 7 },
  addressConnector: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F8DCC9', alignItems: 'center', justifyContent: 'center' },
  editButton: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 11,
    borderRadius: 19,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 1,
  },
  editButtonIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#FFF1B8', alignItems: 'center', justifyContent: 'center' },
  editButtonText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  privacyNote: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: -6 },
  pressed: { opacity: 0.82 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(25,22,19,0.42)' },
  modalScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D7D3CB', alignSelf: 'center', marginBottom: spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  modalHeadingCopy: { flex: 1 },
  modalEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  modalTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4 },
  modalSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#ECEAE4', alignItems: 'center', justifyContent: 'center' },
  form: { gap: spacing.md, paddingBottom: spacing.md },
  residenceSelector: { gap: 8 },
  residenceOptions: { flexDirection: 'row', gap: spacing.sm },
  residenceOption: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    backgroundColor: colors.white,
  },
  residenceOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  residenceOptionText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  residenceOptionTextSelected: { color: colors.primaryDark },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', marginLeft: 2 },
  inputWrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    backgroundColor: colors.white,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 14, paddingVertical: 12 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelButton: {
    minHeight: 52,
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cancelButtonText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  saveButton: {
    minHeight: 52,
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.65 },
});
