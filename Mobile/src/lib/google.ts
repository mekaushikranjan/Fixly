import { Platform } from 'react-native';
import { GoogleAuthProvider, getIdToken, signInWithCredential } from 'firebase/auth';
import { assertFirebaseConfigured, getFirebaseAuth } from './firebase';
import { isExpoGo } from './runtime';

let configured = false;

function isConfiguredClientId(value: string | undefined): value is string {
  return Boolean(value?.trim() && !/your|placeholder|replace-with/i.test(value));
}

export const configureGoogleSignIn = async () => {
  if (isExpoGo) {
    throw new Error('Google sign-in requires an installed development or release build. Use email and password in Expo Go.');
  }
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!isConfiguredClientId(webClientId)) {
    throw new Error('Set a real EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in the mobile environment.');
  }
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (Platform.OS === 'ios' && !isConfiguredClientId(iosClientId)) {
    throw new Error('Set a real EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in the mobile environment.');
  }
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({
    webClientId,
    iosClientId: isConfiguredClientId(iosClientId) ? iosClientId : undefined,
    scopes: ['profile', 'email'],
    offlineAccess: false,
  });
  configured = true;
};

export const signInWithGoogle = async (): Promise<{ firebaseIdToken?: string; error?: string; cancelled?: boolean }> => {
  let statusCodes: typeof import('@react-native-google-signin/google-signin').statusCodes | undefined;
  try {
    if (isExpoGo) {
      return { error: 'Google sign-in requires an installed development or release build. Use email and password in Expo Go.' };
    }
    assertFirebaseConfigured();
    if (!configured) {
      await configureGoogleSignIn();
    }

    const googleSignInModule = await import('@react-native-google-signin/google-signin');
    statusCodes = googleSignInModule.statusCodes;
    const { GoogleSignin } = googleSignInModule;
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const data = await GoogleSignin.signIn();
    if (data.type !== 'success') return { cancelled: true };
    const googleIdToken = data.data.idToken;
    if (!googleIdToken) {
      return { error: 'No Google ID token was returned. Check the configured OAuth client IDs.' };
    }
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const firebaseResult = await signInWithCredential(getFirebaseAuth(), credential);
    return { firebaseIdToken: await getIdToken(firebaseResult.user, true) };
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
    if (code === statusCodes?.SIGN_IN_CANCELLED) {
      return { cancelled: true };
    }
    if (code === statusCodes?.IN_PROGRESS) {
      return { cancelled: true };
    }
    if (code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
      return { error: 'Google Play Services is not available' };
    }
    return { error: error instanceof Error ? error.message : 'Google sign-in failed' };
  }
};

export const signOutGoogle = async (): Promise<void> => {
  if (configured && !isExpoGo) {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    await GoogleSignin.signOut();
  }
};
