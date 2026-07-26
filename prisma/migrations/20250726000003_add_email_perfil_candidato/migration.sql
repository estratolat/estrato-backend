-- AlterTable perfiles_candidato: agregar email de contacto
ALTER TABLE "perfiles_candidato" ADD COLUMN IF NOT EXISTS "email" TEXT;
