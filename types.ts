export enum UserRole {
  UNKNOWN = 'UNKNOWN', // For initial loading state
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}

export const normalizeRole = (role: string | null | undefined): UserRole => {
  if (!role) return UserRole.CUSTOMER; // Default fallback for DB defaults
  const normalized = role.toUpperCase().trim();
  if (normalized === 'STAFF') return UserRole.STAFF;
  if (normalized === 'ADMIN') return UserRole.ADMIN;
  if (normalized === 'CUSTOMER') return UserRole.CUSTOMER;
  return UserRole.CUSTOMER; // Safe default
};

export interface User {
  id: string;
  publicId: string; // Unique 6-char ID for staff lookup (e.g., "OS-9921")
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  points?: number; // Customer only
  spins?: number; // Customer only
  joinedDate?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  expiryDate: string;
  isUsed: boolean;
  type: 'DISCOUNT' | 'FREE_ITEM' | 'BOGO';
  code: string; // The QR code content
  imageUrl: string;
  isNew?: boolean; // To highlight newly won rewards
}

export interface PrizeConfig {
  id: string;
  name: string;
  weight: number; // Actual probability weight (used for real spin)
  displayWeight: number; // Display probability weight (shown to users)
  totalAvailable: number | 'unlimited';
  winLimit: string;
  active: boolean;
  icon: string;
  color?: string; // For the wheel segment
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  publicId?: string; // To show in logs
  userName: string;
  userAvatar: string;
  action: 'SPIN' | 'REDEMPTION' | 'GRANT' | 'EARN_POINTS' | 'CONVERT_POINTS';
  details: string; // "Won 10% Off" or "Granted 3 spins"
  probabilityTier?: string;
}

export interface SpinResult {
  ok: boolean;
  prize?: PrizeConfig;
  reward?: Reward;
  error?: string;
  outcome?: 'WIN' | 'NO_WIN';
}

export interface AppState {
  currentUser: User | null;
  activeRole: UserRole;
  users: Record<string, User>; // Global registry of users
  rewards: Reward[];
  logs: ActivityLog[];
  prizes: PrizeConfig[];
  lastCreatedRewardId: string | null;
}