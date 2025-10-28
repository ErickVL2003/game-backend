-- db.sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol_id INT REFERENCES roles(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE puntuaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  puntuacion INT NOT NULL CHECK (puntuacion >= 0),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- tabla para logs (usada por triggers)
CREATE TABLE log_actividades (
  id SERIAL PRIMARY KEY,
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- datos iniciales: roles
INSERT INTO roles (nombre) VALUES ('admin'), ('jugador') ON CONFLICT DO NOTHING;
