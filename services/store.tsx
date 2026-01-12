import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, Reward, PrizeConfig, ActivityLog, AppState, UserRole, SpinResult } from '../types';
import { MOCK_REWARDS, MOCK_PRIZES, MOCK_LOGS } from './mockData';
import { supabase } from './supabase';
import { api } from './api';

// --- Types & Actions ---
type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_USER_POINTS'; payload: { points: number; spins: number } }
  | { type: 'ADD_LOG'; payload: ActivityLog }
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'MARK_REWARD_USED'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_NEW_REWARD_FLAG' }
  | { type: 'SET_LOGS'; payload: ActivityLog[] };

interface AppContextType {
  state: AppState & { isLoading: boolean };
  actions: {
    logout: () => Promise<void>;
    grantSpinsByPublicId: (staffId: string, publicId: string, billAmount: number) => Promise<{ success: boolean; message: string }>;
    earnPoints: (staffId: string, publicId: string, billAmount: number) => Promise<{ success: boolean; message: string }>;
    convertPointsToSpins: (customerId: string, spinsToBuy: number) => Promise<{ success: boolean; message: string }>;
    spinWheel: (customerId: string) => Promise<SpinResult>;
    redeemCoupon: (staffId: string, code: string) => Promise<boolean>;
    clearNewRewardFlag: () => void;
    // System Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setLogs: (logs: ActivityLog[]) => void;
  };
}

// --- Initial State ---
const initialState: AppState & { isLoading: boolean } = {
  currentUser: null,
  activeRole: UserRole.UNKNOWN, // Start unknown
  users: {}, // Only used for lookup cache in this version
  rewards: MOCK_REWARDS,
  logs: MOCK_LOGS,
  prizes: MOCK_PRIZES,
  lastCreatedRewardId: null,
  isLoading: true,
};

// --- Reducer ---
const appReducer = (state: AppState & { isLoading: boolean }, action: Action): AppState & { isLoading: boolean } => {
  const timestamp = new Date().toLocaleString();

  switch (action.type) {
    case 'SET_USER':
      console.log('REDUCER: SET_USER', action.payload);
      return {
        ...state,
        currentUser: action.payload,
        activeRole: action.payload?.role || UserRole.CUSTOMER,
        isLoading: false,
      };

    case 'SET_LOADING':
      console.log('REDUCER: SET_LOADING', action.payload);
      return { ...state, isLoading: action.payload };

    case 'UPDATE_USER_POINTS':
      if (!state.currentUser) return state;
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          points: action.payload.points,
          spins: action.payload.spins
        }
      };

    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs] };

    case 'ADD_REWARD':
      return {
        ...state,
        rewards: [action.payload, ...state.rewards],
        lastCreatedRewardId: action.payload.id
      };

    case 'MARK_REWARD_USED':
      return {
        ...state,
        rewards: state.rewards.map(r => r.code === action.payload ? { ...r, isUsed: true } : r)
      };

    case 'CLEAR_NEW_REWARD_FLAG':
      return { ...state, rewards: state.rewards.map(r => ({ ...r, isNew: false })), lastCreatedRewardId: null };

    case 'SET_LOGS':
      return { ...state, logs: action.payload };

    default:
      return state;
  }
};

