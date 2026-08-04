-- AlterTable
ALTER TABLE "votantes" ADD COLUMN     "comunidad" TEXT,
ADD COLUMN     "ocupacion" TEXT,
ADD COLUMN     "redes_sociales" JSONB,
ADD COLUMN     "vereda" TEXT;
