import jwt from 'jsonwebtoken';
import { env } from './env';
export function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: `${env.JWT_ACCESS_EXPIRES_MINUTES}m`
    });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d`
    });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
export function signPortalAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: `${env.JWT_ACCESS_EXPIRES_MINUTES}m`
    });
}
export function signPortalRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d`
    });
}
export function verifyPortalAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function verifyPortalRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
