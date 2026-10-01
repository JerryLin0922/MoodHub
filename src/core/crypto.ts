/**
 * E2EE 加密备份（ROADMAP-2026 阶段三，实验性）。
 *
 * 方案：passphrase → PBKDF2(SHA-256, 310k iterations) → AES-256-GCM。
 * 私钥只由口令在本地派生，加密包仅含 salt/iv/密文，可安全上传到任何
 * 不受信存储；解密仅在用户本机浏览器（Web Crypto，需 secure context）
 * 完成，密钥永不落盘。
 */
const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERATIONS = 310_000;

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedBackup {
  v: 1;
  alg: 'PBKDF2-SHA256+AES-GCM';
  salt: string;
  iv: string;
  data: string;
}

/** 将任意 JSON 可序列化对象加密为字符串（可直接写入 .enc 文件）。 */
export async function encryptBackupJSON(plain: unknown, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(JSON.stringify(plain))
  );
  const box: EncryptedBackup = {
    v: 1,
    alg: 'PBKDF2-SHA256+AES-GCM',
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(cipher),
  };
  return JSON.stringify(box);
}

/** 解密 E2EE 备份字符串。口令错误会抛异常（AES-GCM 认证失败）。 */
export async function decryptBackupJSON(payload: string, passphrase: string): Promise<unknown> {
  const box = JSON.parse(payload) as EncryptedBackup;
  if (!box || box.v !== 1) throw new Error('不是 MoodHub 加密备份文件');
  const key = await deriveKey(passphrase, fromB64(box.salt));
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(box.iv) as BufferSource },
    key,
    fromB64(box.data) as BufferSource
  );
  return JSON.parse(dec.decode(plain));
}
