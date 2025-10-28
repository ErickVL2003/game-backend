-- procedures.sql

-- PROCEDIMIENTO 1: agregar_puntuacion(p_user_id, p_score)
CREATE OR REPLACE PROCEDURE agregar_puntuacion(p_user_id INT, p_score INT)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_score < 0 THEN
    RAISE EXCEPTION 'La puntuación no puede ser negativa';
  END IF;
  INSERT INTO puntuaciones (usuario_id, puntuacion) VALUES (p_user_id, p_score);
END;
$$;

-- PROCEDIMIENTO 2: cambiar_rol_usuario(p_username, nuevo_rol)
CREATE OR REPLACE PROCEDURE cambiar_rol_usuario(p_username VARCHAR, nuevo_rol VARCHAR)
LANGUAGE plpgsql
AS $$
DECLARE
  v_rol_id INT;
BEGIN
  SELECT id INTO v_rol_id FROM roles WHERE nombre = nuevo_rol;
  IF v_rol_id IS NULL THEN
    RAISE EXCEPTION 'Rol no existe: %', nuevo_rol;
  END IF;
  UPDATE usuarios SET rol_id = v_rol_id WHERE username = p_username;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', p_username;
  END IF;
END;
$$;
