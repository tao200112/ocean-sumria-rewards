import { supabase } from './supabase';
import { User, UserRole, ActivityLog, SpinResult, normalizeRole, Reward } from '../types';

/**
 * API Facade
 * 
 * Connecting to Next.js API Routes.
 */

// Utility: Timeout wrapper
const withTimeout = (promise: Promise<any>, ms: number, label: string) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn(`[API] Timeout: ${label} took longer than ${ms}ms`);
      reject(new Error(`Timeout: ${label}`));
    }, ms);

    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export const api = {
  /**
   * Fetch User Profile with STRICT Handling
   * GET /api/auth/me
   */
  fetchProfile: async (userId: string, email: string): Promise<User | null> => {
    let attempts = 0;
    while (attempts < 5) {
      try {
        // Use RPC for reliability (bypasses complex RLS)
        const { data, error } = await supabase.rpc('rpc_get_my_profile');

        if (error) {
          console.warn(`[API] fetchProfile RPC error (attempt ${attempts}):`, error.message);
        } else if (data && !data.error) {
          // Found it!
          return {
            id: data.id,
            publicId: data.public_id,
            name: data.name || email.split('@')[0],
            email: data.email || email,
            role: normalizeRole(data.role),
            avatarUrl: `https://ui-avatars.com/api/?name=${data.email}&background=random`,
            points: data.points || 0,
            spins: data.spins || 0,
            joinedDate: new Date().toLocaleDateString()
          };
        } else if (data?.error) {
          console.log(`[API] RPC returned error: ${data.error}, retrying... ${attempts + 1}/5`);
        } else {
          console.log(`[API] Profile missing, retrying... ${attempts + 1}/5`);
        }
      } catch (e) {
        console.error(`[API] fetchProfile attempt ${attempts} crash:`, e);
      }

      // Short delay between retries
      await new Promise(r => setTimeout(r, 800));
      attempts++;
    }

    console.error('[API] fetchProfile failed after 5 attempts.');
    return null;
  },

  /**
   * ensureProfile: Creates profile if it doesn't exist.
   * Calls rpc_ensure_profile which handles profile creation for OAuth users.
   */
  ensureProfile: async (user: any): Promise<any> => {
    try {
      console.log('[API] Ensuring profile exists via RPC...');
      const { data, error } = await supabase.rpc('rpc_ensure_profile');

      if (error) {
        console.error('[API] ensureProfile RPC error:', error);
        return null;
      }

      if (data?.error) {
        console.error('[API] ensureProfile returned error:', data.error, data.message);
        return null;
      }

      console.log('[API] ensureProfile result:', data?.created ? 'Created new profile' : 'Profile exists');
      return data;
    } catch (e) {
      console.error('[API] ensureProfile exception:', e);
      return null;
    }
  },

  // --- RPC Wrappers ---

  staffGetCustomer: async (publicId: string) => {
    const { data, error } = await supabase.rpc('rpc_staff_get_customer_by_public_id', { public_id_query: publicId });
    if (error) return { found: false, error: error.message };
    return data; // { found: true, profile: ... }
  },

  staffAddPoints: async (publicId: string, amountCents: number) => {
    const { data, error } = await supabase.rpc('rpc_staff_add_points', {
      public_id_query: publicId,
      bill_amount_cents: amountCents,
      receipt_ref: 'manual'
    });
    if (error) return { status: 'error', message: error.message };
    return data;
  },

  // Mapping old actions to RPCs where possible
  // ... (Other existing methods) ...

  /**
   * Staff: Add Points to Customer
   * POST /api/staff/add-points
   */
  /**
   * Staff: Add Points to Customer (via RPC)
   */
  addPoints: async (staffId: string, customerPublicId: string, billAmount: number) => {
    try {
      const cents = Math.round(billAmount * 100);
      const { data, error } = await supabase.rpc('rpc_staff_add_points', {
        p_public_id: customerPublicId,
        p_usd_cents: cents,
        p_note: 'Added via Staff App'
      });

      if (error) return { success: false, message: error.message };
      if (data?.status === 'error') return { success: false, message: data.message };

      return {
        success: true,
        message: `Added points successfully`,
        pointsAdded: data.points_added,
        newPoints: data.new_points
      };
    } catch (e) {
      return { success: false, message: (e as Error).message };
    }
  },

  /**
   * Staff: Find User (via RPC)
   */
  findUser: async (publicId: string) => {
    try {
      console.log('[API] findUser calling RPC with:', publicId);
      const { data, error } = await supabase.rpc('rpc_staff_find_user_by_public_id', {
        p_public_id: publicId
      });
      console.log('[API] findUser result:', data, error);

      if (error) {
        if (error.message.includes('UNAUTHORIZED') || error.message.includes('Auth')) {
          return { success: false, message: 'UNAUTHORIZED: You need Staff role.' };
        }
        return { success: false, message: error.message };
      }
      if (!data?.found) return { success: false, message: 'Customer not found' };

      return { success: true, user: data.profile };
    } catch (e) {
      console.error('[API] findUser exception:', e);
      return { success: false, message: (e as Error).message };
    }
  },

  becomeStaff: async () => {
    try {
      const { data, error } = await supabase.rpc('rpc_become_staff');
      if (error) return { success: false, message: error.message };
      return data;
    } catch (e) {
      return { success: false, message: (e as Error).message };
    }
  },

  /**
   * Customer: Convert Points to Spins
   * POST /api/customer/convert-points
   */
  convertPoints: async (customerId: string, spinsToBuy: number) => {
    try {
      console.log('[API] Converting points via RPC, spins:', spinsToBuy);
      const { data, error } = await supabase.rpc('rpc_convert_points_to_spins', {
        p_spin_count: spinsToBuy
      });

      console.log('[API] Convert result:', data, error);

      if (error) {
        return { success: false, message: error.message };
      }

      if (data?.success === false) {
        return { success: false, message: data.error || 'Conversion failed' };
      }

      return {
        success: true,
        message: `Converted ${data.points_spent} points to ${data.spins_added} spins`,
        newPoints: data.new_points,
        newSpins: data.new_spins
      };
    } catch (e) {
      console.error('[API] convertPoints error:', e);
      return { success: false, message: (e as Error).message };
    }
  },

  /**
   * Customer: Spin the Wheel
   * POST /api/customer/spin
   */
  spinWheel: async (customerId: string) => {
    try {
      console.log('[API] Spinning wheel via RPC...');
      const { data, error } = await supabase.rpc('rpc_spin');

      console.log('[API] Spin result:', data, error);

      if (error) {
        return { ok: false, error: error.message };
      }

      if (!data?.ok) {
        return { ok: false, error: data?.error || 'Spin failed' };
      }

      const { outcome, prize, coupon_code, spins, points } = data;

      let reward: Reward | undefined;
      if (outcome === 'WIN' && prize) {
        reward = {
          id: coupon_code || 'temp',
          title: prize.name,
          description: prize.value || 'Prize Reward',
          expiryDate: '7 days',
          isUsed: false,
          type: prize.type === 'discount' ? 'DISCOUNT' : 'FREE_ITEM',
          code: coupon_code,
          imageUrl: 'https://picsum.photos/seed/win/300/200',
          isNew: true
        };
      }

      return {
        ok: true,
        prize: prize || null,
        reward,
        outcome: outcome,
        newSpins: spins,
        newPoints: points
      };
    } catch (e) {
      console.error('[API] spinWheel error:', e);
      return { ok: false, error: (e as Error).message };
    }
  },

  /**
   * Fetch current user's rewards (coupons)
   */
  fetchMyRewards: async () => {
    try {
      console.log('[API] Fetching my rewards...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('coupons')
        .select(`
          id,
          code,
          status,
          expires_at,
          created_at,
          prize:prizes (
            name,
            value_description,
            type,
            icon,
            color
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('[API] Fetch rewards result:', data?.length, error);

      if (error) {
        console.error('Fetch rewards error:', error);
        return { success: false, error: error.message };
      }

      // Map to Reward interface
      const rewards: Reward[] = data.map((item: any) => ({
        id: item.id,
        title: item.prize?.name || 'Unknown Prize',
        description: item.prize?.value_description || 'Prize Reward',
        expiryDate: item.expires_at ? new Date(item.expires_at).toLocaleDateString() : 'No Expiry',
        isUsed: item.status === 'redeemed',
        isNew: false,
        type: item.prize?.type === 'discount' ? 'DISCOUNT' : 'FREE_ITEM',
        code: item.code,
        imageUrl: `https://picsum.photos/seed/${item.prize?.name || 'prize'}/300/200`
      }));

      return { success: true, rewards };
    } catch (e) {
      console.error('[API] fetchMyRewards exception:', e);
      return { success: false, error: (e as Error).message };
    }
  },

  /**
   * Staff: Redeem Coupon
   * POST /api/staff/redeem
   */
  /**
   * Staff: Redeem Coupon (via RPC)
   */
  redeemCoupon: async (staffId: string, code: string) => {
    try {
      const { data, error } = await supabase.rpc('rpc_staff_redeem_coupon', {
        p_code: code
      });

      if (error) {
        console.error('Redeem RPC error:', error);
        return false;
      }

      if (!data?.success) {
        console.error('Redeem failed:', data?.message);
        return false;
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  /**
   * Admin: Fetch Logs
   * GET /api/admin/audit-logs
   */
  getLogs: async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      const json = await res.json();
      if (!res.ok) return [];

      // Map to frontend ActivityLog type
      return json.data.map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.created_at).toLocaleString(),
        userId: log.actor_id,
        userName: log.profiles?.name || 'Unknown',
        userAvatar: '',
        action: log.type,
        details: JSON.stringify(log.metadata)
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  /**
   * Admin: Publish Prize Pool
   * POST /api/admin/pool/publish
   */
  publishPool: async (poolVersionId: string) => {
    try {
      const res = await fetch('/api/admin/pool/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolVersionId })
      });
      const json = await res.json();
      return { success: res.ok, message: json.ok ? 'Published' : json.error };
    } catch (e) {
      return { success: false, message: (e as Error).message };
    }
  },

  // ==================== Prize Management ====================

  /**
   * Fetch all prizes from database
   */
  fetchPrizes: async () => {
    try {
      const res = await fetch('/api/admin/prizes');
      const json = await res.json();
      if (!res.ok) {
        console.error('[API] fetchPrizes error:', json.error);
        return { success: false, prizes: [], error: json.error };
      }
      return { success: true, prizes: json.prizes || [], poolId: json.poolId };
    } catch (e) {
      console.error('[API] fetchPrizes exception:', e);
      return { success: false, prizes: [], error: (e as Error).message };
    }
  },

  /**
   * Update a prize
   */
  updatePrize: async (prize: { id: string; name?: string; weight?: number; displayWeight?: number; active?: boolean; icon?: string; color?: string; value_description?: string }) => {
    try {
      // Map camelCase displayWeight to snake_case display_weight for API
      const payload: any = { ...prize };
      if (prize.displayWeight !== undefined) {
        payload.display_weight = prize.displayWeight;
      }

      const res = await fetch('/api/admin/prizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error };
      }
      return { success: true, prize: json.prize };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  /**
   * Create a new prize
   */
  createPrize: async (prize: { pool_version_id: string; name: string; type?: string; weight?: number; displayWeight?: number; active?: boolean; icon?: string; color?: string; value_description?: string }) => {
    try {
      // Map camelCase displayWeight to snake_case display_weight for API
      const payload: any = { ...prize };
      if (prize.displayWeight !== undefined) {
        payload.display_weight = prize.displayWeight;
      }

      const res = await fetch('/api/admin/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error };
      }
      return { success: true, prize: json.prize };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  /**
   * Delete a prize
   */
  deletePrize: async (prizeId: string) => {
    try {
      const res = await fetch(`/api/admin/prizes?id=${prizeId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  /**
   * Fetch activity logs
   */
  fetchActivityLogs: async () => {
    try {
      const res = await fetch('/api/admin/logs');
      const json = await res.json();
      if (!res.ok) {
        console.error('[API] fetchActivityLogs error:', json.error);
        return { success: false, logs: [], error: json.error };
      }
      return { success: true, logs: json.logs };
    } catch (e) {
      console.error('[API] fetchActivityLogs exception:', e);
      return { success: false, logs: [], error: (e as Error).message };
    }
  }
};