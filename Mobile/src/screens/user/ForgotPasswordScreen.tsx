import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme/colors';
import { RootStackParamList } from '../../types';
import { useSystemBars } from '../../hooks/useSystemBars';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  useSystemBars(colors.primary, 'light');
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScreenHeader
        title="Reset Password"
        eyebrow="ACCOUNT SECURITY"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        bounces={false}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>

          <Text style={styles.title}>Contact your campus administrator</Text>
          <Text style={styles.description}>
            Self-service password reset is temporarily unavailable. To protect your account, please contact
            your campus administrator to verify your identity and reset your password.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Return to Sign In</Text>
            <Ionicons name="log-in-outline" size={20} color={colors.white} />
          </Pressable>
        </View>
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
