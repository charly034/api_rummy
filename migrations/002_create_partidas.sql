CREATE TABLE IF NOT EXISTS partidas (
  id         SERIAL PRIMARY KEY,
  fecha      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  notas      TEXT,
  activo     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partida_jugadores (
  id         SERIAL   PRIMARY KEY,
  partida_id INTEGER  NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  jugador_id INTEGER  NOT NULL REFERENCES jugadores(id),
  puntos     INTEGER  NOT NULL DEFAULT 0,
  posicion   SMALLINT NOT NULL,
  UNIQUE (partida_id, jugador_id)
);

CREATE INDEX IF NOT EXISTS idx_pj_partida  ON partida_jugadores(partida_id);
CREATE INDEX IF NOT EXISTS idx_pj_jugador  ON partida_jugadores(jugador_id);
