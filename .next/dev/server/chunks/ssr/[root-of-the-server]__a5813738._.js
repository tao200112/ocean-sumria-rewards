module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/types.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UserRole",
    ()=>UserRole,
    "normalizeRole",
    ()=>normalizeRole
]);
var UserRole = /*#__PURE__*/ function(UserRole) {
    UserRole["UNKNOWN"] = "UNKNOWN";
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["STAFF"] = "STAFF";
    UserRole["ADMIN"] = "ADMIN";
    return UserRole;
}({});
const normalizeRole = (role)=>{
    if (!role) return "CUSTOMER"; // Default fallback for DB defaults
    const normalized = role.toUpperCase().trim();
    if (normalized === 'STAFF') return "STAFF";
    if (normalized === 'ADMIN') return "ADMIN";
    if (normalized === 'CUSTOMER') return "CUSTOMER";
    return "CUSTOMER"; // Safe default
};
}),
"[project]/services/mockData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MOCK_LOGS",
    ()=>MOCK_LOGS,
    "MOCK_PRIZES",
    ()=>MOCK_PRIZES,
    "MOCK_REWARDS",
    ()=>MOCK_REWARDS,
    "MOCK_USERS",
    ()=>MOCK_USERS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types.ts [app-ssr] (ecmascript)");
;
const MOCK_USERS = {
    customer: {
        id: 'c1',
        publicId: 'OS-8X29',
        name: 'Alex Johnson',
        email: 'alex.j@example.com',
        role: __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].CUSTOMER,
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
        role: __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].CUSTOMER,
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
        role: __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].STAFF,
        avatarUrl: 'https://picsum.photos/seed/david/100/100'
    },
    admin: {
        id: 'a1',
        publicId: 'AD-001',
        name: 'Sarah Owner',
        email: 'admin@oceansumria.com',
        role: __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].ADMIN,
        avatarUrl: 'https://picsum.photos/seed/sarah/100/100'
    }
};
const MOCK_REWARDS = [
    {
        id: 'r1',
        title: 'Free Calamari Appetizer',
        description: 'Crispy, golden-fried calamari rings with marinara.',
        expiryDate: '2023-10-24',
        isUsed: false,
        type: 'FREE_ITEM',
        code: 'XC-992-00',
        imageUrl: 'https://picsum.photos/seed/calamari/300/200'
    },
    {
        id: 'r2',
        title: 'Spicy Tuna Roll',
        description: 'Fresh tuna with spicy mayo.',
        expiryDate: '2023-11-01',
        isUsed: false,
        type: 'FREE_ITEM',
        code: 'ST-112-99',
        imageUrl: 'https://picsum.photos/seed/sushi/300/200'
    },
    {
        id: 'r3',
        title: '10% Off Total Bill',
        description: 'Valid for dine-in only.',
        expiryDate: '2023-10-20',
        isUsed: true,
        type: 'DISCOUNT',
        code: '10-OFF-OLD',
        imageUrl: 'https://picsum.photos/seed/discount/300/200'
    }
];
const MOCK_PRIZES = [
    {
        id: 'p1',
        name: 'Free Burger',
        weight: 10,
        totalAvailable: 500,
        winLimit: '1/day',
        active: false,
        icon: 'lunch_dining',
        color: '#f2a60d'
    },
    {
        id: 'p2',
        name: '10% Off',
        weight: 50,
        totalAvailable: 'unlimited',
        winLimit: 'None',
        active: true,
        icon: 'local_offer',
        color: '#3b82f6'
    },
    {
        id: 'p3',
        name: 'Mystery Box',
        weight: 5,
        totalAvailable: 10,
        winLimit: '1/user',
        active: true,
        icon: 'inventory_2',
        color: '#8b5cf6'
    },
    {
        id: 'p4',
        name: 'Free Drink',
        weight: 80,
        totalAvailable: 'unlimited',
        winLimit: 'None',
        active: true,
        icon: 'local_bar',
        color: '#10b981'
    },
    // Adding a logic-only prize for "No Win" if weights don't add up, or explicit lose
    {
        id: 'p_lose',
        name: 'Better Luck Next Time',
        weight: 20,
        totalAvailable: 'unlimited',
        winLimit: 'None',
        active: true,
        icon: 'mood_bad',
        color: '#64748b'
    }
];
const MOCK_LOGS = [
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
        details: 'Redeemed 10% Off'
    },
    {
        id: 'l3',
        timestamp: '2023-10-23 04:30 PM',
        userId: 's1',
        userName: 'David Chen',
        userAvatar: 'https://picsum.photos/seed/david/50/50',
        action: 'EARN_POINTS',
        details: 'Earned 105 Points ($105.00 Bill)'
    },
    {
        id: 'l4',
        timestamp: '2023-10-23 05:00 PM',
        userId: 'c1',
        publicId: 'OS-8X29',
        userName: 'Alex Johnson',
        userAvatar: 'https://picsum.photos/seed/alex/50/50',
        action: 'CONVERT_POINTS',
        details: 'Converted 200 pts to 2 Spins'
    }
];
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/punycode [external] (punycode, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/services/supabase.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-ssr] (ecmascript)");
;
// Access env vars safely using Next.js standard
const supabaseUrl = ("TURBOPACK compile-time value", "https://vuhllswkulcllrealkgq.supabase.co");
const supabaseKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aGxsc3drdWxjbGxyZWFsa2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjk3NjYsImV4cCI6MjA4Mzc0NTc2Nn0.1JTHPF0x9YlfvLQk0urJNGJU4O3rmQPA0YaaJBvRGKY");
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const createClient = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createBrowserClient"])(supabaseUrl, supabaseKey);
// Use global singleton in dev to prevent multiple clients contesting for locks (AbortError fix)
const singleton = globalThis.supabase ?? createClient();
if ("TURBOPACK compile-time truthy", 1) {
    globalThis.supabase = singleton;
}
const supabase = singleton;
}),
"[project]/services/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types.ts [app-ssr] (ecmascript)");
;
;
/**
 * API Facade
 * 
 * Connecting to Next.js API Routes.
 */ // Utility: Timeout wrapper
