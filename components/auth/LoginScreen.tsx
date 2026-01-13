import React, { useState } from 'react';
import { supabase } from '../../services/supabase';

export const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin, // Redirect back to root (App.tsx handles routing)
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-gold-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="size-20 bg-ocean-900 border-2 border-gold-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-gold-400/20">
            <span className="material-symbols-outlined text-4xl text-gold-400">water_drop</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Ocean Samurai</h1>
          <p className="text-slate-400">Rewards & Loyalty Program</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin('google')}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>

          <button
            onClick={() => handleLogin('apple')}
            disabled={loading}
            className="w-full bg-black hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait border border-white/10"
          >
            <span className="material-symbols-outlined text-[20px]">apple</span>
            Continue with Apple
          </button>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-500">
            By continuing, you agree to our <a href="#" className="underline hover:text-slate-400">Terms</a> and <a href="#" className="underline hover:text-slate-400">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};