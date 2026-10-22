export type Role = 'user' | 'worker' | null;

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface Building {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

export interface IssuePhotoPreset {
  id: string;
  title: string;
  category: string;
  url: string;
}

export interface WorkerInfo {
  name: string;
  initials: string;
  rating?: number;
  jobsCompleted?: number;
  role?: string;
  phone?: string;
  avatar?: string;
}

export interface TimelineStep {
  id: string;
  step: string;
  label: string;
  time: string;
  desc: string;
  done: boolean;
  current?: boolean;
}

export interface FeedbackData {
  rating: number;
  tags: string[];
  comment: string;
  submittedAt: string;
}

export type ReportStatus = 'assigned' | 'queued' | 'resolved' | 'pending' | 'in_progress' | 'escalated';

export interface ReportItem {
  id: string;
  ticketId: string;
  title: string;
  building: string;
  floor: string;
  room: string;
  category: string;
  status: ReportStatus;
  priority?: string;
  description?: string;
  reportedAt?: string;
  resolvedAt?: string;
  eta?: number;
  distance?: string;
  queuePosition?: number;
  worker?: WorkerInfo | null;
  beforeImage?: string | null;
  afterImage?: string | null;
  feedback?: FeedbackData | null;
  timeline?: TimelineStep[];
  rating?: number;
}

export interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  tone: 'primary' | 'neutral';
  time: string;
  read: boolean;
  type: string;
}

export interface WorkerJobItem {
  id: string;
  ticketId?: string;
  title: string;
  floor: string;
  room: string;
  distance: string;
  photo: boolean;
  status: string;
  category?: string;
  priority?: 'Critical' | 'High' | 'Normal';
  priorityColor?: string;
  description?: string;
  reportedBy?: string;
  reportedAt?: string;
  slaTime?: string;
  toolsNeeded?: string[];
  photoUrl?: string;
  building?: string;
}

export interface UserProfile {
  name?: string;
  initials?: string;
  userId?: string;
  regNo?: string;
  email?: string;
  phone?: string;
  residenceType?: 'hostel' | 'day_scholar';
  address?: string;
  city?: string;
  sub?: string;
  block?: string;
  room?: string;
  emergencyContact?: string;
  role?: string;
  avatar?: string;
  department?: string;
  rating?: number;
  jobsCompleted?: number;
  [key: string]: any;
}

export interface AuthContextType {
  role: Role;
  isAuthed: boolean;
  isLoading: boolean;
  token: string | null;
  login: (session: import('../lib/api').MobileSession) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedFields: Partial<UserProfile>) => Promise<void>;
  profile: UserProfile;
}

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: { initialMode?: 'signin' | 'signup'; initialRole?: 'user' | 'worker' } | undefined;
  UserApp: undefined;
  WorkerApp: undefined;
  Notifications: undefined;
  ProfileDetails: undefined;
  WorkerProfileDetails: undefined;
  Tracking: { reportId?: string } | undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
  BugReport: undefined;
  Feedback: undefined;
  ForgotPassword: { email?: string } | undefined;
};

export type UserTabParamList = {
  Home: undefined;
  MyReports: undefined;
  Report: { categoryId?: string; category?: string } | undefined;
  CampusFeed: undefined;
  Profile: undefined;
};

export type WorkerTabParamList = {
  Jobs: undefined;
  ActiveTask: undefined;
  Shift: undefined;
  Performance: undefined;
  WorkerProfile: undefined;
};

export type UserReportsStackParamList = {
  MyReportsList: undefined;
  Tracking: { reportId?: string } | undefined;
};

export type WorkerJobsStackParamList = {
  JobFeedList: undefined;
  JobDetail: { jobId?: string; title: string };
};