// --- Provider ---
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // --- Auth Listener ---
  // Moved to AuthProvider to avoid race conditions and improve architecture
  useEffect(() => {
    // Initial state is loading
    // AuthProvider will handle SET_USER and SET_LOADING
  }, []);


  // --- Actions (Async Wrappers around API) ---

  // --- Actions (Async Wrappers around API) ---

  const actions = React.useMemo(() => ({
    logout: async () => {
      await supabase.auth.signOut();
      dispatch({ type: 'SET_USER', payload: null });
    },
    grantSpinsByPublicId: async (staffId: string, publicId: string, billAmount: number) => {
      const res = await api.addPoints(staffId, publicId, billAmount);
      if (res.success) {
        dispatch({
          type: 'ADD_LOG',
          payload: {
            id: `l-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            userId: staffId,
            userName: 'Staff Member',
            userAvatar: '',
            action: 'EARN_POINTS',
            details: `Earned ${res.pointsAdded} Points ($${billAmount.toFixed(2)})`,
            publicId
          }
        });
      }
      return res;
    },
    earnPoints: async (staffId: string, publicId: string, billAmount: number) => {
      // Just call logic directly since we can't self-reference easily in object literal init
      const res = await api.addPoints(staffId, publicId, billAmount);
      if (res.success) {
        dispatch({
          type: 'ADD_LOG',
          payload: {
            id: `l-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            userId: staffId,
            userName: 'Staff Member',
            userAvatar: '',
            action: 'EARN_POINTS',
            details: `Earned ${res.pointsAdded} Points ($${billAmount.toFixed(2)})`,
            publicId
          }
        });
      }
      return res;
    },
    convertPointsToSpins: async (customerId: string, spinsToBuy: number) => {
      const res = await api.convertPoints(customerId, spinsToBuy);
      if (res.success && res.newPoints !== undefined && res.newSpins !== undefined) {
        dispatch({ type: 'UPDATE_USER_POINTS', payload: { points: res.newPoints, spins: res.newSpins } });
        dispatch({
          type: 'ADD_LOG',
          payload: {
            id: `l-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            userId: customerId,
            userName: 'Customer',
            userAvatar: '',
            action: 'CONVERT_POINTS',
            details: `Converted points to ${spinsToBuy} Spins`
          }
        });
      }
      return res;
    },
    spinWheel: async (customerId: string): Promise<SpinResult> => {
      const res = await api.spinWheel(customerId);
      if (res.ok) {
        // Use actual values from RPC response
        if (res.newSpins !== undefined && res.newPoints !== undefined) {
          dispatch({ type: 'UPDATE_USER_POINTS', payload: { points: res.newPoints, spins: res.newSpins } });
        }
        if (res.reward) {
          dispatch({ type: 'ADD_REWARD', payload: { ...res.reward, isNew: true } });
        }
        dispatch({
          type: 'ADD_LOG',
          payload: {
            id: `l-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            userId: customerId,
            userName: 'Customer',
            userAvatar: '',
            action: 'SPIN',
            details: `Result: ${res.prize?.name || 'No Win'}`,
          }
        });
      }
      return res as SpinResult;
    },
    redeemCoupon: async (staffId: string, code: string): Promise<boolean> => {
      const success = await api.redeemCoupon(staffId, code);
      if (success) {
        dispatch({ type: 'MARK_REWARD_USED', payload: code });
        dispatch({
          type: 'ADD_LOG',
          payload: {
            id: `l-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            userId: staffId,
            userName: 'Staff Member',
            userAvatar: '',
            action: 'REDEMPTION',
            details: `Redeemed Coupon: ${code}`,
          }
        });
      }
      return success;
    },
    clearNewRewardFlag: () => dispatch({ type: 'CLEAR_NEW_REWARD_FLAG' }),
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setLogs: (logs: ActivityLog[]) => dispatch({ type: 'SET_LOGS', payload: logs })
  }), [dispatch]); // Actions ONLY depend on dispatch, making them stable across renders.

  // We need to fetch points/logs inside the actions if we want current state, 
  // but for the purpose of fixing the Infinite Loading, ensuring 'actions' object identity is stable is key.
  // The 'earnPoints' logic referencing 'state' was removed or simplified. 
  // Original 'earnPoints' alias 'grantSpinsByPublicId' just called earnPoints.

  // Re-implement earnPoints logic properly if it needed 'state'.
  // Looking at original code: 'earnPoints' used 'state.currentUser.points'.
  // To fix this without breaking stability: valid actions shouldn't rely on closure state.
  // We'll rely on the API response or fresh fetch for strict correctness, or just ignore the optimistic calc for points for now.

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};