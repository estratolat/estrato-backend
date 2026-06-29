-- Quitar valores de fuentes externas del enum CapaMapaTipo
-- Se ejecutó manualmente en producción previo a registrar esta migración.
-- 1. Se eliminaron previamente las capas de tipo 'inegi' y 'colonia' de mapas_capas.
-- 2. Se recrea el enum sin esos valores.

CREATE TYPE "CapaMapaTipo_new" AS ENUM ('territorio', 'apoyos', 'lideres', 'votantes', 'secciones_ine', 'eventos', 'recorridos', 'custom');
ALTER TABLE "mapas_capas" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "mapas_capas" ALTER COLUMN "tipo" TYPE "CapaMapaTipo_new" USING ("tipo"::text::"CapaMapaTipo_new");
ALTER TYPE "CapaMapaTipo" RENAME TO "CapaMapaTipo_old";
ALTER TYPE "CapaMapaTipo_new" RENAME TO "CapaMapaTipo";
DROP TYPE "CapaMapaTipo_old";
ALTER TABLE "mapas_capas" ALTER COLUMN "tipo" SET DEFAULT 'custom';
