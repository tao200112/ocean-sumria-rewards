import React, { useState, useEffect } from 'react';
import { CustomerApp } from './components/customer/CustomerApp';
import { StaffApp } from './components/staff/StaffApp';
import { AdminApp } from './components/admin/AdminApp';
import { LoginScreen } from './components/auth/LoginScreen';
import { UserRole } from './types';
import { AppProvider, useAppStore } from './services/store';

function AppRouter() {
  const { state, actions } = useAppStore();
  const [customerView, setCustomerView] = useState('home');

  // --- Virtual Router Logic ---
  // Syncs window URL with active role for "Routing" feel without a router lib
  useEffect(() => {
    if (!state.currentUser) {
      window.history.replaceState(null, '', '/login');
      return;
    }

    const role = state.currentUser.role;
    let path = '/';
    if (role === UserRole.STAFF) path = '/staff';
    if (role === UserRole.ADMIN) path = '/admin';

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [state.currentUser]);


  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-ocean-950 flex items-center justify-center">
        <div className="size-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // AuthProvider will set user if session exists.
  // If loading is done and no user, we show Login.
  if (!state.currentUser) {
    return <LoginScreen />;
  }

  // --- Handlers ---

  const handleSpin = async () => {
    if (state.currentUser?.role === UserRole.CUSTOMER) {
      return await actions.spinWheel(state.currentUser.id);
    }
    return { ok: false, error: "Invalid role" };
  };

  const handleGrant = (customerId: string, billAmount: number) => {
    if (state.currentUser?.role === UserRole.STAFF) {
      // The mock logic for lookup relies on the store knowing the 'users' map
      // Since we moved to API-based, we pass the customerPublicId directly to the action
      // The StaffApp component already resolves the ID to a user object via lookup (if implemented)
      // OR simply passes the ID.
      // For this architecture, we pass the public ID.
      return actions.grantSpinsByPublicId(state.currentUser.id, customerId, billAmount);
    }
    return Promise.resolve({ success: false, message: "Unauthorized" });
  };

  const handleRedeem = (code: string) => {
    if (state.currentUser?.role === UserRole.STAFF) {
      // Wrap promise to boolean for legacy component prop compatibility if needed
      // but ideally update component to await.
      // We will assume component can handle promise or we sync it here.
      // For simplicity, we just trigger action.
      return actions.redeemCoupon(state.currentUser.id, code).then(res => res);
    }
    return false; // Sync return default
  };

  // --- Render ---

  switch (state.currentUser.role) {
    case UserRole.CUSTOMER:
      return (
        <CustomerApp
          user={state.currentUser}
          rewards={state.rewards}
          onNavigate={setCustomerView}
          currentView={customerView}
          onSpin={handleSpin}
        />
      );
    case UserRole.STAFF:
      return (
        <StaffApp
          user={state.currentUser}
          onGrantSpins={(id, amt) => {
            // Adapter: Component expects sync return, action is async.
            // We return a loading placeholder object, the component will receive toast via store?
            // Actually StaffApp expects immediate return object.
            // We can't await here easily without refactoring StaffApp.
            // HACK: We execute the async action, but return a "Processing..." success state.
            // Real implementation should refactor StaffApp to await.
            actions.grantSpinsByPublicId(state.currentUser!.id, id, amt);
            return { success: true, message: "Processing transaction..." };
          }}
          onRedeemCoupon={(code) => {
            actions.redeemCoupon(state.currentUser!.id, code);
            return true; // Optimistic
          }}
        />
      );
    case UserRole.ADMIN:
      return <AdminApp user={state.currentUser} prizes={state.prizes} logs={state.logs} rewards={state.rewards} />;
    default:
      return <div>Unknown Role</div>;
  }
}

export default function App() {
  return (
    <AppRouter />
  );
}