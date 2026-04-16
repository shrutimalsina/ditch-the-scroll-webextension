import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNudge, createSharedAuth } from '@ditch-the-scroll/shared';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

export default function App() {
  const [screen, setScreen] = useState('auth');
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [mood, setMood] = useState('calm');
  const [nudge, setNudge] = useState(null);
  const [error, setError] = useState('');

  const auth = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    return createSharedAuth({
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      storage: {
        getItem: (key) => AsyncStorage.getItem(key),
        setItem: (key, value) => AsyncStorage.setItem(key, value),
        removeItem: (key) => AsyncStorage.removeItem(key),
      },
    });
  }, []);

  useEffect(() => {
    if (!auth) return;

    auth.getSession().then(({ data }) => {
      if (data?.session) {
        setSession(data.session);
        setScreen('home');
      }
    });

    const { data } = auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setScreen(nextSession ? 'home' : 'auth');
    });

    return () => data.subscription.unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!session?.user?.id) return;

    (async () => {
      if (!Device.isDevice) return;
      const permissions = await Notifications.getPermissionsAsync();
      let finalStatus = permissions.status;

      if (finalStatus !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = req.status;
      }

      if (finalStatus !== 'granted') return;

      const token = (await Notifications.getDevicePushTokenAsync()).data;
      await fetch(`${API_BASE_URL}/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, token }),
      });
    })();
  }, [session?.user?.id]);

  async function syncUser(user) {
    await fetch(`${API_BASE_URL}/auth/sync-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, email: user.email }),
    });
  }

  async function onAuthSubmit() {
    setError('');
    if (!auth) {
      setError('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    const fn = mode === 'login' ? auth.signIn : auth.signUp;
    const { data, error: authError } = await fn({ email, password });

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data?.user) {
      await syncUser(data.user);
    }
  }

  async function submitMood(nextMood) {
    setMood(nextMood);

    await fetch(`${API_BASE_URL}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session?.user?.id,
        mood: nextMood,
        lastActive: new Date().toISOString(),
      }),
    });

    const response = await fetch(
      `${API_BASE_URL}/nudges?userId=${session?.user?.id}&triggerType=${encodeURIComponent(nextMood === 'stressed' ? 'stressed' : 'default')}`
    );
    const payload = await response.json();
    setNudge(payload?.nudge ?? createNudge({ mood: nextMood }));
    setScreen('nudge');
  }

  if (screen === 'auth') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Card>
          <Text style={styles.title}>Ditch The Scroll</Text>
          <Text style={styles.subtitle}>Gentle interruptions, not guilt.</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Pressable style={styles.primaryButton} onPress={onAuthSubmit}>
            <Text style={styles.primaryButtonText}>
              {mode === 'login' ? 'Login' : 'Sign up'}
            </Text>
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.link}>
              {mode === 'login'
                ? 'Need an account? Sign up'
                : 'Already have an account? Login'}
            </Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Card>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  if (screen === 'mood') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Card>
          <Text style={styles.title}>How are you feeling?</Text>
          <View style={styles.row}>
            {['calm', 'stressed', 'tired'].map((item) => (
              <Pressable key={item} style={styles.moodChip} onPress={() => submitMood(item)}>
                <Text style={styles.moodText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setScreen('home')}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </Card>
      </SafeAreaView>
    );
  }

  if (screen === 'nudge') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fullScreenNudge}>
          <Text style={styles.nudgeTitle}>A Small Pause</Text>
          <Text style={styles.nudgeText}>{nudge?.message}</Text>
          <Text style={styles.nudgeAction}>Next step: {nudge?.action}</Text>
          <Pressable style={styles.primaryButton} onPress={() => setScreen('home')}>
            <Text style={styles.primaryButtonText}>I’ll do this now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Card>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>{session?.user?.email}</Text>
        <Text style={styles.subtitle}>No infinite feed. Just focused steps.</Text>

        <Pressable style={styles.primaryButton} onPress={() => setScreen('mood')}>
          <Text style={styles.primaryButtonText}>Mood check-in</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={async () => {
            const response = await fetch(
              `${API_BASE_URL}/nudges?userId=${session?.user?.id}`
            );
            const payload = await response.json();
            setNudge(payload?.nudge);
            setScreen('nudge');
          }}
        >
          <Text style={styles.secondaryButtonText}>Show nudge</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            await auth?.signOut();
            setScreen('auth');
          }}
        >
          <Text style={styles.link}>Log out</Text>
        </Pressable>
      </Card>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf6ec',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    gap: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4a2f20',
  },
  subtitle: {
    color: '#7a5d4a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e4d4c7',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fffaf5',
  },
  primaryButton: {
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#f97316',
    fontWeight: '700',
  },
  link: {
    color: '#8a6140',
    textAlign: 'center',
    marginTop: 4,
  },
  error: {
    color: '#dc2626',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  moodChip: {
    backgroundColor: '#ffedd5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  moodText: {
    color: '#7c2d12',
    fontWeight: '600',
  },
  fullScreenNudge: {
    flex: 1,
    backgroundColor: '#fff7ed',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  nudgeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#7c2d12',
  },
  nudgeText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#5b371f',
  },
  nudgeAction: {
    color: '#7a5d4a',
  },
});
