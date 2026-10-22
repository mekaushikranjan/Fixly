import { Alert, Linking, Share } from 'react-native';

export type SupportRequestKind = 'bug' | 'feedback';

export async function shareSupportRequest(kind: SupportRequestKind, role: 'campus member' | 'worker'): Promise<void> {
  const title = kind === 'bug' ? 'Fixly bug report' : 'Fixly feedback';
  const prompt = kind === 'bug'
    ? 'Describe the problem, what you expected, and the steps to reproduce it.'
    : 'Share your suggestion or feedback about Fixly.';

  try {
    await Share.share({
      title,
      message: `${title}\n\n${prompt}\n\nAccount type: ${role}`,
    });
  } catch (error) {
    Alert.alert(
      'Unable to open sharing',
      error instanceof Error ? error.message : 'Please try again.',
    );
  }
}

export async function openDeviceSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (error) {
    Alert.alert(
      'Unable to open settings',
      error instanceof Error ? error.message : 'Open Fixly from your device settings.',
    );
  }
}

export function showPolicyInformation(policy: 'privacy' | 'terms'): void {
  Alert.alert(
    policy === 'privacy' ? 'Privacy policy' : 'Terms of use',
    policy === 'privacy'
      ? 'Fixly uses your account and report details to manage campus maintenance requests. Push notifications can be controlled in device settings. For the full campus privacy and data-retention policy, contact your campus administrator.'
      : 'Use Fixly to report genuine campus maintenance issues and provide accurate information. Do not submit passwords or other sensitive information in reports. For the official campus terms of use, contact your campus administrator.',
    [{ text: 'OK' }],
  );
}
