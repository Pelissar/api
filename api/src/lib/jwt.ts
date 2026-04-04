import jwt from 'jsonwebtoken'
import { env } from './env.js'

export interface AccessTokenPayload {
  sub: string
  tenantId: string
  role: string
  email: string
}

export interface RefreshTokenPayload {
  sub: string
  tenantId: string
  type: 'refresh'
}

export interface PortalAccessTokenPayload {
  sub: string
  tenantId: string
  clientId: string
  email: string
  type: 'portal-access'
}

export interface PortalRefreshTokenPayload {
  sub: string
  tenantId: string
  clientId: string
  type: 'portal-refresh'
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.JWT_ACCESS_EXPIRES_MINUTES}m`
  })
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d`
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}

export function signPortalAccessToken(payload: PortalAccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.JWT_ACCESS_EXPIRES_MINUTES}m`
  })
}

export function signPortalRefreshToken(payload: PortalRefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d`
  })
}

export function verifyPortalAccessToken(token: string): PortalAccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as PortalAccessTokenPayload
}

export function verifyPortalRefreshToken(token: string): PortalRefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as PortalRefreshTokenPayload
}

