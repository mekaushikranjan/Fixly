import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme/colors';
import { RootStackParamList } from '../../types';
import { mobileApi } from '../../lib/api';
import { useSystemBars } from '../../hooks/useSystemBars';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();

  const initialEmail = route.params?.email || '';
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  const handleRequestCode = async () => {
    setErrorMessage(null);
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      setErrorMessage('Please enter your Fixly account email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await mobileApi.forgotPassword(cleanedEmail);
      if (response.code) {
        setDemoCodeHint(response.code);
        setCode(response.code); // auto-fill convenient for testing
      }
      setStep('verify');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to request password reset code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage(null);
    const cleanedCode = code.trim();

    if (!cleanedCode) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (cleanedCode.length < 4) {
      setErrorMessage('Verification code is incomplete.');
      return;
    }

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await mobileApi.resetPassword(email.trim().toLowerCase(), cleanedCode, newPassword);
      setStep('success');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to reset password. Please check your code and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await mobileApi.forgotPassword(email.trim().toLowerCase());
      if (response.code) {
        setDemoCodeHint(response.code);
        setCode(response.code);
      }
      Alert.alert('Code Resent', 'A fresh verification code has been generated.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not resend code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScreenHeader
        title={step === 'success' ? 'Password Reset' : 'Reset Password'}
        eyebrow="ACCOUNT SECURITY"
        showBack={step !== 'success'}
        onBack={() => {
          if (step === 'verify') {
            setStep('request');
            setErrorMessage(null);
          } else {
            navigation.goBack();
          }
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {step === 'request' && (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="key" size={32} color={colors.primary} />
            </View>

            <Text style={styles.stepTitle}>Forgot your password?</Text>
            <Text style={styles.stepDescription}>
              Enter your email address and we'll send a 6-digit verification code to reset your password.
            </Text>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#707E94" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. yourname@gmail.com"
                  placeholderTextColor="#9AA6B8"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {email.length > 0 && !isLoading && (
                  <Pressable onPress={() => setEmail('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#9AA6B8" />
                  </Pressable>
                )}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.btnPressed,
                isLoading && styles.btnDisabled,
              ]}
              onPress={handleRequestCode}
              disabled={isLoading}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.backToLoginBtn}
              onPress={() => navigation.goBack()}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.backToLoginText}>Remember your password? Sign In</Text>
            </Pressable>
          </View>
        )}

        {step === 'verify' && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="shield-checkmark" size={32} color="#4F46E5" />
            </View>

            <Text style={styles.stepTitle}>Enter Verification Code</Text>
            <Text style={styles.stepDescription}>
              We sent a 6-digit code to{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{email}</Text>.
            </Text>

            {demoCodeHint && (
              <View style={styles.demoCodeBox}>
                <Ionicons name="sparkles" size={16} color="#0D9488" />
                <Text style={styles.demoCodeText}>
                  Verification Code: <Text style={styles.demoCodeHighlight}>{demoCodeHint}</Text>
                </Text>
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Code Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>6-DIGIT VERIFICATION CODE</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="keypad-outline" size={20} color="#707E94" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="123456"
                  placeholderTextColor="#9AA6B8"
                  value={code}
                  onChangeText={(val) => {
                    setCode(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* New Password Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#707E94" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9AA6B8"
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#707E94"
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm New Password Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#707E94" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-type new password"
                  placeholderTextColor="#9AA6B8"
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={8}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#707E94"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.btnPressed,
                isLoading && styles.btnDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Reset Password</Text>
                  <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                </>
              )}
            </Pressable>

            <View style={styles.verifyFooter}>
              <Pressable
                onPress={handleResend}
                disabled={isLoading}
                hitSlop={8}
                style={styles.resendBtn}
              >
                <Text style={styles.resendText}>Didn't receive code? Resend</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setStep('request');
                  setErrorMessage(null);
                }}
                disabled={isLoading}
                hitSlop={8}
                style={styles.changeEmailBtn}
              >
                <Text style={styles.changeEmailText}>Change Email Address</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark" size={36} color="#16A34A" />
            </View>

            <Text style={styles.stepTitle}>Password Reset Successfully!</Text>
            <Text style={styles.stepDescription}>
              Your account password has been updated. You can now use your new credentials to log into Fixly.
            </Text>

            <View style={styles.successTipBox}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={styles.successTipText}>
                Remember to keep your password secure and not share it with anyone.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Return to Sign In</Text>
              <Ionicons name="log-in-outline" size={20} color={colors.white} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    width: '100%',
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
  demoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    width: '100%',
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  demoCodeText: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '600',
  },
  demoCodeHighlight: {
    fontWeight: '800',
    color: '#115E59',
    letterSpacing: 1.5,
  },
  fieldGroup: {
    width: '100%',
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: '100%',
  },
  codeInput: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    width: '100%',
    gap: 8,
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: 6,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  verifyFooter: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  resendBtn: {
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  changeEmailBtn: {
    paddingVertical: 4,
  },
  changeEmailText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  successTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    width: '100%',
    marginBottom: spacing.lg,
  },
  successTipText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
});
