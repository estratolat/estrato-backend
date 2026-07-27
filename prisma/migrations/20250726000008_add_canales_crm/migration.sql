-- CreateTable
CREATE TABLE "canales_crm" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "canal" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'meta',
    "cuenta_id" TEXT,
    "access_token" TEXT,
    "desde_numero" TEXT,
    "webhook_path" TEXT,
    "verify_token" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canales_crm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "canales_crm_tenant_id_canal_idx" ON "canales_crm"("tenant_id", "canal");

-- CreateIndex
CREATE INDEX "canales_crm_tenant_id_activo_idx" ON "canales_crm"("tenant_id", "activo");

-- CreateIndex
CREATE INDEX "canales_crm_webhook_path_idx" ON "canales_crm"("webhook_path");

-- AddForeignKey
ALTER TABLE "canales_crm" ADD CONSTRAINT "canales_crm_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "mensajes" ADD COLUMN "canal_crm_id" UUID;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_canal_crm_id_fkey" FOREIGN KEY ("canal_crm_id") REFERENCES "canales_crm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
