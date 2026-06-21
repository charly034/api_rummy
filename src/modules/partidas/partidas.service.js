import { pool } from "../../config/db.js";
import { createHttpError } from "../../utils/http-error.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcularPosiciones = (jugadores) => {
  // En Rummy, menos puntos = mejor posición (posicion 1 = ganador)
  const ordenados = [...jugadores].sort((a, b) => a.puntos - b.puntos);
  return jugadores.map((j) => ({
    ...j,
    posicion: ordenados.findIndex((o) => o.jugador_id === j.jugador_id) + 1,
  }));
};

const validarJugadores = (jugadores) => {
  if (!Array.isArray(jugadores) || jugadores.length < 2) {
    throw createHttpError(400, "Se requieren al menos 2 jugadores");
  }
  for (const j of jugadores) {
    if (!j.jugador_id || j.puntos === undefined || j.puntos === null) {
      throw createHttpError(400, "Cada jugador debe tener jugador_id y puntos");
    }
    if (!Number.isInteger(j.puntos) || j.puntos < 0) {
      throw createHttpError(400, "Los puntos deben ser un número entero >= 0");
    }
  }
  const ids = jugadores.map((j) => j.jugador_id);
  if (new Set(ids).size !== ids.length) {
    throw createHttpError(400, "No se puede repetir el mismo jugador en una partida");
  }
};

// ─── Queries ──────────────────────────────────────────────────────────────────

const getAllPartidas = async ({ jugador_id, desde, hasta } = {}) => {
  const params = [];
  const filters = ["p.activo = TRUE"];

  if (jugador_id) {
    params.push(jugador_id);
    filters.push(`EXISTS (
      SELECT 1 FROM partida_jugadores pj2
      WHERE pj2.partida_id = p.id AND pj2.jugador_id = $${params.length}
    )`);
  }
  if (desde) {
    params.push(desde);
    filters.push(`p.fecha >= $${params.length}`);
  }
  if (hasta) {
    params.push(hasta);
    filters.push(`p.fecha <= $${params.length}`);
  }

  const where = filters.join(" AND ");

  const { rows } = await pool.query(
    `SELECT
       p.id,
       p.fecha,
       p.notas,
       p.created_at,
       COUNT(pj.id)::INT                          AS cant_jugadores,
       MAX(CASE WHEN pj.posicion = 1 THEN j.nombre END) AS ganador
     FROM partidas p
     LEFT JOIN partida_jugadores pj ON p.id = pj.partida_id
     LEFT JOIN jugadores j          ON pj.jugador_id = j.id
     WHERE ${where}
     GROUP BY p.id
     ORDER BY p.fecha DESC`,
    params
  );
  return rows;
};

const getPartidaById = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.fecha, p.notas, p.created_at, p.updated_at,
       COALESCE(
         json_agg(
           json_build_object(
             'id',         pj.id,
             'jugador_id', j.id,
             'nombre',     j.nombre,
             'apodo',      j.apodo,
             'puntos',     pj.puntos,
             'posicion',   pj.posicion
           ) ORDER BY pj.posicion ASC
         ) FILTER (WHERE pj.id IS NOT NULL),
         '[]'
       ) AS jugadores
     FROM partidas p
     LEFT JOIN partida_jugadores pj ON p.id = pj.partida_id
     LEFT JOIN jugadores j          ON pj.jugador_id = j.id
     WHERE p.id = $1 AND p.activo = TRUE
     GROUP BY p.id`,
    [id]
  );
  if (!rows[0]) throw createHttpError(404, "Partida no encontrada");
  return rows[0];
};

const createPartida = async ({ fecha, notas, jugadores }) => {
  validarJugadores(jugadores);
  const jugadoresConPosicion = calcularPosiciones(jugadores);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [partida] } = await client.query(
      `INSERT INTO partidas (fecha, notas)
       VALUES ($1, $2)
       RETURNING id, fecha, notas, created_at`,
      [fecha || new Date(), notas || null]
    );

    for (const j of jugadoresConPosicion) {
      await client.query(
        `INSERT INTO partida_jugadores (partida_id, jugador_id, puntos, posicion)
         VALUES ($1, $2, $3, $4)`,
        [partida.id, j.jugador_id, j.puntos, j.posicion]
      );
    }

    await client.query("COMMIT");
    return getPartidaById(partida.id);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23503") throw createHttpError(404, "Uno o más jugadores no existen");
    if (error.code === "23505") throw createHttpError(409, "Jugador duplicado en la partida");
    throw error;
  } finally {
    client.release();
  }
};

const updatePartida = async (id, { fecha, notas, jugadores }) => {
  await getPartidaById(id);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const fields = [];
    const params = [];

    if (fecha !== undefined) {
      params.push(fecha);
      fields.push(`fecha = $${params.length}`);
    }
    if (notas !== undefined) {
      params.push(notas || null);
      fields.push(`notas = $${params.length}`);
    }

    if (fields.length) {
      params.push(id);
      fields.push(`updated_at = NOW()`);
      await client.query(
        `UPDATE partidas SET ${fields.join(", ")} WHERE id = $${params.length}`,
        params
      );
    }

    if (jugadores) {
      validarJugadores(jugadores);
      const jugadoresConPosicion = calcularPosiciones(jugadores);

      await client.query("DELETE FROM partida_jugadores WHERE partida_id = $1", [id]);

      for (const j of jugadoresConPosicion) {
        await client.query(
          `INSERT INTO partida_jugadores (partida_id, jugador_id, puntos, posicion)
           VALUES ($1, $2, $3, $4)`,
          [id, j.jugador_id, j.puntos, j.posicion]
        );
      }

      await client.query(
        "UPDATE partidas SET updated_at = NOW() WHERE id = $1",
        [id]
      );
    }

    await client.query("COMMIT");
    return getPartidaById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23503") throw createHttpError(404, "Uno o más jugadores no existen");
    throw error;
  } finally {
    client.release();
  }
};

const deletePartida = async (id) => {
  await getPartidaById(id);
  await pool.query(
    "UPDATE partidas SET activo = FALSE, updated_at = NOW() WHERE id = $1",
    [id]
  );
};

const getHistorialJugador = async (jugador_id) => {
  const { rows: partidas } = await pool.query(
    `SELECT
       p.id,
       p.fecha,
       p.notas,
       pj.puntos,
       pj.posicion,
       COUNT(pj2.id)::INT AS cant_jugadores
     FROM partidas p
     INNER JOIN partida_jugadores pj  ON p.id = pj.partida_id AND pj.jugador_id = $1
     LEFT JOIN  partida_jugadores pj2 ON p.id = pj2.partida_id
     WHERE p.activo = TRUE
     GROUP BY p.id, pj.puntos, pj.posicion
     ORDER BY p.fecha DESC`,
    [jugador_id]
  );

  const total = partidas.length;
  const victorias = partidas.filter((p) => p.posicion === 1).length;
  const total_puntos = partidas.reduce((acc, p) => acc + p.puntos, 0);

  return {
    jugador_id,
    estadisticas: {
      partidas_jugadas: total,
      victorias,
      porcentaje_victorias: total ? Math.round((victorias / total) * 100) : 0,
      total_puntos,
      promedio_puntos: total ? Math.round(total_puntos / total) : 0,
    },
    partidas,
  };
};

export {
  getAllPartidas,
  getPartidaById,
  createPartida,
  updatePartida,
  deletePartida,
  getHistorialJugador,
};
