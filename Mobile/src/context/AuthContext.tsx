import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { clearApiCache, mobileApi, MobileAccount, MobileSession } from '../lib/api';
import { signOutGoogle } from '../lib/google';
import {
  registerForPushNotifications,
  subscribeToForegroundMessages,
  subscribeToPushTokenRefresh,
} from '../lib/push';
import { AuthContextType, Role, UserProfile } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = '@fixly_backend_session';

interface AuthProviderProps {
  children: ReactNode;
}

function accountProfile(account: MobileAccount | null): UserProfile {
  if (!account) return {};
  const initials = account.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return {
    name: account.name,
    initials,
    userId: account.id,
    email: account.email,
    avatar: account.avatar,
    role: account.role,
    department: account.department,
    phone: account.phone,
    residenceType: account.residenceType,
    address: account.address,
    city: account.city,
    block: account.building,
    room: account.room,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pushTokenRef = useRef<string | null>(null);
  const role: Role = session?.user.role === 'worker' ? 'worker' : session ? 'user' : null;
  const token = session?.token ?? null;

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      let savedToken: string | null = null;
      try {
        savedToken = await AsyncStorage.getItem(SESSION_KEY);
        if (savedToken) {
          const result = await mobileApi.getMe(savedToken);
          if (mounted && result.user.isActive) {
            setSession({ token: savedToken, user: result.user });
          } else {
            await AsyncStorage.removeItem(SESSION_KEY);
            await clearApiCache(savedToken);
          }
        }
        await Promise.all([
          AsyncStorage.removeItem('@fixly_auth_session'),
          AsyncStorage.removeItem('@fixly_user_profile'),
          AsyncStorage.removeItem('@fixly_worker_profile'),
        ]);
      } catch (error) {
        console.error('Unable to restore Fixly session from the backend:', error);
        await AsyncStorage.removeItem(SESSION_KEY);
        if (savedToken) await clearApiCache(savedToken);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    const register = async (pushToken: string) => {
      try {
        const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
        await mobileApi.registerPushToken(token, pushToken, platform);
        pushTokenRef.current = pushToken;
      } catch (error) {
        console.error('Unable to register this device for Fixly push notifications:', error);
      }
    };
    void registerForPushNotifications()
      .then((pushToken) => {
        if (pushToken && active) return register(pushToken);
        return undefined;
      })
      .catch((error: unknown) => {
        console.warn('Fixly push registration is unavailable:', error instanceof Error ? error.message : error);
      });
    let stopTokenRefresh: () => void = () => {};
    let stopForegroundMessages: () => void = () => {};
    try {
      stopTokenRefresh = subscribeToPushTokenRefresh((pushToken) => {
        if (active) void register(pushToken);
      });
      stopForegroundMessages = subscribeToForegroundMessages((data) => {
        if (!active || session?.user.role !== 'worker') return;
        void mobileApi.getAvailableJobs(token, true).catch((error: unknown) => {
          console.warn('Unable to refresh the worker issue feed after a push notification:', error);
        });
      });
    } catch (error) {
      console.warn('Fixly foreground push listeners are unavailable:', error instanceof Error ? error.message : error);
    }
    return () => {
      active = false;
      stopTokenRefresh();
      stopForegroundMessages();
    };
  }, [session?.user.role, token]);

  const login = async (nextSession: MobileSession): Promise<void> => {
    if (!nextSession.token || !nextSession.user.isActive) {
      throw new Error('The backend returned an invalid or inactive account session.');
    }
    await AsyncStorage.setItem(SESSION_KEY, nextSession.token);
    setSession(nextSession);
  };

  const logout = async (): Promise<void> => {
    const activeToken = session?.token;
    const pushToken = pushTokenRef.current;
    if (activeToken && pushToken) {
      try {
        await mobileApi.unregisterPushToken(activeToken, pushToken);
      } catch (error) {
        console.error('Unable to unregister the Fixly push token:', error);
      }
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    await clearApiCache(activeToken);
    pushTokenRef.current = null;
    setSession(null);
    const signOutFirebase = isFirebaseConfigured()
      ? getFirebaseAuth().signOut()
      : Promise.resolve();
    await Promise.all([signOutFirebase, signOutGoogle()]);
  };

  const updateProfile = async (fields: Partial<UserProfile>): Promise<void> => {
    if (!session) throw new Error('Sign in to update your profile.');
    const { user } = await mobileApi.updateMe(session.token, {
      name: fields.name,
      phone: fields.phone,
      residenceType: fields.residenceType,
      address: fields.address,
      city: fields.city,
      building: fields.block,
      room: fields.room,
    });
    setSession({ ...session, user });
  };

  const updateProfilePhoto = async (photoBase64: string, photoMimeType: string): Promise<void> => {
    if (!session) throw new Error('Sign in to update your profile photo.');
    const { user } = await mobileApi.updateMe(session.token, { photoBase64, photoMimeType });
    setSession({ ...session, user });
  };

  const profile = useMemo(() => accountProfile(session?.user ?? null), [session?.user]);
  const value = useMemo<AuthContextType>(() => ({
    role,
    isAuthed: !!session,
    isLoading,
    token,
    login,
    logout,
    updateProfile,
    updateProfilePhoto,
    profile,
  }), [role, session, isLoading, token, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
