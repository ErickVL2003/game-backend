-- security.sql

-- Crear roles en el SGBD (si tu cuenta lo permite)
-- CAMBIA las contraseñas por algo fuerte si lo ejecutas
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'administrador') THEN
    PERFORM dblink_exec('dbname=postgres', 'CREATE ROLE administrador LOGIN PASSWORD ''admin123''');
  END IF;
EXCEPTION WHEN others THEN
  -- Puede fallar en entornos restringidos
  RAISE NOTICE 'Creación de rol administrador puede ser restringida en Render';
END;
$$ LANGUAGE plpgsql;
-- Nota: en Render normalmente no creas roles del sistema así; se usa control desde la app.
-- Alternativa práctica: controlar permisos a nivel de aplicación (roles en tabla "roles") y usar credenciales del servicio para la conexión.
