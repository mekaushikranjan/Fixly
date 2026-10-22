import Constants, { AppOwnership } from 'expo-constants';

export const isExpoGo = Constants.appOwnership === AppOwnership.Expo;
