import { z } from 'zod';
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const clientSchema: z.ZodObject<{
    name: z.ZodString;
    tradeName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cpfCnpj: z.ZodString;
    email: z.ZodNullable<z.ZodOptional<z.ZodEmail>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    zipCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        ATIVO: "ATIVO";
        INATIVO: "INATIVO";
    }>>;
}, z.core.$strip>;
export declare const planSchema: z.ZodObject<{
    name: z.ZodString;
    interval: z.ZodEnum<{
        MENSAL: "MENSAL";
        ANUAL: "ANUAL";
    }>;
    price: z.ZodCoercedNumber<unknown>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    deviceLimit: z.ZodCoercedNumber<unknown>;
    features: z.ZodDefault<z.ZodArray<z.ZodString>>;
    enabledEditions: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        EMPRESARIAL: "EMPRESARIAL";
        RESTAURANTE: "RESTAURANTE";
    }>>>;
    status: z.ZodDefault<z.ZodEnum<{
        ATIVO: "ATIVO";
        INATIVO: "INATIVO";
    }>>;
}, z.core.$strip>;
export declare const licenseSchema: z.ZodObject<{
    clientId: z.ZodString;
    planId: z.ZodString;
    type: z.ZodEnum<{
        MENSAL: "MENSAL";
        ANUAL: "ANUAL";
    }>;
    status: z.ZodDefault<z.ZodEnum<{
        ATIVA: "ATIVA";
        SUSPENSA: "SUSPENSA";
        EXPIRADA: "EXPIRADA";
        CANCELADA: "CANCELADA";
        TESTE: "TESTE";
    }>>;
    expiresAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    activatedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    devicesAllowed: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    minVersion: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    maxVersion: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    canUpdate: z.ZodDefault<z.ZodBoolean>;
    canUseBeta: z.ZodDefault<z.ZodBoolean>;
    enabledEditions: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        EMPRESARIAL: "EMPRESARIAL";
        RESTAURANTE: "RESTAURANTE";
    }>>>;
}, z.core.$strip>;
export declare const licenseActivationSchema: z.ZodObject<{
    licenseCode: z.ZodString;
    deviceFingerprint: z.ZodString;
    deviceName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    appVersion: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const licenseValidationSchema: z.ZodObject<{
    licenseCode: z.ZodString;
    deviceFingerprint: z.ZodString;
    deviceName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    appVersion: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const appVersionSchema: z.ZodObject<{
    version: z.ZodString;
    buildNumber: z.ZodCoercedNumber<unknown>;
    releaseNotes: z.ZodString;
    releaseChannel: z.ZodDefault<z.ZodEnum<{
        STABLE: "STABLE";
        BETA: "BETA";
    }>>;
    isMandatory: z.ZodDefault<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    targetPlanIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    targetLicenseIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    allowAllActiveLicenses: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const adminUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        ADMIN: "ADMIN";
        SUPORTE: "SUPORTE";
        REVENDEDOR: "REVENDEDOR";
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const portalRegisterSchema: z.ZodObject<{
    licenseCode: z.ZodString;
    companyName: z.ZodString;
    tradeName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cpfCnpj: z.ZodString;
    email: z.ZodEmail;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    zipCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const portalLoginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
    licenseCode: z.ZodString;
}, z.core.$strip>;
export declare const portalRefreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const portalPasswordResetRequestSchema: z.ZodObject<{
    email: z.ZodEmail;
}, z.core.$strip>;
export declare const portalAdminResetPasswordSchema: z.ZodObject<{
    password: z.ZodString;
}, z.core.$strip>;
export declare const portalUserStatusSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
    mustResetPassword: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const supportTicketCreateSchema: z.ZodObject<{
    subject: z.ZodString;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodDefault<z.ZodEnum<{
        BAIXA: "BAIXA";
        NORMAL: "NORMAL";
        ALTA: "ALTA";
        URGENTE: "URGENTE";
    }>>;
    message: z.ZodString;
}, z.core.$strip>;
export declare const supportTicketReplySchema: z.ZodObject<{
    message: z.ZodString;
}, z.core.$strip>;
export declare const supportTicketStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        ABERTO: "ABERTO";
        EM_ATENDIMENTO: "EM_ATENDIMENTO";
        AGUARDANDO_CLIENTE: "AGUARDANDO_CLIENTE";
        RESOLVIDO: "RESOLVIDO";
        FECHADO: "FECHADO";
    }>;
}, z.core.$strip>;
export declare const portalUserCreateSchema: z.ZodObject<{
    clientId: z.ZodString;
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    mustResetPassword: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateCheckSchema: z.ZodObject<{
    licenseCode: z.ZodString;
    deviceFingerprint: z.ZodString;
    currentVersion: z.ZodString;
    releaseChannel: z.ZodDefault<z.ZodEnum<{
        STABLE: "STABLE";
        BETA: "BETA";
    }>>;
}, z.core.$strip>;
export declare const renewLicenseSchema: z.ZodObject<{
    days: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
