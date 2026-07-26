-- AlterTable perfiles_candidato: agregar cargo, foto_url y redes_sociales
ALTER TABLE "perfiles_candidato" ADD COLUMN IF NOT EXISTS "cargo" TEXT;
ALTER TABLE "perfiles_candidato" ADD COLUMN IF NOT EXISTS "foto_url" TEXT;
ALTER TABLE "perfiles_candidato" ADD COLUMN IF NOT EXISTS "redes_sociales" JSONB;
