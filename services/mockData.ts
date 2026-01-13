import { User, UserRole, Reward, PrizeConfig, ActivityLog } from '../types';

// --- Mock Users ---
export const MOCK_USERS: Record<string, User> = {
  customer: {
    id: 'c1',
    publicId: 'OS-8X29',
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    role: UserRole.CUSTOMER,
    avatarUrl: 'https://picsum.photos/seed/alex/100/100',
    points: 350,
    spins: 2,
    joinedDate: 'Oct 2023'
  },
  customer2: {
    id: 'c2',
    publicId: 'OS-331B',
    name: 'Sarah Connor',
    email: 'sarah.c@example.com',
    role: UserRole.CUSTOMER,
    avatarUrl: 'https://picsum.photos/seed/sarah/100/100',
    points: 120,
    spins: 0,
    joinedDate: 'Nov 2023'
  },
  staff: {
    id: 's1',
    publicId: 'ST-001',
    name: 'David Chen',
    email: 'staff@oceansumria.com',
    role: UserRole.STAFF,
    avatarUrl: 'https://picsum.photos/seed/david/100/100'
  },
  admin: {
    id: 'a1',
    publicId: 'AD-001',
    name: 'Sarah Owner',
    email: 'admin@oceansumria.com',
    role: UserRole.ADMIN,
    avatarUrl: 'https://picsum.photos/seed/sarah/100/100'
  }
};

// --- Mock Rewards (Customer Wallet) - Empty by default, rewards come from database ---
export const MOCK_REWARDS: Reward[] = [];

// --- Prize Configuration (matches database prizes) ---
// NOTE: These should eventually be loaded from the database
export const MOCK_PRIZES: PrizeConfig[] = [
  { id: 'p1', name: '10% Off', weight: 50, totalAvailable: 'unlimited', winLimit: 'None', active: true, icon: 'local_offer', color: '#3b82f6' },
  { id: 'p2', name: 'Free Appetizer', weight: 25, totalAvailable: 'unlimited', winLimit: 'None', active: true, icon: 'restaurant', color: '#10b981' },
  { id: 'p3', name: 'Free Entree', weight: 10, totalAvailable: 100, winLimit: '1/user', active: true, icon: 'dinner_dining', color: '#f59e0b' },
  { id: 'p4', name: 'BOGO', weight: 5, totalAvailable: 50, winLimit: '1/user', active: true, icon: 'celebration', color: '#8b5cf6' },
  { id: 'p5', name: '50 Points', weight: 15, totalAvailable: 'unlimited', winLimit: 'None', active: true, icon: 'stars', color: '#f2a60d' },
  { id: 'p6', name: 'Try Again', weight: 30, totalAvailable: 'unlimited', winLimit: 'None', active: true, icon: 'refresh', color: '#64748b' }
];

// --- Mock Activity Logs ---
export const MOCK_LOGS: ActivityLog[] = [
  {
    id: 'l1',
    timestamp: '2023-10-24 10:42 AM',
    userId: 'c1',
    publicId: 'OS-8X29',
    userName: 'Alex Johnson',
    userAvatar: 'https://picsum.photos/seed/alex/50/50',
    action: 'SPIN',
    details: 'Won Free Drink',
    probabilityTier: 'Tier 3'
  },
  {
    id: 'l2',
    timestamp: '2023-10-24 09:15 AM',
    userId: 'c2',
    publicId: 'OS-331B',
    userName: 'Sarah Connor',
    userAvatar: 'https://picsum.photos/seed/alice/50/50',
    action: 'REDEMPTION',
    details: 'Redeemed 10% Off',
  },
  {
    id: 'l3',
    timestamp: '2023-10-23 04:30 PM',
    userId: 's1',
    userName: 'David Chen',
    userAvatar: 'https://picsum.photos/seed/david/50/50',
    action: 'EARN_POINTS',
    details: 'Earned 105 Points ($105.00 Bill)',
  },
  {
    id: 'l4',
    timestamp: '2023-10-23 05:00 PM',
    userId: 'c1',
    publicId: 'OS-8X29',
    userName: 'Alex Johnson',
    userAvatar: 'https://picsum.photos/seed/alex/50/50',
    action: 'CONVERT_POINTS',
    details: 'Converted 200 pts to 2 Spins',
  }
];