import crypto from 'node:crypto';
export function randomLicenseCode() {
    return `NEX-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}
export function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}
export function addDays(base, days) {
    const result = new Date(base);
    result.setDate(result.getDate() + days);
    return result;
}
export function isExpired(date) {
    if (!date)
        return false;
    return date.getTime() < Date.now();
}
export function safeJsonParse(value, fallback) {
    if (!value)
        return fallback;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
