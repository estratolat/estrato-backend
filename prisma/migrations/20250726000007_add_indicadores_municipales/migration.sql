-- CreateTable
CREATE TABLE "indicadores_municipales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "indicador" TEXT NOT NULL,
    "descripcion" TEXT,
    "valor_numerico" DOUBLE PRECISION,
    "valor_texto" TEXT,
    "unidad" TEXT,
    "periodo" TEXT,
    "fuente" TEXT NOT NULL DEFAULT 'Data México',
    "fuente_url" TEXT,
    "coordenada_x" DOUBLE PRECISION,
    "coordenada_y" DOUBLE PRECISION,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicadores_municipales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "indicadores_municipales_tenant_id_categoria_idx" ON "indicadores_municipales"("tenant_id", "categoria");

-- CreateIndex
CREATE INDEX "indicadores_municipales_tenant_id_periodo_idx" ON "indicadores_municipales"("tenant_id", "periodo");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "indicador_unico_idx" ON "indicadores_municipales"("tenant_id", "categoria", "indicador", "subcategoria", "periodo");

-- AddForeignKey
ALTER TABLE "indicadores_municipales" ADD CONSTRAINT "indicadores_municipales_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
