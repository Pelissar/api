export declare const adminRoles: readonly ["ADMIN", "SUPORTE", "REVENDEDOR"];
export declare const clientStatuses: readonly ["ATIVO", "INATIVO"];
export declare const planIntervals: readonly ["MENSAL", "ANUAL"];
export declare const planStatuses: readonly ["ATIVO", "INATIVO"];
export declare const licenseTypes: readonly ["MENSAL", "ANUAL"];
export declare const licenseStatuses: readonly ["ATIVA", "SUSPENSA", "EXPIRADA", "CANCELADA", "TESTE"];
export declare const releaseChannels: readonly ["STABLE", "BETA"];
export declare const appEditions: readonly ["EMPRESARIAL", "RESTAURANTE"];
export declare const portalUserStatuses: readonly ["ATIVO", "INATIVO"];
export declare const supportTicketStatuses: readonly ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE", "RESOLVIDO", "FECHADO"];
export declare const supportTicketPriorities: readonly ["BAIXA", "NORMAL", "ALTA", "URGENTE"];
export declare const supportTicketSenderTypes: readonly ["CLIENTE", "ADMIN"];
export type AdminRole = (typeof adminRoles)[number];
export type ClientStatus = (typeof clientStatuses)[number];
export type PlanInterval = (typeof planIntervals)[number];
export type PlanStatus = (typeof planStatuses)[number];
export type LicenseType = (typeof licenseTypes)[number];
export type LicenseStatus = (typeof licenseStatuses)[number];
export type ReleaseChannel = (typeof releaseChannels)[number];
export type AppEdition = (typeof appEditions)[number];
export type PortalUserStatus = (typeof portalUserStatuses)[number];
export type SupportTicketStatus = (typeof supportTicketStatuses)[number];
export type SupportTicketPriority = (typeof supportTicketPriorities)[number];
export type SupportTicketSenderType = (typeof supportTicketSenderTypes)[number];
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface AdminUserDto {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: AdminRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface DashboardMetricsDto {
    totalClients: number;
    totalPortalUsers: number;
    totalPlans: number;
    totalLicenses: number;
    activeLicenses: number;
    suspendedLicenses: number;
    expiredLicenses: number;
    expiringIn7Days: number;
    totalVersions: number;
    updatableLicenses: number;
    openTickets: number;
    recentClients: Array<{
        id: string;
        name: string;
        email: string | null;
        createdAt: string;
    }>;
    recentLicenses: Array<{
        id: string;
        code: string;
        status: LicenseStatus;
        clientName: string;
        expiresAt: string | null;
    }>;
    recentVersions: Array<{
        id: string;
        version: string;
        channel: ReleaseChannel;
        createdAt: string;
    }>;
    recentTickets: Array<{
        id: string;
        subject: string;
        status: SupportTicketStatus;
        clientName: string;
        createdAt: string;
    }>;
}
export interface PortalUserDto {
    id: string;
    tenantId: string;
    clientId: string;
    name: string;
    email: string;
    isActive: boolean;
    mustResetPassword: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    client?: {
        id: string;
        name: string;
        tradeName: string | null;
        cpfCnpj: string;
    };
}
export interface SupportTicketDto {
    id: string;
    tenantId: string;
    clientId: string;
    portalUserId: string | null;
    subject: string;
    category: string | null;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    client?: {
        id: string;
        name: string;
        tradeName: string | null;
        cpfCnpj: string;
    };
    portalUser?: {
        id: string;
        name: string;
        email: string;
    } | null;
    messages?: SupportTicketMessageDto[];
}
export interface SupportTicketMessageDto {
    id: string;
    ticketId: string;
    senderType: SupportTicketSenderType;
    message: string;
    createdAt: string;
    adminUser?: {
        id: string;
        name: string;
        email: string;
    } | null;
    portalUser?: {
        id: string;
        name: string;
        email: string;
    } | null;
}
