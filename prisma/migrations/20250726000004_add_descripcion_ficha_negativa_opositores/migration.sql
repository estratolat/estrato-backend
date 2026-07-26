-- AlterTable opositores: agregar descripcion y ficha_negativa
ALTER TABLE "opositores" ADD COLUMN IF NOT EXISTS "descripcion" TEXT;
ALTER TABLE "opositores" ADD COLUMN IF NOT EXISTS "ficha_negativa" TEXT;
