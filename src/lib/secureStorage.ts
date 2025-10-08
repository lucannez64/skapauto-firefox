// AES-GCM secure storage wrapper using Web Crypto

export type SecureStorageKey = CryptoKey | null;

let key: SecureStorageKey = null;

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
  try {
    return new Uint8Array(stored.bytes);
  } catch {
    return null;
  }
}

async function persistKeyBytes(raw: Uint8Array): Promise<void> {
  await browser.storage.local.set({ secureStorageKey: { bytes: Array.from(raw) } });
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
  const json = JSON.stringify(obj, jsonReplacer);
  const bytes = new TextEncoder().encode(json);
  const { iv, ct } = await encrypt(bytes);
  const payload = {
    iv: Array.from(iv),
    ct: Array.from(ct),
    ts: Date.now()
  };
  await browser.storage.local.set({ [keyName]: payload });
}

export async function getDecrypted<T>(keyName: string): Promise<T | null> {
  const res = await browser.storage.local.get(keyName);
  const payload = res[keyName];
  if (!payload || !payload.iv || !payload.ct) return null;
  const iv = new Uint8Array(payload.iv);
  const ct = new Uint8Array(payload.ct);
  try {
    const pt = await decrypt(iv, ct);
    const json = new TextDecoder().decode(pt);
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