const withTimeout = (promise, ms, label)=>{
    return new Promise((resolve, reject)=>{
        const timer = setTimeout(()=>{
            console.warn(`[API] Timeout: ${label} took longer than ${ms}ms`);
            reject(new Error(`Timeout: ${label}`));
        }, ms);
        promise.then((res)=>{
            clearTimeout(timer);
            resolve(res);
        }).catch((err)=>{
            clearTimeout(timer);
            reject(err);
        });
    });
};
const api = {
    /**
   * Fetch User Profile with STRICT Handling
   * GET /api/auth/me
   */ fetchProfile: async (userId, email)=>{
        let attempts = 0;
        while(attempts < 5){
            try {
                // Use RPC for reliability (bypasses complex RLS)
                const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].rpc('rpc_get_my_profile');
                if (error) {
                    console.warn(`[API] fetchProfile RPC error (attempt ${attempts}):`, error.message);
                } else if (data && !data.error) {
                    // Found it!
                    return {
                        id: data.id,
                        publicId: data.public_id,
                        name: data.name || email.split('@')[0],
                        email: data.email || email,
                        role: (0, __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeRole"])(data.role),
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
            await new Promise((r)=>setTimeout(r, 800));
            attempts++;
        }
        console.error('[API] fetchProfile failed after 5 attempts.');
        return null;
    },
    /**
   * ensureProfile: READ ONLY.
   * We DO NOT create profiles on client anymore.
   * If usage calls this, we just fetch.
   */ ensureProfile: async (user)=>{
        // Just an alias for direct fetch now, wait for trigger
        let attempts = 0;
        while(attempts < 5){
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (data) return data;
            if (error) console.warn('Profile fetch error:', error);
            // Wait 1s for trigger
            await new Promise((r)=>setTimeout(r, 1000));
            attempts++;
        }
        return null;
    },
    // --- RPC Wrappers ---
    staffGetCustomer: async (publicId)=>{
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].rpc('rpc_staff_get_customer_by_public_id', {
            public_id_query: publicId
        });
        if (error) return {
            found: false,
            error: error.message
        };
        return data; // { found: true, profile: ... }
    },
    staffAddPoints: async (publicId, amountCents)=>{
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].rpc('rpc_staff_add_points', {
            public_id_query: publicId,
            bill_amount_cents: amountCents,
            receipt_ref: 'manual'
        });
        if (error) return {
            status: 'error',
            message: error.message
        };
        return data;
    },
    // Mapping old actions to RPCs where possible
    // ... (Other existing methods) ...
    /**
   * Staff: Add Points to Customer
   * POST /api/staff/add-points
   */ addPoints: async (staffId, customerPublicId, billAmount)=>{
        try {
            const res = await fetch('/api/staff/add-points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    publicId: customerPublicId,
                    billAmountCents: Math.round(billAmount * 100),
                    receiptRef: `REF-${Date.now()}`
                })
            });
            const json = await res.json();
            if (!res.ok) return {
                success: false,
                message: json.error
            };
            return {
                success: true,
                message: `Added points successfully`,
                pointsAdded: json.data.new_points
            };
        } catch (e) {
            return {
                success: false,
                message: e.message
            };
        }
    },
    /**
   * Customer: Convert Points to Spins
   * POST /api/customer/convert-points
   */ convertPoints: async (customerId, spinsToBuy)=>{
        try {
            console.log('[API] Converting points via RPC, spins:', spinsToBuy);
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].rpc('rpc_convert_points_to_spins', {
                p_spin_count: spinsToBuy
            });
            console.log('[API] Convert result:', data, error);
            if (error) {
                return {
                    success: false,
                    message: error.message
                };
            }
            if (data?.success === false) {
                return {
                    success: false,
                    message: data.error || 'Conversion failed'
                };
            }
            return {
                success: true,
                message: `Converted ${data.points_spent} points to ${data.spins_added} spins`,
                newPoints: data.new_points,
                newSpins: data.new_spins
            };
        } catch (e) {
            console.error('[API] convertPoints error:', e);
            return {
                success: false,
                message: e.message
            };
        }
    },
    /**
   * Customer: Spin the Wheel
   * POST /api/customer/spin
   */ spinWheel: async (customerId)=>{
        try {
            console.log('[API] Spinning wheel via RPC...');
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].rpc('rpc_spin');
            console.log('[API] Spin result:', data, error);
            if (error) {
                return {
                    ok: false,
                    error: error.message
                };
            }
            if (!data?.ok) {
                return {
                    ok: false,
                    error: data?.error || 'Spin failed'
                };
            }
            const { outcome, prize, coupon_code, spins, points } = data;
            let reward;
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
            return {
                ok: false,
                error: e.message
            };
        }
    },
    /**
   * Staff: Redeem Coupon
   * POST /api/staff/redeem
   */ redeemCoupon: async (staffId, code)=>{
        try {
            const res = await fetch('/api/staff/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code
                })
            });
            const json = await res.json();
            return json.ok;
        } catch (e) {
            console.error(e);
            return false;
        }
    },
    /**
   * Admin: Fetch Logs
   * GET /api/admin/audit-logs
   */ getLogs: async ()=>{
        try {
            const res = await fetch('/api/admin/audit-logs');
            const json = await res.json();
            if (!res.ok) return [];
            // Map to frontend ActivityLog type
            return json.data.map((log)=>({
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
   */ publishPool: async (poolVersionId)=>{
        try {
            const res = await fetch('/api/admin/pool/publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    poolVersionId
                })
            });
            const json = await res.json();
            return {
                success: res.ok,
                message: json.ok ? 'Published' : json.error
            };
        } catch (e) {
            return {
                success: false,
                message: e.message
            };
        }
    }
};
}),
"[project]/services/store.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppProvider",
    ()=>AppProvider,
    "useAppStore",
    ()=>useAppStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/mockData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/api.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
