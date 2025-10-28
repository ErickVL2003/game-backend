-- triggers.sql

-- TRIGGER 1: cuando se crea un usuario -> registro en log_actividades
CREATE OR REPLACE FUNCTION registrar_creacion_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO log_actividades (descripcion)
  VALUES (concat('Nuevo usuario creado: ', NEW.username));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuario_creado ON usuarios;
CREATE TRIGGER trg_usuario_creado
AFTER INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION registrar_creacion_usuario();

-- TRIGGER 2: cuando se elimina una puntuacion -> registro en log_actividades
CREATE OR REPLACE FUNCTION registrar_borrado_puntuacion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO log_actividades (descripcion)
  VALUES (concat('Puntuación eliminada con ID: ', OLD.id, ' usuario_id: ', OLD.usuario_id));
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_puntuacion_eliminada ON puntuaciones;
CREATE TRIGGER trg_puntuacion_eliminada
AFTER DELETE ON puntuaciones
FOR EACH ROW
EXECUTE FUNCTION registrar_borrado_puntuacion();
