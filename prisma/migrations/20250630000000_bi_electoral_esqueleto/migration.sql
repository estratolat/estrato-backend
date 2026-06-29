-- CreateTable
CREATE TABLE "partidos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "siglas" VARCHAR(20) NOT NULL,
    "color_hex" VARCHAR(7),
    "logo_url" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elecciones" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "puesto" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleccion_actores" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "eleccion_id" UUID NOT NULL,
    "partido_id" UUID,
    "es_coalicion" BOOLEAN NOT NULL DEFAULT false,
    "nombre_coalicion" TEXT,
    "nombre_visual" TEXT NOT NULL,
    "color_hex" VARCHAR(7),
    "columna_excel_alias" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eleccion_actores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_casillas" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "eleccion_id" UUID NOT NULL,
    "estado_id" VARCHAR(10) NOT NULL,
    "municipio_id" VARCHAR(10) NOT NULL,
    "municipio" TEXT NOT NULL,
    "seccion" VARCHAR(20) NOT NULL,
    "casilla" VARCHAR(50) NOT NULL,
    "lista_nominal" INTEGER NOT NULL,
    "votos_data" JSONB NOT NULL,
    "votos_no_registrados" INTEGER NOT NULL DEFAULT 0,
    "votos_nulos" INTEGER NOT NULL DEFAULT 0,
    "total_votos" INTEGER NOT NULL,
    "estatus_acta" VARCHAR(100),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultados_casillas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seccion_analisis_proyeccion" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "eleccion_id" UUID NOT NULL,
    "seccion" VARCHAR(20) NOT NULL,
    "actor_ganador_id" UUID,
    "porcentaje_votos_nulos" DOUBLE PRECISION,
    "clasificacion_estrategica" VARCHAR(50) NOT NULL DEFAULT 'PERSUASION',
    "ia_analisis_cache" JSONB,
    "proyeccion_votos" INTEGER,
    "lista_nominal_total" INTEGER,
    "total_votos_total" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seccion_analisis_proyeccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partidos_tenant_id_orden_idx" ON "partidos"("tenant_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "partidos_tenant_id_siglas_key" ON "partidos"("tenant_id", "siglas");

-- CreateIndex
CREATE INDEX "elecciones_tenant_id_anio_idx" ON "elecciones"("tenant_id", "anio");

-- CreateIndex
CREATE INDEX "elecciones_tenant_id_activa_idx" ON "elecciones"("tenant_id", "activa");

-- CreateIndex
CREATE INDEX "eleccion_actores_tenant_id_eleccion_id_idx" ON "eleccion_actores"("tenant_id", "eleccion_id");

-- CreateIndex
CREATE INDEX "eleccion_actores_eleccion_id_orden_idx" ON "eleccion_actores"("eleccion_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "eleccion_actores_eleccion_id_columna_excel_alias_key" ON "eleccion_actores"("eleccion_id", "columna_excel_alias");

-- CreateIndex
CREATE INDEX "resultados_casillas_tenant_id_eleccion_id_seccion_idx" ON "resultados_casillas"("tenant_id", "eleccion_id", "seccion");

-- CreateIndex
CREATE INDEX "resultados_casillas_tenant_id_eleccion_id_municipio_id_idx" ON "resultados_casillas"("tenant_id", "eleccion_id", "municipio_id");

-- CreateIndex
CREATE INDEX "resultados_casillas_tenant_id_eleccion_id_estado_id_idx" ON "resultados_casillas"("tenant_id", "eleccion_id", "estado_id");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_casillas_tenant_id_eleccion_id_seccion_casilla_key" ON "resultados_casillas"("tenant_id", "eleccion_id", "seccion", "casilla");

-- CreateIndex
CREATE INDEX "seccion_analisis_proyeccion_tenant_id_eleccion_id_clasifica_idx" ON "seccion_analisis_proyeccion"("tenant_id", "eleccion_id", "clasificacion_estrategica");

-- CreateIndex
CREATE UNIQUE INDEX "seccion_analisis_proyeccion_tenant_id_eleccion_id_seccion_key" ON "seccion_analisis_proyeccion"("tenant_id", "eleccion_id", "seccion");

-- AddForeignKey
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elecciones" ADD CONSTRAINT "elecciones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleccion_actores" ADD CONSTRAINT "eleccion_actores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleccion_actores" ADD CONSTRAINT "eleccion_actores_eleccion_id_fkey" FOREIGN KEY ("eleccion_id") REFERENCES "elecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleccion_actores" ADD CONSTRAINT "eleccion_actores_partido_id_fkey" FOREIGN KEY ("partido_id") REFERENCES "partidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_casillas" ADD CONSTRAINT "resultados_casillas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_casillas" ADD CONSTRAINT "resultados_casillas_eleccion_id_fkey" FOREIGN KEY ("eleccion_id") REFERENCES "elecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seccion_analisis_proyeccion" ADD CONSTRAINT "seccion_analisis_proyeccion_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seccion_analisis_proyeccion" ADD CONSTRAINT "seccion_analisis_proyeccion_eleccion_id_fkey" FOREIGN KEY ("eleccion_id") REFERENCES "elecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seccion_analisis_proyeccion" ADD CONSTRAINT "seccion_analisis_proyeccion_actor_ganador_id_fkey" FOREIGN KEY ("actor_ganador_id") REFERENCES "eleccion_actores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

