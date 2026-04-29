import crypto from 'node:crypto';
import { env } from './env.js';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
function buildKey() {
    const secret = env.CONFIG_ENCRYPTION_SECRET || env.JWT_REFRESH_SECRET;
    return crypto.createHash('sha256').update(secret).digest();
}
export function encryptSecret(value) {
    if (!value)
        return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, buildKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}
export function decryptSecret(value) {
    if (!value)
        return null;
    const [ivBase64, tagBase64, encryptedBase64] = value.split(':');
    if (!ivBase64 || !tagBase64 || !encryptedBase64) {
        return value;
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, buildKey(), Buffer.from(ivBase64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, 'base64')),
        decipher.final()
    ]);
    return decrypted.toString('utf8');
}
export function maskSecret(value) {
    if (!value)
        return null;
    const trimmed = value.trim();
    if (trimmed.length <= 8) {
        return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
    }
    return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}
