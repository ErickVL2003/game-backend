-- Crear roles del SGBD
CREATE ROLE administrador LOGIN PASSWORD 'admin123';
CREATE ROLE jugador LOGIN PASSWORD 'jugador123';

-- Permisos:
GRANT CONNECT ON DATABASE render TO administrador, jugador;

-- Administrador tiene todos los permisos:
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO administrador;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO administrador;

-- Jugador solo puede consultar y agregar puntuaciones propias:
GRANT SELECT, INSERT ON TABLE puntuaciones TO jugador;
GRANT SELECT ON TABLE usuarios TO jugador;
