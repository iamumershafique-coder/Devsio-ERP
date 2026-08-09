/**
 * AES-256-GCM Web Crypto Encryption Utility for Devsio ERP Encrypted Database Backups
 */

// Derive AES-GCM 256-bit key from password using PBKDF2
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(uint8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export interface EncryptedBackupContainer {
  format: 'DEVSIO_ENCRYPTED_BACKUP_V1';
  timestamp: string;
  app: string;
  version: string;
  saltHex: string;
  ivHex: string;
  cipherTextHex: string;
}

export async function encryptBackupData(
  data: any,
  passphrase: string
): Promise<EncryptedBackupContainer> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await getKey(passphrase, salt);
  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  return {
    format: 'DEVSIO_ENCRYPTED_BACKUP_V1',
    timestamp: new Date().toISOString(),
    app: 'Devsio Services ERP',
    version: '2.4',
    saltHex: bufferToHex(salt),
    ivHex: bufferToHex(iv),
    cipherTextHex: bufferToHex(cipherBuffer),
  };
}

export async function decryptBackupData(
  container: EncryptedBackupContainer,
  passphrase: string
): Promise<any> {
  if (container.format !== 'DEVSIO_ENCRYPTED_BACKUP_V1') {
    throw new Error('Invalid or unsupported backup format.');
  }

  const salt = hexToBuffer(container.saltHex);
  const iv = hexToBuffer(container.ivHex);
  const cipherBuffer = hexToBuffer(container.cipherTextHex);

  const key = await getKey(passphrase, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBuffer
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString);
}

export function downloadEncryptedBackupFile(container: EncryptedBackupContainer, filename?: string) {
  const jsonStr = JSON.stringify(container, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    filename || `devsio_erp_encrypted_backup_${new Date().toISOString().split('T')[0]}.enc`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
