CREATE TABLE IF NOT EXISTS jugadores (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(100)  NOT NULL,
  apodo      VARCHAR(50),
  email      VARCHAR(150)  UNIQUE,
  activo     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
