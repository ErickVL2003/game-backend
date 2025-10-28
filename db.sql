-- ========================================
-- CREACIÓN DE TABLAS (Modelo físico)
-- ========================================

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

-- ========================================
-- DATOS INICIALES
-- ========================================
INSERT INTO roles (nombre) VALUES ('admin'), ('jugador');
