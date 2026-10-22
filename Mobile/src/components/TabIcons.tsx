import React from 'react';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TabIconProps {
  color: string;
  size?: number;
}

export const HomeTabIcon: React.FC<TabIconProps> = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
    <Path
      d="M3.5 11 L13 3.5 L22.5 11 V21.5 C22.5 22.3 21.8 23 21 23 H5 C4.2 23 3.5 22.3 3.5 21.5 Z"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 18 H16"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);

export const ReportsTabIcon: React.FC<TabIconProps> = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
    <Rect
      x="3.5"
      y="3.5"
      width="19"
      height="19"
      rx="4.5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
    <Line
      x1="9.5"
      y1="3.5"
      x2="9.5"
      y2="22.5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);

export const HollowPlusIcon: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({
  size = 30,
  color = '#FFFFFF',
  strokeWidth = 2.4,
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Path
      d="M12.5 5.5 H19.5 V12.5 H26.5 V19.5 H19.5 V26.5 H12.5 V19.5 H5.5 V12.5 H12.5 Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CampusTabIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <Ionicons name="newspaper-outline" size={size} color={color} />
);

export const ProfileTabIcon: React.FC<TabIconProps> = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
    <Circle
      cx="13"
      cy="7.5"
      r="4.5"
      stroke={color}
      strokeWidth={2.2}
    />
    <Path
      d="M4.5 22.5 C4.5 17.5 8.5 15 13 15 C17.5 15 21.5 17.5 21.5 22.5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);

export const JobsTabIcon: React.FC<TabIconProps> = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
    <Rect
      x="3.5"
      y="8.5"
      width="19"
      height="13.5"
      rx="3.5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
    <Path
      d="M9.5 8.5 V5.5 C9.5 4.4 10.4 3.5 11.5 3.5 H14.5 C15.6 3.5 16.5 4.4 16.5 5.5 V8.5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="3.5"
      y1="14"
      x2="22.5"
      y2="14"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
    <Rect
      x="11.5"
      y="12.5"
      width="3"
      height="3"
      rx="0.8"
      fill={color}
    />
  </Svg>
);

export const ActiveTaskTabIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <Ionicons name="construct-outline" size={size} color={color} />
);

export const ShiftTabIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <Ionicons name="calendar-outline" size={size} color={color} />
);

export const PerformanceTabIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <Ionicons name="stats-chart-outline" size={size} color={color} />
);
