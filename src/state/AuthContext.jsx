import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { App as NativeApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { authRedirectUrl, supabase } from '../lib/supabase.js';
import { NATIVE_AUTH_REDIRECT, isNativeApp } from '../lib/platform.js';

/**
 * Sign in with Google or Apple. On the website the page goes to the provider and comes back. In the app,
 * the provider opens in a secure Safari sheet and returns through the app's own link (see the listener below).
 */
async function signInWith(provider) {
  if (!isNativeApp) return supabase.auth.signInWithOAuth({ provider, options: { redirectTo: authRedirectUrl() } });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) return { error };
  await Browser.open({ url: data.url, presentationStyle: 'popover' });
  return { error: null };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  // In the app, sign-in comes back as app.lumipals://auth?code=…: finish it and close the Safari sheet.
  useEffect(() => {
    if (!isNativeApp) return undefined;
    const listener = NativeApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith(NATIVE_AUTH_REDIRECT)) return;
      const code = new URL(url).searchParams.get('code');
      if (code) await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      Browser.close().catch(() => {});
    });
    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);

  // After Google sends the player back, remove ?code=… from the address bar.
  useEffect(() => {
    if (session && window.location.search.includes('code=')) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    }
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('display_name, avatar_url, is_admin').eq('id', userId).maybeSingle();
    setProfile(data ?? null);
  }, [userId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    const meta = user?.user_metadata ?? {};
    return {
      isReady,
      user,
      displayName: profile?.display_name ?? meta.full_name ?? meta.name ?? user?.email ?? '',
      avatarUrl: profile?.avatar_url ?? meta.avatar_url ?? null,
      isAdmin: Boolean(profile?.is_admin),
      refreshProfile,
      signInWithGoogle: () => signInWith('google'),
      signInWithApple: () => signInWith('apple'),
      signOut: () => supabase.auth.signOut(),
      deleteAccount: async () => {
        const { error } = await supabase.rpc('delete_my_account');
        if (error) throw error;
        await supabase.auth.signOut();
      },
    };
  }, [isReady, session, profile, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
