-- CreateEnum
CREATE TYPE "CanalEnvioEncuesta" AS ENUM ('whatsapp', 'email', 'link');

-- AlterTable
ALTER TABLE "respuestas_encuesta" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "encuestas_contactos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nombre" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encuestas_contactos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encuestas_envios" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "encuesta_id" UUID NOT NULL,
    "contacto_id" UUID,
    "destinatario" TEXT,
    "canal" "CanalEnvioEncuesta" NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'enviado',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encuestas_envios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encuestas_contactos_tenant_id_idx" ON "encuestas_contactos"("tenant_id");

-- CreateIndex
CREATE INDEX "encuestas_contactos_email_idx" ON "encuestas_contactos"("email");

-- CreateIndex
CREATE UNIQUE INDEX "encuestas_contactos_tenant_id_email_key" ON "encuestas_contactos"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "encuestas_envios_tenant_id_encuesta_id_idx" ON "encuestas_envios"("tenant_id", "encuesta_id");

-- CreateIndex
CREATE INDEX "encuestas_envios_contacto_id_idx" ON "encuestas_envios"("contacto_id");

-- CreateIndex
CREATE INDEX "respuestas_encuesta_email_idx" ON "respuestas_encuesta"("email");

-- AddForeignKey
ALTER TABLE "encuestas_contactos" ADD CONSTRAINT "encuestas_contactos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuestas_envios" ADD CONSTRAINT "encuestas_envios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuestas_envios" ADD CONSTRAINT "encuestas_envios_encuesta_id_fkey" FOREIGN KEY ("encuesta_id") REFERENCES "encuestas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuestas_envios" ADD CONSTRAINT "encuestas_envios_contacto_id_fkey" FOREIGN KEY ("contacto_id") REFERENCES "encuestas_contactos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

