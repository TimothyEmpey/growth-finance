import { fetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
const native = process.env.EXPO_OS !== 'web';
let token: string | null = null;
export const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
export async function restoreToken() {
  if (native) token = await SecureStore.getItemAsync('growth-session');
}
export async function saveToken(value: string | null) {
  token = value;
  if (native) {
    if (value) await SecureStore.setItemAsync('growth-session', value);
    else await SecureStore.deleteItemAsync('growth-session');
  }
}
export async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const response = await fetch(`${apiUrl}/api${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const data = await response
    .json()
    .catch(() => ({ error: 'The server did not return a valid response.' }));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}
