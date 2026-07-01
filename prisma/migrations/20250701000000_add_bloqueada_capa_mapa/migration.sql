-- Add bloqueada column to mapas_capas for layer lock interaction toggle
ALTER TABLE "mapas_capas" ADD COLUMN "bloqueada" BOOLEAN NOT NULL DEFAULT false;
