-- DropIndex
ALTER TABLE "resultados_historicos" DROP CONSTRAINT "resultados_historicos_tenant_id_seccion_anio_key";

-- AlterTable
ALTER TABLE "resultados_historicos" DROP COLUMN "votos_totales",
ADD COLUMN     "casilla" TEXT NOT NULL DEFAULT 'NA',
ADD COLUMN     "distrito_federal_id" INTEGER,
ADD COLUMN     "distrito_local_id" INTEGER,
ADD COLUMN     "estado_nombre" TEXT,
ADD COLUMN     "ext_contigua" TEXT,
ADD COLUMN     "lista_nominal" INTEGER,
ADD COLUMN     "municipio_nombre" TEXT,
ADD COLUMN     "tipo_casilla" TEXT,
ADD COLUMN     "tipo_eleccion" TEXT NOT NULL DEFAULT 'desconocido',
ADD COLUMN     "tipo_historico" TEXT NOT NULL DEFAULT 'principal',
ADD COLUMN     "total_votos" INTEGER,
ADD COLUMN     "votos_no_reg" INTEGER,
ADD COLUMN     "votos_validos" INTEGER,
ALTER COLUMN "partido_ganador" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "resultados_historicos_tenant_id_tipo_historico_tipo_eleccio_idx" ON "resultados_historicos"("tenant_id", "tipo_historico", "tipo_eleccion", "anio");

