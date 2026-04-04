-- CreateEnum
CREATE TYPE "DesktopRecordType" AS ENUM ('COMPANY', 'CUSTOMER', 'PRODUCT', 'ORDER', 'USER');

-- CreateTable
CREATE TABLE "DesktopRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recordType" "DesktopRecordType" NOT NULL,
    "payload" JSONB NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesktopRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesktopRecord_tenantId_recordType_updatedAt_idx" ON "DesktopRecord"("tenantId", "recordType", "updatedAt");

-- CreateIndex
CREATE INDEX "DesktopRecord_tenantId_isDeleted_updatedAt_idx" ON "DesktopRecord"("tenantId", "isDeleted", "updatedAt");

-- AddForeignKey
ALTER TABLE "DesktopRecord" ADD CONSTRAINT "DesktopRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
