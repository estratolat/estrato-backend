-- CreateTable opositores
CREATE TABLE "opositores" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "nombre" TEXT NOT NULL,
  "partido" TEXT,
  "foto_url" TEXT,
  "nivel_rivalidad" INTEGER NOT NULL DEFAULT 1,
  "redes_sociales" JSONB,
  "notas" TEXT,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "opositores_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "opositores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "opositores_tenant_id_nivel_rivalidad_idx" ON "opositores"("tenant_id", "nivel_rivalidad");
CREATE INDEX "opositores_tenant_id_activo_idx" ON "opositores"("tenant_id", "activo");
CREATE UNIQUE INDEX "opositores_tenant_id_nombre_key" ON "opositores"("tenant_id", "nombre");
