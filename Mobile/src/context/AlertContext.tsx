import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import {
  CustomAlertModal,
  AlertButton,
} from '../components/CustomAlertModal';
import Ionicons from '@expo/vector-icons/Ionicons';

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  iconName?: keyof typeof Ionicons.glyphMap;
  iconType?: 'info' | 'success' | 'warning' | 'danger' | 'break';
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

let globalAlertListener: ((config: AlertConfig) => void) | null = null;

// Store original React Native Alert.alert
const originalAlert = Alert.alert;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setAlertConfig(null);
    }, 200);
  }, []);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  }, []);

  useEffect(() => {
    // Register global listener for intercepted calls
    globalAlertListener = (config: AlertConfig) => {
      showAlert(config);
    };

    // Override Alert.alert with our custom styled modal
    Alert.alert = (
      title: string,
      message?: string,
      buttons?: Array<{
        text?: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
      }>,
      _options?: any
    ) => {
      if (globalAlertListener) {
        const mappedButtons: AlertButton[] | undefined = buttons?.map((b) => ({
          text: b.text || 'OK',
          onPress: b.onPress,
          style: b.style,
        }));
        globalAlertListener({
          title,
          message,
          buttons: mappedButtons,
        });
      } else {
        originalAlert(title, message, buttons, _options);
      }
    };

    return () => {
      globalAlertListener = null;
      Alert.alert = originalAlert;
    };
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertConfig ? (
        <CustomAlertModal
          visible={visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          iconName={alertConfig.iconName}
          iconType={alertConfig.iconType}
          onDismiss={hideAlert}
        />
      ) : null}
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextType {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return ctx;
}
