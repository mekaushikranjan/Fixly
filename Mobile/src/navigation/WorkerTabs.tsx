import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WorkerJobsStack from './WorkerJobsStack';
import ActiveTaskScreen from '../screens/worker/ActiveTaskScreen';
import WorkerShiftScreen from '../screens/worker/WorkerShiftScreen';
import WorkerPerformanceScreen from '../screens/worker/WorkerPerformanceScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';
import { colors } from '../theme/colors';
import { WorkerTabParamList } from '../types';
import {
  JobsTabIcon,
  ActiveTaskTabIcon,
  ShiftTabIcon,
  PerformanceTabIcon,
  ProfileTabIcon,
} from '../components/TabIcons';

const Tab = createBottomTabNavigator<WorkerTabParamList>();

const INACTIVE = '#9BA3AF';
const ACTIVE = colors.primary;

const ROUTE_LABELS: Record<string, string> = {
  Jobs: 'Jobs',
  ActiveTask: 'Active',
  Shift: 'Shift',
  Performance: 'Stats',
  WorkerProfile: 'Profile',
};

function TabIcon({
  route,
  focused,
  fontSize,
  highlightWidth,
}: {
  route: string;
  focused: boolean;
  fontSize: number;
  highlightWidth: number;
}) {
  const iconColor = focused ? '#FFFFFF' : INACTIVE;
  const label = ROUTE_LABELS[route] ?? route;

  const renderIcon = () => {
    switch (route) {
      case 'Jobs':
        return <JobsTabIcon color={iconColor} size={22} />;
      case 'ActiveTask':
        return <ActiveTaskTabIcon color={iconColor} size={22} />;
      case 'Shift':
        return <ShiftTabIcon color={iconColor} size={22} />;
      case 'Performance':
        return <PerformanceTabIcon color={iconColor} size={22} />;
      case 'WorkerProfile':
        return <ProfileTabIcon color={iconColor} size={22} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.tabItem, { width: highlightWidth }, focused && styles.tabItemActive]}>
      {renderIcon()}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={[styles.tabLabel, focused && styles.tabLabelActive, { fontSize }]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function WorkerTabs() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive calculations based on device width
  const isSmallDevice = screenWidth < 380;
  const isMediumDevice = screenWidth >= 380 && screenWidth < 415;

  const tabFontSize = isSmallDevice ? 10 : isMediumDevice ? 10.5 : 11.5;
  const sideMargin = isSmallDevice ? 10 : isMediumDevice ? 12 : 14;
  const tabHighlightWidth = Math.max(40, Math.min(64, (screenWidth - sideMargin * 2 - 8) / 5 - 8));
  const barHeight = isSmallDevice ? 62 : 66;

  const bottomOffset = Platform.OS === 'ios'
    ? (insets.bottom > 0 ? Math.max(insets.bottom - 8, 0) : 8)
    : (insets.bottom > 0 ? insets.bottom + 4 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        safeAreaInsets: { bottom: 0, top: 0, left: 0, right: 0 },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: bottomOffset,
            left: sideMargin,
            right: sideMargin,
            start: sideMargin,
            end: sideMargin,
            height: barHeight,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIconStyle,
        tabBarButton: ({ ref, ...rest }: any) => (
          <Pressable {...rest} android_ripple={null} style={rest.style} />
        ),
        tabBarIcon: ({ focused }) => (
          <TabIcon
            route={route.name}
            focused={focused}
            fontSize={tabFontSize}
            highlightWidth={tabHighlightWidth}
          />
        ),
      })}
    >
      <Tab.Screen name="Jobs" component={WorkerJobsStack} />
      <Tab.Screen
        name="ActiveTask"
        component={ActiveTaskScreen}
        options={{ title: 'Active Task' }}
      />
      <Tab.Screen
        name="Shift"
        component={WorkerShiftScreen}
        options={{ title: 'Shift Schedule' }}
      />
      <Tab.Screen
        name="Performance"
        component={WorkerPerformanceScreen}
        options={{ title: 'Performance' }}
      />
      <Tab.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F2F4',
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#182230',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  tabBarItem: {
    height: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    marginVertical: 0,
  },
  tabBarIconStyle: {
    marginBottom: 0,
    marginTop: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 16,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: ACTIVE,
  },
  tabLabel: {
    width: '100%',
    fontWeight: '500',
    color: INACTIVE,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
