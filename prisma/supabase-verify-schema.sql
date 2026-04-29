-- Verificacao de estrutura do Supabase
-- Rode este arquivo no SQL Editor para conferir se falta algo no schema cloud.

WITH checks AS (
  SELECT 'ENUM' AS object_type, 'AdminRole' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminRole') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'ClientStatus' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientStatus') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'PlanInterval' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanInterval') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'PlanStatus' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanStatus') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'LicenseType' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenseType') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'LicenseStatus' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenseStatus') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'ReleaseChannel' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReleaseChannel') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'AppEdition' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppEdition') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'DesktopRecordType' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DesktopRecordType') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'SupportTicketStatus' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketStatus') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'SupportTicketPriority' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketPriority') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'SupportTicketSenderType' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketSenderType') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'Tenant' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tenant') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AdminUser' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AdminUser') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'RefreshToken' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RefreshToken') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'PasswordResetToken' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PasswordResetToken') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'Client' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Client') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'Plan' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Plan') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'License' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'License') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'DeviceActivation' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DeviceActivation') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AppVersion' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AppVersion') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AppVersionLicensePermission' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AppVersionLicensePermission') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AppVersionPlanPermission' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AppVersionPlanPermission') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AuditLog' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuditLog') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'PortalUser' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PortalUser') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'PortalRefreshToken' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PortalRefreshToken') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'PortalPasswordResetToken' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PortalPasswordResetToken') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'SupportTicket' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SupportTicket') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'SupportTicketMessage' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SupportTicketMessage') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'DesktopRecord' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DesktopRecord') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Tenant_slug_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Tenant_slug_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AdminUser_email_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AdminUser_email_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'RefreshToken_adminUserId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'RefreshToken_adminUserId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Client_tenantId_name_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Client_tenantId_name_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Client_tenantId_cpfCnpj_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Client_tenantId_cpfCnpj_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Plan_tenantId_name_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Plan_tenantId_name_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Plan_tenantId_name_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Plan_tenantId_name_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'License_code_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'License_code_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'License_tenantId_status_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'License_tenantId_status_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'License_clientId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'License_clientId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'License_planId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'License_planId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'DeviceActivation_deviceFingerprint_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'DeviceActivation_deviceFingerprint_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'DeviceActivation_licenseId_deviceFingerprint_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'DeviceActivation_licenseId_deviceFingerprint_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AppVersion_tenantId_isActive_releaseChannel_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AppVersion_tenantId_isActive_releaseChannel_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AppVersion_tenantId_version_buildNumber_releaseChannel_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AppVersion_tenantId_version_buildNumber_releaseChannel_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AppVersionLicensePermission_appVersionId_licenseId_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AppVersionLicensePermission_appVersionId_licenseId_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AppVersionPlanPermission_appVersionId_planId_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AppVersionPlanPermission_appVersionId_planId_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AuditLog_tenantId_createdAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AuditLog_tenantId_createdAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'PortalUser_tenantId_clientId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'PortalUser_tenantId_clientId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'PortalUser_tenantId_email_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'PortalUser_tenantId_email_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'PortalRefreshToken_portalUserId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'PortalRefreshToken_portalUserId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'SupportTicket_tenantId_status_updatedAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'SupportTicket_tenantId_status_updatedAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'SupportTicket_clientId_createdAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'SupportTicket_clientId_createdAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'SupportTicketMessage_ticketId_createdAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'SupportTicketMessage_ticketId_createdAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'DesktopRecord_tenantId_recordType_updatedAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'DesktopRecord_tenantId_recordType_updatedAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'DesktopRecord_tenantId_isDeleted_updatedAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'DesktopRecord_tenantId_isDeleted_updatedAt_idx') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AdminUser_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AdminUser' AND c.conname = 'AdminUser_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'RefreshToken_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'RefreshToken' AND c.conname = 'RefreshToken_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'RefreshToken_adminUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'RefreshToken' AND c.conname = 'RefreshToken_adminUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PasswordResetToken_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PasswordResetToken' AND c.conname = 'PasswordResetToken_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PasswordResetToken_adminUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PasswordResetToken' AND c.conname = 'PasswordResetToken_adminUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'Client_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'Client' AND c.conname = 'Client_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'Plan_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'Plan' AND c.conname = 'Plan_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'License_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'License' AND c.conname = 'License_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'License_clientId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'License' AND c.conname = 'License_clientId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'License_planId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'License' AND c.conname = 'License_planId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'DeviceActivation_licenseId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'DeviceActivation' AND c.conname = 'DeviceActivation_licenseId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersion_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersion' AND c.conname = 'AppVersion_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersionLicensePermission_appVersionId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersionLicensePermission' AND c.conname = 'AppVersionLicensePermission_appVersionId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersionLicensePermission_licenseId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersionLicensePermission' AND c.conname = 'AppVersionLicensePermission_licenseId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersionPlanPermission_appVersionId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersionPlanPermission' AND c.conname = 'AppVersionPlanPermission_appVersionId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersionPlanPermission_planId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersionPlanPermission' AND c.conname = 'AppVersionPlanPermission_planId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AuditLog_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AuditLog' AND c.conname = 'AuditLog_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AuditLog_adminUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AuditLog' AND c.conname = 'AuditLog_adminUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalUser_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalUser' AND c.conname = 'PortalUser_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalUser_clientId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalUser' AND c.conname = 'PortalUser_clientId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalRefreshToken_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalRefreshToken' AND c.conname = 'PortalRefreshToken_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalRefreshToken_portalUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalRefreshToken' AND c.conname = 'PortalRefreshToken_portalUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalPasswordResetToken_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalPasswordResetToken' AND c.conname = 'PortalPasswordResetToken_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalPasswordResetToken_portalUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalPasswordResetToken' AND c.conname = 'PortalPasswordResetToken_portalUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicket_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicket' AND c.conname = 'SupportTicket_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicket_clientId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicket' AND c.conname = 'SupportTicket_clientId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicket_portalUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicket' AND c.conname = 'SupportTicket_portalUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicketMessage_ticketId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicketMessage' AND c.conname = 'SupportTicketMessage_ticketId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicketMessage_adminUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicketMessage' AND c.conname = 'SupportTicketMessage_adminUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicketMessage_portalUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicketMessage' AND c.conname = 'SupportTicketMessage_portalUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'DesktopRecord_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'DesktopRecord' AND c.conname = 'DesktopRecord_tenantId_fkey') AS exists_flag
)
SELECT object_type, object_name, exists_flag
FROM checks
ORDER BY object_type, object_name;

