import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { useSystemBars } from '../../hooks/useSystemBars';
import { RootStackParamList } from '../../types';

type LandingScreenProps = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export default function LandingScreen({ navigation }: LandingScreenProps) {
  useSystemBars('#FF6B2B', 'light');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isSmallDevice = width < 380;

  return (
    <View style={styles.container}>
      {/* Dynamic Warm Gradient Hero Header */}
      <LinearGradient
        colors={['#FF763B', '#F2601D', '#CF4005']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[
          styles.topBackground,
          { paddingTop: Math.max(insets.top + 16, 44), paddingBottom: 40 },
        ]}
      >
        {/* Ambient Decorative Backdrop Rings */}
        <View style={styles.ambientGlow} />
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />
        <View style={styles.decoCircle3} />

        {/* Institutional Campus Pill */}
        <View style={styles.topStatusRow}>
          <View style={styles.campusPill}>
            <View style={styles.campusLiveDot} />
            <Text style={styles.campusPillText}>LPU SMART CAMPUS</Text>
          </View>
        </View>

        {/* Master Unified Brand Showcase Card */}
        <View style={[styles.showcaseCard, isSmallDevice && { width: '92%', paddingVertical: 14 }]}>
          {/* Top Emblem Icon Badge */}
          <View style={styles.iconEmblem}>
            <Image
              source={require('../../../assets/fixly-icon.png')}
              style={styles.emblemImg}
              resizeMode="contain"
            />
          </View>

          {/* Integrated Fixly Wordmark Logo */}
          <Image
            source={require('../../../assets/fixly-wordmark.png')}
            style={styles.wordmarkImg}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* Main Curved White Content Sheet */}
      <View style={[styles.bottomContent, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        <View style={styles.summaryBox}>
          <Text style={styles.mainHeading}>Campus issues, solved fast.</Text>
          <Text style={styles.subHeading}>
            Snap a photo, dispatch campus technicians, and track resolution in real-time.
          </Text>

          {/* Modern Interactive Feature Chips */}
          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <View style={styles.pillIconWrap}>
                <Ionicons name="flash" size={13} color={colors.primary} />
              </View>
              <Text style={styles.pillText}>Quick Report</Text>
            </View>

            <View style={styles.pill}>
              <View style={styles.pillIconWrap}>
                <Ionicons name="navigate" size={13} color={colors.primary} />
              </View>
              <Text style={styles.pillText}>Live Tracking</Text>
            </View>

            <View style={styles.pill}>
              <View style={styles.pillIconWrap}>
                <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
              </View>
              <Text style={styles.pillText}>Fast SLA</Text>
            </View>
          </View>
        </View>

        {/* Primary & Secondary Call-to-Actions */}
        <View style={styles.actionContainer}>
          <Pressable
            style={styles.primaryBtnPressable}
            onPress={() => navigation.navigate('Login', { initialMode: 'signup' })}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <LinearGradient
              colors={['#FF763B', '#E54600']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login', { initialMode: 'signin' })}
            android_ripple={{ color: '#E2E8F0' }}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </Pressable>

          <View style={styles.footnoteRow}>
            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
            <Text style={styles.campusFootnote}>
              Official LPU Campus Maintenance & Facilities
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBackground: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  ambientGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: '20%',
  },
  decoCircle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    top: -60,
    right: -80,
  },
  decoCircle2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -30,
    left: -60,
  },
  decoCircle3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 60,
    left: -20,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  campusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  campusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  campusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  showcaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '88%',
    maxWidth: 320,
    shadowColor: '#7A1F00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  iconEmblem: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFF4EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#FFE2D1',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  emblemImg: {
    width: 44,
    height: 44,
  },
  wordmarkImg: {
    width: '100%',
    height: 66,
  },
  bottomContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    paddingHorizontal: 26,
    paddingTop: 28,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 8,
  },
  summaryBox: {
    alignItems: 'center',
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subHeading: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'nowrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
    borderWidth: 1,
    borderColor: '#F0EFEA',
  },
  pillIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtnPressable: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  secondaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  campusFootnote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
});
