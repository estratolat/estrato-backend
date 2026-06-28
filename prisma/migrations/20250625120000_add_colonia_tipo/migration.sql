-- Agregar 'colonia' al enum CapaMapaTipo
-- Nota: PostgreSQL maneja enums nativos. Esta migración es segura si no hay datos que rompan la restricción.
ALTER TYPE "CapaMapaTipo" ADD VALUE 'colonia';
