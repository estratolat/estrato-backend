ALTER TABLE eleccion_actores ADD COLUMN IF NOT EXISTS tipo_voto VARCHAR(30) NOT NULL DEFAULT 'TOTAL';
ALTER TABLE eleccion_actores ADD COLUMN IF NOT EXISTS tipo_actor VARCHAR(30) NOT NULL DEFAULT 'PARTIDO';
CREATE INDEX IF NOT EXISTS idx_eleccion_actor_tipo ON eleccion_actores(tenant_id, eleccion_id, tipo_actor);
