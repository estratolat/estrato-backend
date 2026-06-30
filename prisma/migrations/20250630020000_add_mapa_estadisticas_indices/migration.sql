-- Índices para acelerar agregaciones del mapa territorial por sección
CREATE INDEX IF NOT EXISTS "idx_votante_tenant_activo_seccion"
  ON "votantes"("tenant_id", "activo", "seccion_electoral");

CREATE INDEX IF NOT EXISTS "idx_lider_tenant_activo"
  ON "lideres"("tenant_id", "activo");

CREATE INDEX IF NOT EXISTS "idx_apoyo_tenant"
  ON "apoyos"("tenant_id");

CREATE INDEX IF NOT EXISTS "idx_evento_tenant"
  ON "eventos"("tenant_id");
