import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSystemBars } from '../../hooks/useSystemBars';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  navigation?: any;
  isDataLoading?: boolean;
}

export default function SplashScreen({
  onFinish,
  navigation,
  isDataLoading = false,
}: SplashScreenProps) {
  useSystemBars(colors.primary, 'light');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [statusText, setStatusText] = useState('Loading Fixly...');
  const [isReadyToComplete, setIsReadyToComplete] = useState(false);
  const minTimeElapsed = useRef(false);
  const completionTriggered = useRef(false);

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 1: Quick initial progress to ~65%
    Animated.timing(progressAnim, {
      toValue: 0.65,
      duration: 800,
      useNativeDriver: false,
    }).start(() => {
      // Stage 2: If data is still loading, crawl slowly towards 88%
      Animated.timing(progressAnim, {
        toValue: 0.88,
        duration: 3500,
        useNativeDriver: false,
      }).start();
    });

    // Minimum display timer (1.2s) for smooth brand impression
    const minTimer = setTimeout(() => {
      minTimeElapsed.current = true;
      setIsReadyToComplete(true);
    }, 1200);

    return () => {
      clearTimeout(minTimer);
    };
  }, []);

  // Update status messages dynamically based on loading state
  useEffect(() => {
    if (isDataLoading) {
      const t = setTimeout(() => {
        setStatusText('Loading your latest Fixly data...');
      }, 700);
      return () => clearTimeout(t);
    }
  }, [isDataLoading]);

  // When data is ready AND minimum time elapsed -> accelerate to 100% and finish
  useEffect(() => {
    if (!isDataLoading && minTimeElapsed.current) {
      triggerFinish();
    }
  }, [isDataLoading, isReadyToComplete]);

  const triggerFinish = () => {
    if (completionTriggered.current) return;
    completionTriggered.current = true;

    setStatusText('Ready!');

    // Smoothly finish to 100%
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        if (onFinish) {
          onFinish();
        } else if (navigation?.replace) {
          navigation.replace('Landing');
        }
      }, 200);
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient with Curved Ambient Arcs */}
      <LinearGradient
        colors={['#FF763B', '#F26522', '#D94E0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={styles.headerDecoArc1} pointerEvents="none" />
        <View style={styles.headerDecoArc2} pointerEvents="none" />
        <View style={styles.headerDecoCircle} pointerEvents="none" />

        {/* Center Brand Identity */}
        <Animated.View
          style={[
            styles.centerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 3D Orange Emblem Badge */}
          <View style={styles.iconCard}>
            <Image
              source={require('../../../assets/fixly-icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>

          {/* Typography */}
          <Text style={styles.brandTitle}>FIXLY</Text>
          <Text style={styles.brandSlogan}>Report, Track, Resolve.</Text>

          {/* Campus Tag with Live Indicator */}
          <View style={styles.campusTag}>
            <View style={styles.liveDot} />
            <Text style={styles.campusTagText}>LPU SMART CAMPUS NETWORK</Text>
          </View>
        </Animated.View>

        {/* Bottom Loading Progress Feature */}
        <View style={styles.bottomLoaderWrap}>
          {/* Progress Track */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>

          {/* Dynamic Status Row */}
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>

          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  gradientBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecoArc1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 42,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerDecoArc2: {
    position: 'absolute',
    top: 60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerDecoCircle: {
    position: 'absolute',
    bottom: -50,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCard: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  logoIcon: {
    width: 60,
    height: 60,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 6,
  },
  brandSlogan: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  campusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  campusTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bottomLoaderWrap: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  progressTrack: {
    width: '100%',
    maxWidth: 240,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '500',
  },
});