// --- Initial State ---
const initialState = {
    currentUser: null,
    activeRole: __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].UNKNOWN,
    users: {},
    rewards: __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MOCK_REWARDS"],
    logs: __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MOCK_LOGS"],
    prizes: __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$mockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MOCK_PRIZES"],
    lastCreatedRewardId: null,
    isLoading: true
};
// --- Reducer ---
const appReducer = (state, action)=>{
    const timestamp = new Date().toLocaleString();
    switch(action.type){
        case 'SET_USER':
            console.log('REDUCER: SET_USER', action.payload);
            return {
                ...state,
                currentUser: action.payload,
                activeRole: action.payload?.role || __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].CUSTOMER,
                isLoading: false
            };
        case 'SET_LOADING':
            console.log('REDUCER: SET_LOADING', action.payload);
            return {
                ...state,
                isLoading: action.payload
            };
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
            return {
                ...state,
                logs: [
                    action.payload,
                    ...state.logs
                ]
            };
        case 'ADD_REWARD':
            return {
                ...state,
                rewards: [
                    action.payload,
                    ...state.rewards
                ],
                lastCreatedRewardId: action.payload.id
            };
        case 'MARK_REWARD_USED':
            return {
                ...state,
                rewards: state.rewards.map((r)=>r.code === action.payload ? {
                        ...r,
                        isUsed: true
                    } : r)
            };
        case 'CLEAR_NEW_REWARD_FLAG':
            return {
                ...state,
                rewards: state.rewards.map((r)=>({
                        ...r,
                        isNew: false
                    })),
                lastCreatedRewardId: null
            };
        case 'SET_LOGS':
            return {
                ...state,
                logs: action.payload
            };
        default:
            return state;
    }
};
// --- Provider ---
const AppContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const AppProvider = ({ children })=>{
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReducer"])(appReducer, initialState);
    // --- Auth Listener ---
    // Moved to AuthProvider to avoid race conditions and improve architecture
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
    // Initial state is loading
    // AuthProvider will handle SET_USER and SET_LOADING
    }, []);
    // --- Actions (Async Wrappers around API) ---
    // --- Actions (Async Wrappers around API) ---
    const actions = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useMemo(()=>({
            logout: async ()=>{
                await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
                dispatch({
                    type: 'SET_USER',
                    payload: null
                });
            },
            grantSpinsByPublicId: async (staffId, publicId, billAmount)=>{
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].addPoints(staffId, publicId, billAmount);
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
            earnPoints: async (staffId, publicId, billAmount)=>{
                // Just call logic directly since we can't self-reference easily in object literal init
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].addPoints(staffId, publicId, billAmount);
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
            convertPointsToSpins: async (customerId, spinsToBuy)=>{
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].convertPoints(customerId, spinsToBuy);
                if (res.success && res.newPoints !== undefined && res.newSpins !== undefined) {
                    dispatch({
                        type: 'UPDATE_USER_POINTS',
                        payload: {
                            points: res.newPoints,
                            spins: res.newSpins
                        }
                    });
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
            spinWheel: async (customerId)=>{
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].spinWheel(customerId);
                if (res.ok) {
                    // Use actual values from RPC response
                    if (res.newSpins !== undefined && res.newPoints !== undefined) {
                        dispatch({
                            type: 'UPDATE_USER_POINTS',
                            payload: {
                                points: res.newPoints,
                                spins: res.newSpins
                            }
                        });
                    }
                    if (res.reward) {
                        dispatch({
                            type: 'ADD_REWARD',
                            payload: {
                                ...res.reward,
                                isNew: true
                            }
                        });
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
                            details: `Result: ${res.prize?.name || 'No Win'}`
                        }
                    });
                }
                return res;
            },
            redeemCoupon: async (staffId, code)=>{
                const success = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].redeemCoupon(staffId, code);
                if (success) {
                    dispatch({
                        type: 'MARK_REWARD_USED',
                        payload: code
                    });
                    dispatch({
                        type: 'ADD_LOG',
                        payload: {
                            id: `l-${Date.now()}`,
                            timestamp: new Date().toLocaleString(),
                            userId: staffId,
                            userName: 'Staff Member',
                            userAvatar: '',
                            action: 'REDEMPTION',
                            details: `Redeemed Coupon: ${code}`
                        }
                    });
                }
                return success;
            },
            clearNewRewardFlag: ()=>dispatch({
                    type: 'CLEAR_NEW_REWARD_FLAG'
                }),
            setUser: (user)=>dispatch({
                    type: 'SET_USER',
                    payload: user
                }),
            setLoading: (loading)=>dispatch({
                    type: 'SET_LOADING',
                    payload: loading
                }),
            setLogs: (logs)=>dispatch({
                    type: 'SET_LOGS',
                    payload: logs
                })
        }), [
        dispatch
    ]); // Actions ONLY depend on dispatch, making them stable across renders.
    // We need to fetch points/logs inside the actions if we want current state, 
    // but for the purpose of fixing the Infinite Loading, ensuring 'actions' object identity is stable is key.
    // The 'earnPoints' logic referencing 'state' was removed or simplified. 
    // Original 'earnPoints' alias 'grantSpinsByPublicId' just called earnPoints.
    // Re-implement earnPoints logic properly if it needed 'state'.
    // Looking at original code: 'earnPoints' used 'state.currentUser.points'.
    // To fix this without breaking stability: valid actions shouldn't rely on closure state.
    // We'll rely on the API response or fresh fetch for strict correctness, or just ignore the optimistic calc for points for now.
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AppContext.Provider, {
        value: {
            state,
            actions
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/services/store.tsx",
        lineNumber: 246,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useAppStore = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AppContext);
    if (!context) throw new Error('useAppStore must be used within AppProvider');
    return context;
};
}),
"[project]/components/auth/AuthProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$store$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/store.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    loading: true,
    session: null
});
const useAuth = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
function AuthProvider({ children }) {
    const { actions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$store$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppStore"])();
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [initialized, setInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Single initialization effect
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (initialized) return;
        setInitialized(true);
        console.log('[Auth] Initializing...');
        const initAuth = async ()=>{
            try {
                // 1. Get current session
                const { data: { session: currentSession }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                if (error) {
                    console.error('[Auth] getSession error:', error);
                    setLoading(false);
                    actions.setLoading(false);
                    return;
                }
                setSession(currentSession);
                if (currentSession?.user) {
                    console.log('[Auth] Session found, fetching profile for:', currentSession.user.id);
                    await loadProfile(currentSession.user);
                } else {
                    console.log('[Auth] No session');
                    actions.setUser(null);
                    setLoading(false);
                    actions.setLoading(false);
                }
            } catch (e) {
                console.error('[Auth] Init error:', e);
                setLoading(false);
                actions.setLoading(false);
            }
        };
        // Listen for auth changes
        const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange(async (event, newSession)=>{
            console.log('[Auth] Event:', event);
            setSession(newSession);
            if (event === 'SIGNED_IN' && newSession?.user) {
                console.log('[Auth] SIGNED_IN, loading profile...');
                await loadProfile(newSession.user);
            } else if (event === 'SIGNED_OUT') {
                console.log('[Auth] SIGNED_OUT');
                actions.setUser(null);
                setLoading(false);
                actions.setLoading(false);
            }
        });
        initAuth();
        return ()=>{
            subscription.unsubscribe();
        };
    }, [
        initialized,
        actions
    ]);
    // Profile loader function
    const loadProfile = async (user)=>{
        console.log('[Auth] loadProfile called for:', user.id, user.email);
        setLoading(true);
        actions.setLoading(true);
        // Hard timeout protection
        const timeout = setTimeout(()=>{
            console.error('[Auth] Profile load timeout - unlocking UI');
            setLoading(false);
            actions.setLoading(false);
        }, 8000);
        try {
            // Try RPC first
            console.log('[Auth] Calling rpc_get_my_profile...');
            const { data: rpcData, error: rpcError } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].rpc('rpc_get_my_profile');
            clearTimeout(timeout);
            console.log('[Auth] RPC result:', {
                data: rpcData,
                error: rpcError
            });
            if (rpcError) {
                console.error('[Auth] RPC error:', rpcError.message);
                // Try direct query as fallback
                console.log('[Auth] Trying direct query...');
                const { data: directData, error: directError } = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('*').eq('id', user.id).single();
                console.log('[Auth] Direct query result:', {
                    data: directData,
                    error: directError
                });
                if (directData) {
                    const profile = {
                        id: directData.id,
                        publicId: directData.public_id,
                        name: directData.name || user.email?.split('@')[0],
                        email: directData.email || user.email,
                        role: (0, __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeRole"])(directData.role),
                        avatarUrl: `https://ui-avatars.com/api/?name=${directData.email}&background=random`,
                        points: directData.points || 0,
                        spins: directData.spins || 0,
                        joinedDate: new Date().toLocaleDateString()
                    };
                    console.log('[Auth] Profile loaded via direct query:', profile.publicId);
                    actions.setUser(profile);
                } else {
                    console.error('[Auth] No profile found!');
                    alert('Profile not found. Please contact support.');
                    await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
                    actions.setUser(null);
                }
            } else if (rpcData && !rpcData.error) {
                const profile = {
                    id: rpcData.id,
                    publicId: rpcData.public_id,
                    name: rpcData.name || user.email?.split('@')[0],
                    email: rpcData.email || user.email,
                    role: (0, __TURBOPACK__imported__module__$5b$project$5d2f$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeRole"])(rpcData.role),
                    avatarUrl: `https://ui-avatars.com/api/?name=${rpcData.email}&background=random`,
                    points: rpcData.points || 0,
                    spins: rpcData.spins || 0,
                    joinedDate: new Date().toLocaleDateString()
                };
                console.log('[Auth] Profile loaded via RPC:', profile.publicId, profile.role);
                actions.setUser(profile);
            } else {
                console.error('[Auth] RPC returned error:', rpcData?.error);
                alert('Profile not found. Please try signing in again.');
                await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
                actions.setUser(null);
            }
        } catch (e) {
            console.error('[Auth] loadProfile exception:', e);
            actions.setUser(null);
        } finally{
            setLoading(false);
            actions.setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            loading,
            session
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/auth/AuthProvider.tsx",
        lineNumber: 167,
        columnNumber: 9
    }, this);
}
}),
"[project]/app/providers.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$store$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/store.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$AuthProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/AuthProvider.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$services$2f$store$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AppProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$AuthProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AuthProvider"], {
            children: children
        }, void 0, false, {
            fileName: "[project]/app/providers.tsx",
            lineNumber: 8,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/providers.tsx",
        lineNumber: 7,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a5813738._.js.map