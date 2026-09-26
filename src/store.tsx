import React, { createContext, use, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Portfolio, Article } from '../shared/types';
import { demo, demoNews } from './demo';
import { api, restoreToken, saveToken } from './api';
type Theme = 'dark' | 'light' | 'system';
type User = { id: string; name: string; email: string };
function useModel() {
  const system = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [portfolio, setPortfolio] = useState<Portfolio>(demo);
  const [articles, setArticles] = useState<Article[]>(demoNews);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setDemo] = useState(true);
  const dark = theme === 'system' ? system !== 'light' : theme === 'dark';
  const colors = dark
    ? {
        bg: '#101310',
        panel: '#191e19',
        panel2: '#202620',
        border: '#2c342b',
        text: '#f1f4e9',
        muted: '#8e998a',
        accent: '#c5f277',
        accentText: '#1b2910',
        red: '#f99493',
      }
    : {
        bg: '#f4f5ed',
        panel: '#ffffff',
        panel2: '#eaeee1',
        border: '#dce1d2',
        text: '#202b1b',
        muted: '#727e67',
        accent: '#507724',
        accentText: '#ffffff',
        red: '#bd4849',
      };
  async function load() {
    const data = await api<Portfolio>('/portfolio');
    setPortfolio(data);
    setDemo(false);
    setArticles([]);
    api<{ articles: Article[] }>('/news')
      .then((d) => setArticles(d.articles))
      .catch(() => {});
  }
  useEffect(() => {
    AsyncStorage.getItem('growth-theme').then((t) => {
      if (t === 'dark' || t === 'light' || t === 'system') setThemeState(t);
    });
    restoreToken()
      .then(() => api<{ user: User; theme: Theme }>('/auth/me'))
      .then(async (d) => {
        setUser(d.user);
        setThemeState(d.theme);
        await load();
      })
      .catch(() => {});
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function authenticate(email: string, password: string, name: string, register: boolean) {
    await run(async () => {
      const d = await api<{ user: User; token: string }>(
        register ? '/auth/register' : '/auth/login',
        { email, password, name },
      );
      await saveToken(d.token);
      setUser(d.user);
      await load();
    });
  }
  async function logout() {
    await run(async () => {
      await api('/auth/logout', {});
      await saveToken(null);
      setUser(null);
      setDemo(true);
      setPortfolio(demo);
      setArticles(demoNews);
    });
  }
  async function setTheme(t: Theme) {
    setThemeState(t);
    await AsyncStorage.setItem('growth-theme', t);
    if (user)
      await run(async () => {
        await api('/preferences', { theme: t }, 'PATCH');
      });
  }
  async function favorite(id: string) {
    const previous = portfolio.favorites;
    const next = previous.includes(id) ? previous.filter((x) => x !== id) : [...previous, id];
    setPortfolio((p) => ({ ...p, favorites: next }));
    if (user)
      try {
        await api('/favorites', { id, active: next.includes(id) }, 'PUT');
      } catch (e) {
        setPortfolio((p) => ({ ...p, favorites: previous }));
        setError(String(e));
      }
  }
  async function sync() {
    await run(async () => {
      await api('/sync', {});
      await load();
    });
  }
  return {
    theme,
    setTheme,
    colors,
    dark,
    portfolio,
    articles,
    user,
    busy,
    error,
    setError,
    isDemo,
    authenticate,
    logout,
    favorite,
    sync,
    run,
    load,
  };
}
const Context = createContext<ReturnType<typeof useModel> | null>(null);
export function Provider({ children }: { children: React.ReactNode }) {
  const model = useModel();
  return <Context value={model}>{children}</Context>;
}
export function useApp() {
  return use(Context)!;
}
