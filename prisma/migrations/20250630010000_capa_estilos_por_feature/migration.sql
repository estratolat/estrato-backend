-- Agregar columna de estilos por feature a capas personalizadas
ALTER TABLE mapas_capas ADD COLUMN estilos JSONB NOT NULL DEFAULT '{}';

-- Garantizar que el JSON sea un objeto
UPDATE mapas_capas SET estilos = '{}' WHERE estilos IS NULL;
