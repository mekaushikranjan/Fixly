import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/user/HomeScreen';
import ReportScreen from '../screens/user/ReportScreen';
import UserReportsStack from './UserReportsStack';
import CampusFeedScreen from '../screens/user/CampusFeedScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import { colors } from '../theme/colors';
import { UserTabParamList } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  HomeTabIcon,
  ReportsTabIcon,
  HollowPlusIcon,
  CampusTabIcon,
  ProfileTabIcon,
} from '../components/TabIcons';

const Tab = createBottomTabNavigator<UserTabParamList>();

const INACTIVE = '#9BA3AF';
const ACTIVE = colors.primary;

const ROUTE_LABELS: Record<string, string> = {
  Home: 'Home',
  MyReports: 'Reports',
  CampusFeed: 'Campus Feed',
  Profile: 'Profile',
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
      case 'Home':
        return <HomeTabIcon color={iconColor} size={22} />;
      case 'MyReports':
        return <ReportsTabIcon color={iconColor} size={22} />;
      case 'CampusFeed':
        return <CampusTabIcon color={iconColor} size={22} />;
      case 'Profile':
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

export default function UserTabs() {
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyReports" component={UserReportsStack} options={{ title: 'Reports' }} />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarButton: (props) => (
            <Pressable
              onPress={props.onPress}
              android_ripple={null}
              style={styles.plusBtnWrap}
              accessibilityLabel="Report issue"
            >
              <View style={styles.plusBtnShadow}>
                <View style={styles.plusBtn}>
                  <HollowPlusIcon size={28} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>
            </Pressable>
          ),
        }}
      />
      <Tab.Screen name="CampusFeed" component={CampusFeedScreen} options={{ title: 'Campus Feed' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
  plusBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    transform: [{ translateY: -5 }],
  },
  plusBtnShadow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
