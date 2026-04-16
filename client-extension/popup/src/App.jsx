import './App.css';
import { Coffee, ChartColumn, Settings, Bell, LogOut } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { createSharedAuth, createWebStorageAdapter } from '@ditch-the-scroll/shared';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');

function App() {
  const [scrollTime, setScrollTime] = useState(0);
  const [currentSite, setCurrentSite] = useState('No site');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;

    return createSharedAuth({
      supabaseUrl,
      supabaseAnonKey,
      storage: createWebStorageAdapter(),
    });
  }, []);

  useEffect(() => {
    if (!auth) return;

    auth.getSession().then(({ data }) => {
      if (data?.session) {
        setSession(data.session);
        chrome.storage.local.set({ authUserId: data.session.user.id });
      }
    });

    const { data } = auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      chrome.storage.local.set({ authUserId: nextSession?.user?.id || null });
    });

    return () => data.subscription.unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!chrome?.storage?.local) return;

    chrome.storage.local.get(['scrollTime', 'currentSite'], (result) => {
      setScrollTime(result.scrollTime ?? 0);
      setCurrentSite(result.currentSite ?? 'No site');
    });

    // Defined inside the effect so the same reference is used for both
    // addListener and removeListener — avoids the stale-closure lint warning
    // and ensures clean removal even if the component re-renders.
    function handleChange(changes, areaName) {
      if (areaName !== 'local') return;
      if (changes.scrollTime) setScrollTime(changes.scrollTime.newValue ?? 0);
      if (changes.currentSite) setCurrentSite(changes.currentSite.newValue ?? 'No site');
    }

    chrome.storage.onChanged.addListener(handleChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    try {
      chrome.runtime.sendMessage({ type: 'POPUP_OPENED' }, () => {});
    } catch (e) {
      console.warn('Failed to send POPUP_OPENED message:', e);
    }
  }, []);

  async function submitAuth() {
    setAuthError('');
    setAuthInfo('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    if (!auth) {
      setAuthError('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to sign in.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fn = authMode === 'login' ? auth.signIn : auth.signUp;
      const { data, error } = await fn({ email: normalizedEmail, password });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (data?.user) {
        try {
          const response = await fetch(`${apiBaseUrl}/auth/sync-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.user.id, email: data.user.email }),
          });

          if (!response.ok) {
            setAuthInfo('Signed in, but backend sync failed. Check API server status.');
          }
        } catch {
          setAuthInfo('Signed in, but backend sync failed. Check API server status.');
        }
      }

      if (authMode === 'signup') {
        if (!data?.session) {
          setAuthInfo('Signup successful. Confirm your email, then log in.');
          setAuthMode('login');
          setPassword('');
          return;
        }

        setAuthInfo('Signup successful.');
        return;
      }

      setAuthInfo('Login successful.');
    } catch {
      setAuthError('Unable to complete authentication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!session) {
    const authSubmitLabel = isSubmitting
      ? 'Please wait...'
      : authMode === 'login'
        ? 'Login'
        : 'Sign up';

    return (
      <div className="everything font-[Iosevka_Charon] text-center w-96 min-h-[28rem] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-rose-200 p-6 gap-4 bg-[#fdf6ec]">
        <h1 className="font-[Dancing_Script] text-4xl">Ditch The Scroll</h1>
        <p className="text-sm text-stone-600">Sign in to sync nudges across extension + mobile.</p>
        <div className="bg-white/70 rounded-xl p-3 flex flex-col gap-2">
        <input
          className="rounded-xl border border-rose-200 p-2 bg-white"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded-xl border border-rose-200 p-2 bg-white"
          placeholder="Password"
          type="password"
          autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        </div>
        <button
          className="rounded-full bg-orange-500 text-white py-2 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={submitAuth}
          disabled={isSubmitting}
        >
          {authSubmitLabel}
        </button>
        <button
          className="text-xs text-stone-600"
          onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
        >
          {authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
        {!!authError && <p className="text-xs text-red-600">{authError}</p>}
        {!!authInfo && <p className="text-xs text-emerald-700">{authInfo}</p>}
      </div>
    );
  }

  return (
    <div className="everything font-[Iosevka_Charon] text-2xl text-center w-96 min-h-[28rem] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-rose-200">
      <div className="h-1 bg-gradient-to-r from-rose-300 via-rose-500 to-rose-300"></div>
      <div className="header bg-gradient-to-r from-rose-200 to-rose-100 text-black-900 p-5 relative">
        <h1 className="font-[Dancing_Script] text-4xl relative z-10 drop-shadow-sm">Ditch The Scroll</h1>
      </div>

      <div className="greeting flex-1 bg-gradient-to-b from-[#f5f0e6] to-[#e8e0d5] text-gray-700 p-6 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-2xl">Hello</span>
          <span className="font-[Dancing_Script] text-3xl">{session.user.email.split('@')[0]}!</span>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-inner">
          <p className="text-gray-800">You've been scrolling on {currentSite} for</p>
          <p className="text-4xl font-bold text-rose-500 animate-pulse mt-1">
            {scrollTime}
            <span className="text-2xl ml-1">mins</span>
          </p>
        </div>
      </div>

      <div className="nudge bg-[#f5f0e6] text-gray-800 p-5 border-y-2 border-rose-200">
        <div className="flex items-center justify-center gap-3">
          <Bell size={24} className="text-rose-500" />
          <h3 className="font-medium">Nudge sync is active</h3>
          <Bell size={24} className="text-rose-500" />
        </div>
        <p className="text-sm mt-2 text-stone-500">A supportive nudge will appear when needed.</p>
      </div>

      <div className="buttons flex justify-center gap-10 bg-gradient-to-r from-rose-100 to-rose-200 p-5">
        <button className="transform hover:scale-120 transition-all duration-200 hover:drop-shadow-lg">
          <Coffee size={32} color="#44403c" strokeWidth={1.5} />
        </button>
        <button className="transform hover:scale-120 transition-all duration-200 hover:drop-shadow-lg">
          <ChartColumn size={32} color="#44403c" strokeWidth={1.5} />
        </button>
        <button className="transform hover:scale-120 transition-all duration-200 hover:drop-shadow-lg">
          <Settings size={32} color="#44403c" strokeWidth={1.5} />
        </button>
      </div>

      <button
        className="mx-auto mb-3 mt-2 flex items-center gap-2 text-sm text-stone-700"
        onClick={async () => {
          await auth?.signOut();
          chrome.storage.local.set({ authUserId: null });
        }}
      >
        <LogOut size={16} /> Log out
      </button>

      <div className="h-1 bg-gradient-to-r from-rose-300 via-rose-500 to-rose-300"></div>
    </div>
  );
}

export default App;
