-- ========================================
-- TRIGGER 1: Registro de actividad cuando se crea usuario
-- ========================================
CREATE TABLE log_actividades (
  id SERIAL PRIMARY KEY,
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION registrar_creacion_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO log_actividades (descripcion)
  VALUES (concat('Nuevo usuario creado: ', NEW.username));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuario_creado
AFTER INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION registrar_creacion_usuario();

-- ========================================
-- TRIGGER 2: Registro cuando se elimina puntuación
-- ========================================
CREATE OR REPLACE FUNCTION registrar_borrado_puntuacion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO log_actividades (descripcion)
  VALUES (concat('Puntuación eliminada con ID: ', OLD.id));
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_puntuacion_eliminada
AFTER DELETE ON puntuaciones
FOR EACH ROW
EXECUTE FUNCTION registrar_borrado_puntuacion();