-- Apenas faltantes
WITH checks AS (
  SELECT 'ENUM' AS object_type, 'AdminRole' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminRole') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'ClientStatus' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientStatus') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'PlanInterval' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanInterval') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'PlanStatus' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanStatus') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'LicenseType' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenseType') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'LicenseStatus' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenseStatus') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'ReleaseChannel' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReleaseChannel') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'AppEdition' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppEdition') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'DesktopRecordType' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DesktopRecordType') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'SupportTicketStatus' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketStatus') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'SupportTicketPriority' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketPriority') AS exists_flag
  UNION ALL
  SELECT 'ENUM' AS object_type, 'SupportTicketSenderType' AS object_name, EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketSenderType') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'Tenant' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tenant') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AdminUser' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AdminUser') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'RefreshToken' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RefreshToken') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'PasswordResetToken' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PasswordResetToken') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'Client' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Client') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'Plan' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Plan') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'License' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'License') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'DeviceActivation' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DeviceActivation') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AppVersion' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AppVersion') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AppVersionLicensePermission' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AppVersionLicensePermission') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AppVersionPlanPermission' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AppVersionPlanPermission') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'AuditLog' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuditLog') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'PortalUser' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PortalUser') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'PortalRefreshToken' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PortalRefreshToken') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'PortalPasswordResetToken' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PortalPasswordResetToken') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'SupportTicket' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SupportTicket') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'SupportTicketMessage' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SupportTicketMessage') AS exists_flag
  UNION ALL
  SELECT 'TABLE' AS object_type, 'DesktopRecord' AS object_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DesktopRecord') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Tenant_slug_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Tenant_slug_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AdminUser_email_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AdminUser_email_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'RefreshToken_adminUserId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'RefreshToken_adminUserId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Client_tenantId_name_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Client_tenantId_name_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Client_tenantId_cpfCnpj_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Client_tenantId_cpfCnpj_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Plan_tenantId_name_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Plan_tenantId_name_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'Plan_tenantId_name_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Plan_tenantId_name_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'License_code_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'License_code_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'License_tenantId_status_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'License_tenantId_status_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'License_clientId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'License_clientId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'License_planId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'License_planId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'DeviceActivation_deviceFingerprint_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'DeviceActivation_deviceFingerprint_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'DeviceActivation_licenseId_deviceFingerprint_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'DeviceActivation_licenseId_deviceFingerprint_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AppVersion_tenantId_isActive_releaseChannel_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AppVersion_tenantId_isActive_releaseChannel_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AppVersion_tenantId_version_buildNumber_releaseChannel_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AppVersion_tenantId_version_buildNumber_releaseChannel_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AppVersionLicensePermission_appVersionId_licenseId_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AppVersionLicensePermission_appVersionId_licenseId_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AppVersionPlanPermission_appVersionId_planId_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AppVersionPlanPermission_appVersionId_planId_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'AuditLog_tenantId_createdAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AuditLog_tenantId_createdAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'PortalUser_tenantId_clientId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'PortalUser_tenantId_clientId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'PortalUser_tenantId_email_key' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'PortalUser_tenantId_email_key') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'PortalRefreshToken_portalUserId_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'PortalRefreshToken_portalUserId_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'SupportTicket_tenantId_status_updatedAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'SupportTicket_tenantId_status_updatedAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'SupportTicket_clientId_createdAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'SupportTicket_clientId_createdAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'SupportTicketMessage_ticketId_createdAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'SupportTicketMessage_ticketId_createdAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'DesktopRecord_tenantId_recordType_updatedAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'DesktopRecord_tenantId_recordType_updatedAt_idx') AS exists_flag
  UNION ALL
  SELECT 'INDEX' AS object_type, 'DesktopRecord_tenantId_isDeleted_updatedAt_idx' AS object_name, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'DesktopRecord_tenantId_isDeleted_updatedAt_idx') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AdminUser_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AdminUser' AND c.conname = 'AdminUser_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'RefreshToken_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'RefreshToken' AND c.conname = 'RefreshToken_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'RefreshToken_adminUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'RefreshToken' AND c.conname = 'RefreshToken_adminUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PasswordResetToken_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PasswordResetToken' AND c.conname = 'PasswordResetToken_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PasswordResetToken_adminUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PasswordResetToken' AND c.conname = 'PasswordResetToken_adminUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'Client_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'Client' AND c.conname = 'Client_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'Plan_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'Plan' AND c.conname = 'Plan_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'License_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'License' AND c.conname = 'License_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'License_clientId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'License' AND c.conname = 'License_clientId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'License_planId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'License' AND c.conname = 'License_planId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'DeviceActivation_licenseId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'DeviceActivation' AND c.conname = 'DeviceActivation_licenseId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersion_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersion' AND c.conname = 'AppVersion_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersionLicensePermission_appVersionId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersionLicensePermission' AND c.conname = 'AppVersionLicensePermission_appVersionId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersionLicensePermission_licenseId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersionLicensePermission' AND c.conname = 'AppVersionLicensePermission_licenseId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersionPlanPermission_appVersionId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersionPlanPermission' AND c.conname = 'AppVersionPlanPermission_appVersionId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AppVersionPlanPermission_planId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AppVersionPlanPermission' AND c.conname = 'AppVersionPlanPermission_planId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AuditLog_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AuditLog' AND c.conname = 'AuditLog_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'AuditLog_adminUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'AuditLog' AND c.conname = 'AuditLog_adminUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalUser_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalUser' AND c.conname = 'PortalUser_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalUser_clientId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalUser' AND c.conname = 'PortalUser_clientId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalRefreshToken_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalRefreshToken' AND c.conname = 'PortalRefreshToken_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalRefreshToken_portalUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalRefreshToken' AND c.conname = 'PortalRefreshToken_portalUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalPasswordResetToken_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalPasswordResetToken' AND c.conname = 'PortalPasswordResetToken_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'PortalPasswordResetToken_portalUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'PortalPasswordResetToken' AND c.conname = 'PortalPasswordResetToken_portalUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicket_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicket' AND c.conname = 'SupportTicket_tenantId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicket_clientId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicket' AND c.conname = 'SupportTicket_clientId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicket_portalUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicket' AND c.conname = 'SupportTicket_portalUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicketMessage_ticketId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicketMessage' AND c.conname = 'SupportTicketMessage_ticketId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicketMessage_adminUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicketMessage' AND c.conname = 'SupportTicketMessage_adminUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'SupportTicketMessage_portalUserId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'SupportTicketMessage' AND c.conname = 'SupportTicketMessage_portalUserId_fkey') AS exists_flag
  UNION ALL
  SELECT 'CONSTRAINT' AS object_type, 'DesktopRecord_tenantId_fkey' AS object_name, EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'DesktopRecord' AND c.conname = 'DesktopRecord_tenantId_fkey') AS exists_flag
)
SELECT object_type, object_name
FROM checks
WHERE exists_flag = false
ORDER BY object_type, object_name;
