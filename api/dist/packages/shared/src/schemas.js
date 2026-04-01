import { z } from 'zod';
import { adminRoles, appEditions, clientStatuses, licenseStatuses, licenseTypes, planIntervals, planStatuses, releaseChannels, supportTicketPriorities, supportTicketStatuses } from './types';
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z.string().trim().optional()
});
export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8)
});
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(20)
});
export const clientSchema = z.object({
    name: z.string().trim().min(2),
    tradeName: z.string().trim().optional().nullable(),
    cpfCnpj: z.string().trim().min(11),
    email: z.email().optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    address: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    state: z.string().trim().optional().nullable(),
    zipCode: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    status: z.enum(clientStatuses).default('ATIVO')
});
export const planSchema = z.object({
    name: z.string().trim().min(2),
    interval: z.enum(planIntervals),
    price: z.coerce.number().min(0),
    description: z.string().trim().optional().nullable(),
    deviceLimit: z.coerce.number().int().min(1),
    features: z.array(z.string().trim().min(1)).default([]),
    enabledEditions: z.array(z.enum(appEditions)).min(1).default(['EMPRESARIAL']),
    status: z.enum(planStatuses).default('ATIVO')
});
export const licenseSchema = z.object({
    clientId: z.string().uuid(),
    planId: z.string().uuid(),
    type: z.enum(licenseTypes),
    status: z.enum(licenseStatuses).default('ATIVA'),
    expiresAt: z.string().datetime().optional().nullable(),
    activatedAt: z.string().datetime().optional().nullable(),
    devicesAllowed: z.coerce.number().int().min(1).default(1),
    notes: z.string().trim().optional().nullable(),
    minVersion: z.string().trim().optional().nullable(),
    maxVersion: z.string().trim().optional().nullable(),
    canUpdate: z.boolean().default(true),
    canUseBeta: z.boolean().default(false),
    enabledEditions: z.array(z.enum(appEditions)).min(1).default(['EMPRESARIAL'])
});
export const licenseActivationSchema = z.object({
    licenseCode: z.string().trim().min(8),
    deviceFingerprint: z.string().trim().min(8),
    deviceName: z.string().trim().optional().nullable(),
    appVersion: z.string().trim().optional().nullable()
});
export const licenseValidationSchema = licenseActivationSchema;
export const appVersionSchema = z.object({
    version: z.string().trim().min(3),
    buildNumber: z.coerce.number().int().min(1),
    releaseNotes: z.string().trim().min(1),
    releaseChannel: z.enum(releaseChannels).default('STABLE'),
    isMandatory: z.boolean().default(false),
    isActive: z.boolean().default(true),
    targetPlanIds: z.array(z.string().uuid()).default([]),
    targetLicenseIds: z.array(z.string().uuid()).default([]),
    allowAllActiveLicenses: z.boolean().default(true)
});
export const adminUserSchema = z.object({
    name: z.string().trim().min(2),
    email: z.email(),
    password: z.string().min(8),
    role: z.enum(adminRoles).default('ADMIN'),
    isActive: z.boolean().default(true)
});
export const portalRegisterSchema = z.object({
    licenseCode: z.string().trim().min(8),
    companyName: z.string().trim().min(2),
    tradeName: z.string().trim().optional().nullable(),
    cpfCnpj: z.string().trim().min(11),
    email: z.email(),
    phone: z.string().trim().optional().nullable(),
    address: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    state: z.string().trim().optional().nullable(),
    zipCode: z.string().trim().optional().nullable(),
    name: z.string().trim().min(2),
    password: z.string().min(8)
});
export const portalLoginSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    licenseCode: z.string().trim().min(8)
});
export const portalRefreshSchema = z.object({
    refreshToken: z.string().min(20)
});
export const portalPasswordResetRequestSchema = z.object({
    email: z.email()
});
export const portalAdminResetPasswordSchema = z.object({
    password: z.string().min(8)
});
export const portalUserStatusSchema = z.object({
    isActive: z.boolean(),
    mustResetPassword: z.boolean().optional().default(false)
});
export const supportTicketCreateSchema = z.object({
    subject: z.string().trim().min(3),
    category: z.string().trim().optional().nullable(),
    priority: z.enum(supportTicketPriorities).default('NORMAL'),
    message: z.string().trim().min(3)
});
export const supportTicketReplySchema = z.object({
    message: z.string().trim().min(1)
});
export const supportTicketStatusSchema = z.object({
    status: z.enum(supportTicketStatuses)
});
export const portalUserCreateSchema = z.object({
    clientId: z.string().uuid(),
    name: z.string().trim().min(2),
    email: z.email(),
    password: z.string().min(8),
    isActive: z.boolean().default(true),
    mustResetPassword: z.boolean().default(false)
});
export const updateCheckSchema = z.object({
    licenseCode: z.string().trim().min(8),
    deviceFingerprint: z.string().trim().min(8),
    currentVersion: z.string().trim().min(1),
    releaseChannel: z.enum(releaseChannels).default('STABLE')
});
export const renewLicenseSchema = z.object({
    days: z.coerce.number().int().min(1).max(3650)
});
