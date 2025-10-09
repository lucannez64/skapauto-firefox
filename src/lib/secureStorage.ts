// AES-GCM secure storage wrapper using Web Crypto

export type SecureStorageKey = CryptoKey | null;

let key: SecureStorageKey = null;
// One-hour TTL for the persisted encryption key
const KEY_TTL_MS = 60 * 60 * 1000;

async function importKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

async function getPersistedKeyBytes(): Promise<Uint8Array | null> {
  const res = await browser.storage.local.get('secureStorageKey');
  const stored = res['secureStorageKey'];
  if (!stored || !stored.bytes) return null;
  // Enforce TTL: remove if older than one hour
  const ts: number | undefined = stored.ts;
  if (typeof ts === 'number' && Date.now() - ts > KEY_TTL_MS) {
    await browser.storage.local.remove('secureStorageKey');
    return null;
  }
  try {
    return new Uint8Array(stored.bytes);
  } catch {
    return null;
  }
}

async function persistKeyBytes(raw: Uint8Array): Promise<void> {
  await browser.storage.local.set({ secureStorageKey: { bytes: Array.from(raw), ts: Date.now() } });
}

export async function ensureKey(): Promise<CryptoKey> {
  if (key) return key;
  const persisted = await getPersistedKeyBytes();
  if (persisted) {
    key = await importKey(persisted.buffer);
    return key!;
  }
  const raw = crypto.getRandomValues(new Uint8Array(32));
  await persistKeyBytes(raw);
  key = await importKey(raw.buffer);
  return key!;
}

export function wipeKey(): void {
  key = null;
  // Best-effort removal of persisted key; ignore promise
  void browser.storage.local.remove('secureStorageKey');
}

// Remove persisted key immediately if expired and set a timer to wipe at TTL
export async function enforceKeyTTL(): Promise<void> {
  const res = await browser.storage.local.get('secureStorageKey');
  const stored = res['secureStorageKey'];
  if (!stored || !stored.ts) return;
  const ts: number = stored.ts;
  const age = Date.now() - ts;
  if (age > KEY_TTL_MS) {
    wipeKey();
    return;
  }
}

export async function scheduleKeyExpiry(): Promise<void> {
  const res = await browser.storage.local.get('secureStorageKey');
  const stored = res['secureStorageKey'];
  if (!stored || !stored.ts) return;
  const ts: number = stored.ts;
  const age = Date.now() - ts;
  const remaining = KEY_TTL_MS - age;
  if (remaining <= 0) {
    wipeKey();
    return;
  }
  // Schedule wipe; bounded to max 1 hour
  setTimeout(() => {
    wipeKey();
  }, Math.min(remaining, KEY_TTL_MS));
}

async function encrypt(data: Uint8Array): Promise<{ iv: Uint8Array; ct: Uint8Array }> {
  const k = await ensureKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, data);
  return { iv, ct: new Uint8Array(ctBuf) };
}

async function decrypt(iv: Uint8Array, ct: Uint8Array): Promise<Uint8Array> {
  const k = await ensureKey();
  const ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, ct);
  return new Uint8Array(ptBuf);
}

// Typed array-safe JSON serialization helpers
function jsonReplacer(key: string, value: any): any {
  if (value instanceof Uint8Array) {
    return { __type: 'u8', bytes: Array.from(value) };
  }
  return value;
}

function looksLikeUint8Object(obj: any): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  for (const k of keys) {
    if (!/^\d+$/.test(k)) return false;
    const v = (obj as any)[k];
    if (typeof v !== 'number' || v < 0 || v > 255) return false;
  }
  return true;
}

function reviveMaybeUint8(value: any): any {
  if (value && typeof value === 'object') {
    if (!Array.isArray(value) && (value as any).__type === 'u8' && Array.isArray((value as any).bytes)) {
      return new Uint8Array((value as any).bytes);
    }
    if (looksLikeUint8Object(value)) {
      const keys = Object.keys(value).map(k => parseInt(k, 10)).sort((a, b) => a - b);
      const arr = keys.map(k => (value as any)[String(k)]);
      return new Uint8Array(arr);
    }
  }
  return value;
}

function jsonReviver(key: string, value: any): any {
  return reviveMaybeUint8(value);
}

export async function setEncrypted(keyName: string, obj: unknown): Promise<void> {
  // Validation des paramètres d'entrée
  if (!keyName || typeof keyName !== 'string') {
    throw new Error('Nom de clé invalide');
  }
  
  const json = JSON.stringify(obj, jsonReplacer);
  const bytes = new TextEncoder().encode(json);
  const { iv, ct } = await encrypt(bytes);
  const payload = {
    iv: Array.from(iv),
    ct: Array.from(ct),
    ts: Date.now(),
    version: 1 // Version pour la compatibilité future
  };
  await browser.storage.local.set({ [keyName]: payload });
}

export async function getDecrypted<T>(keyName: string): Promise<T | null> {
  // Validation des paramètres d'entrée
  if (!keyName || typeof keyName !== 'string') {
    throw new Error('Nom de clé invalide');
  }
  
  const res = await browser.storage.local.get(keyName);
  const payload = res[keyName];
  if (!payload || !payload.iv || !payload.ct) return null;
  
  // Vérification de l'intégrité du payload
  if (!Array.isArray(payload.iv) || !Array.isArray(payload.ct)) {
    console.warn('Payload corrompu détecté pour', keyName);
    await browser.storage.local.remove(keyName);
    return null;
  }
  
  const iv = new Uint8Array(payload.iv);
  const ct = new Uint8Array(payload.ct);
  try {
    const pt = await decrypt(iv, ct);
    const json = new TextDecoder().decode(pt);
    
    // Validation supplémentaire du JSON avant parsing
    if (!json || typeof json !== 'string' || json.length > 1000000) {
      throw new Error('JSON invalide ou trop volumineux');
    }
    
    return JSON.parse(json, jsonReviver) as T;
  } catch (e) {
    console.warn('Decryption failed for', keyName, e);
    // Remove invalid payload to allow fresh storage with a valid key
    await browser.storage.local.remove(keyName);
    return null;
  }
}

export async function remove(keyName: string): Promise<void> {
  await browser.storage.local.remove(keyName);
}