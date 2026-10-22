import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useSystemBars } from '../../hooks/useSystemBars';
import { RootStackParamList } from '../../types';
import { mobileApi } from '../../lib/api';
import { signInWithGoogle } from '../../lib/google';
import { isExpoGo } from '../../lib/runtime';

const THEME = {
  gradientStart: '#FF763B',
  gradientEnd: '#E65100',
  primary: colors.primary, // '#F26522'
  primaryDark: colors.primaryDark, // '#B94E0F'
  cardBg: '#FFFFFF',
  inputBg: '#F3F5F7',
  border: '#E3E7ED',
  textTitle: '#1C2738',
  textSub: '#707E94',
  textPlaceholder: '#9AA6B8',
  googleRed: '#EA4335',
};

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ route, navigation }: LoginScreenProps) {
  // Use orange bar on this screen matching the top curved header
  useSystemBars(THEME.gradientStart, 'light');
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>(route?.params?.initialMode || 'signin');
  const [role, setRole] = useState<'user' | 'worker'>(route?.params?.initialRole || 'user');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isSignIn = mode === 'signin';

  const handleSubmit = async () => {
    if (!isSignIn && !name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address.');
      return;
    }
    if (!password) {
      Alert.alert('Required Field', 'Please enter your password.');
      return;
    }

    if (!isSignIn && role === 'worker') {
      Alert.alert('Worker account required', 'Worker accounts are created by a campus administrator. Please sign in with your assigned account.');
      return;
    }

    setLoading(true);
    try {
      const session = isSignIn
        ? await mobileApi.login(email.trim(), password)
        : await mobileApi.register(name.trim(), email.trim(), password);
      if (session.user.role !== 'user' && session.user.role !== 'worker') {
        throw new Error('This account cannot access the mobile app.');
      }
      if (session.user.role !== role) {
        throw new Error(`This account is registered as a ${session.user.role}. Select the matching role to continue.`);
      }
      await login(session);
    } catch (error) {
      Alert.alert(isSignIn ? 'Sign-in failed' : 'Sign-up failed', error instanceof Error ? error.message : 'Unable to reach Fixly.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const google = await signInWithGoogle();
      if (google.cancelled) return;
      if (google.error || !google.firebaseIdToken) {
        throw new Error(google.error || 'Firebase did not return an ID token.');
      }
      const session = await mobileApi.loginWithGoogle(google.firebaseIdToken);
      if (session.user.role !== 'user' && session.user.role !== 'worker') {
        throw new Error('This Google account does not have a mobile app role.');
      }
      if (session.user.role !== role) {
        throw new Error(`This Google account is registered as a ${session.user.role}. Select the matching role to continue.`);
      }
      await login(session);
    } catch (error) {
      Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Unable to sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email: email.trim() || undefined });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Curved Orange Gradient Banner */}
          <LinearGradient
            colors={[THEME.gradientStart, THEME.gradientEnd]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.headerGradient, { paddingTop: Math.max(insets.top + 16, 44) }]}
          >
            {/* Subtle decorative curved background lines/waves */}
            <View style={styles.curvedDecoLine1} />
            <View style={styles.curvedDecoLine2} />
            <View style={styles.curvedDecoLine3} />
            <View style={styles.curvedDecoCircle} />

            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{isSignIn ? 'Sign In' : 'Sign Up'}</Text>
            </View>
          </LinearGradient>

          {/* Main White Sheet Card */}
          <View style={styles.sheetCard}>
            {/* Fixly Brand Logo */}
            <View style={styles.brandLogoWrap}>
              <Image
                source={require('../../../assets/fixly-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>

            {/* Role Switcher Pill */}
            <View style={styles.roleContainer}>
              <View style={styles.roleSwitch}>
                <Pressable
                  style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
                  onPress={() => setRole('user')}
                  android_ripple={null}
                >
                  <Ionicons
                    name="person"
                    size={14}
                    color={role === 'user' ? THEME.primary : THEME.textSub}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.roleLabel, role === 'user' && styles.roleLabelActive]}>
                    User
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.roleBtn, role === 'worker' && styles.roleBtnActive]}
                  onPress={() => setRole('worker')}
                  android_ripple={null}
                >
                  <Ionicons
                    name="construct"
                    size={14}
                    color={role === 'worker' ? THEME.primary : THEME.textSub}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.roleLabel, role === 'worker' && styles.roleLabelActive]}>
                    Worker
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.welcomeTitle}>
              {isSignIn ? 'Welcome Back!' : 'Create Account'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {isSignIn
                ? 'To keep connected with us please login with your personal info'
                : 'To keep connected with us please register with your personal info'}
            </Text>

            {/* Form Fields */}
            <View style={styles.form}>
              {/* Full Name (Sign Up only) */}
              {!isSignIn && (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={THEME.textPlaceholder}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* Email Address */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Adress"
                  placeholderTextColor={THEME.textPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password */}
              <View style={[styles.inputWrapper, styles.passwordWrapper]}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor={THEME.textPlaceholder}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={12}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={THEME.textSub}
                  />
                </Pressable>
              </View>

              {/* Remember me & Forgot Password */}
              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberMeWrap}
                  onPress={() => setRememberMe((prev) => !prev)}
                  hitSlop={6}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.rememberText}>Remember me?</Text>
                </Pressable>

                {isSignIn && (
                  <Pressable onPress={handleForgotPassword} hitSlop={6}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </Pressable>
                )}
              </View>

              {/* Primary Sign In / Sign Up Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading || googleLoading}
                style={styles.submitBtnPressable}
              >
                <LinearGradient
                  colors={[THEME.gradientStart, THEME.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>{isSignIn ? 'Sign In' : 'Sign Up'}</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {!isExpoGo ? (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    style={styles.socialBtn}
                    onPress={handleGoogleAuth}
                    disabled={loading || googleLoading}
                  >
                    {googleLoading ? (
                      <ActivityIndicator color={THEME.googleRed} size="small" />
                    ) : (
                      <>
                        <View style={styles.socialIconBox}>
                          <Ionicons name="logo-google" size={20} color={THEME.googleRed} />
                        </View>
                        <Text style={styles.socialBtnText}>
                          {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              ) : (
                <Text style={styles.expoGoNote}>
                  Google sign-in and push notifications require an installed Fixly build. Email sign-in works in Expo Go.
                </Text>
              )}

              {/* Bottom Mode Switch */}
              <View style={styles.footerRow}>
                <Text style={styles.footerSubText}>
                  {isSignIn ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <Pressable
                  onPress={() => setMode(isSignIn ? 'signup' : 'signin')}
                  hitSlop={8}
                >
                  <Text style={styles.footerLinkText}>
                    {isSignIn ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },

  // Curved Orange Top Header
  headerGradient: {
    paddingHorizontal: 26,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'flex-start',
  },
  headerTitleRow: {
    marginTop: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Decorative wavy lines & shapes
  curvedDecoLine1: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    top: -190,
    right: -130,
  },
  curvedDecoLine2: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    top: -150,
    right: -110,
  },
  curvedDecoLine3: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    top: -110,
    right: -90,
  },
  curvedDecoCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -40,
    left: -40,
  },

  // White Card Sheet
  sheetCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },

  brandLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandLogo: {
    width: 140,
    height: 46,
  },

  // Role Switcher
  roleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F1F4F8',
    borderRadius: 20,
    padding: 3,
    width: '100%',
    maxWidth: 240,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 17,
  },
  roleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  roleLabel: {
    fontSize: 12,
    color: THEME.textSub,
    fontWeight: '600',
  },
  roleLabelActive: {
    color: THEME.primary,
  },

  // Welcome Texts
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.textTitle,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 12.5,
    color: THEME.textSub,
    lineHeight: 18,
    marginBottom: 20,
  },

  // Form Fields
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: THEME.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    fontSize: 14,
    color: THEME.textTitle,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Remember me & Forgot Password
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 22,
  },
  rememberMeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  rememberText: {
    fontSize: 12,
    color: THEME.textSub,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.primary,
  },

  // Primary Action Button
  submitBtnPressable: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  submitBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8ECF1',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },

  // Social Buttons
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  socialIconBox: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
  },
  expoGoNote: {
    marginTop: 2,
    paddingHorizontal: 10,
    color: THEME.textSub,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Footer Row
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingBottom: 10,
  },
  footerSubText: {
    fontSize: 12.5,
    color: THEME.textSub,
  },
  footerLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.primary,
  },
});
