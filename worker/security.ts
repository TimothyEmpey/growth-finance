const encoder = new TextEncoder();
export const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, '0')).join('');
export const hash = async (value: string) =>
  hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
export const random = () => hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
export async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return hex(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
      key,
      256,
    ),
  );
}
export function equal(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
async function encryptionKey(secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error('Encryption key is not configured');
  return crypto.subtle.importKey(
    'raw',
    Uint8Array.from(secret.match(/../g)!, (x) => parseInt(x, 16)),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  );
}
export async function encrypt(value: string, secret: string, owner: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const result = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(owner) },
    await encryptionKey(secret),
    encoder.encode(value),
  );
  return `${hex(iv.buffer)}.${hex(result)}`;
}
export async function decrypt(value: string, secret: string, owner: string) {
  const [iv, data] = value
    .split('.')
    .map((s) => Uint8Array.from(s.match(/../g)!, (x) => parseInt(x, 16)));
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: encoder.encode(owner) },
      await encryptionKey(secret),
      data,
    ),
  );
}
