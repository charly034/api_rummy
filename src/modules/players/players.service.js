import { pool } from "../../config/db.js";
import { createHttpError } from "../../utils/http-error.js";

const getAllPlayers = async ({ search, activo } = {}) => {
  let query = "SELECT * FROM jugadores WHERE 1=1";
  const params = [];

  if (activo !== undefined) {
    params.push(activo);
    query += ` AND activo = $${params.length}`;
  } else {
    query += " AND activo = TRUE";
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (nombre ILIKE $${params.length} OR apodo ILIKE $${params.length})`;
  }

  query += " ORDER BY nombre ASC";

  const { rows } = await pool.query(query, params);
  return rows;
};

const getPlayerById = async (id) => {
  const { rows } = await pool.query(
    "SELECT * FROM jugadores WHERE id = $1 AND activo = TRUE",
    [id]
  );
  if (!rows[0]) throw createHttpError(404, "Jugador no encontrado");
  return rows[0];
};

const createPlayer = async ({ nombre, apodo, email }) => {
  if (!nombre?.trim()) throw createHttpError(400, "El nombre es obligatorio");

  const { rows } = await pool.query(
    `INSERT INTO jugadores (nombre, apodo, email)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [nombre.trim(), apodo?.trim() || null, email?.trim() || null]
  );
  return rows[0];
};

const updatePlayer = async (id, { nombre, apodo, email }) => {
  await getPlayerById(id);

  const fields = [];
  const params = [];

  if (nombre !== undefined) {
    if (!nombre.trim()) throw createHttpError(400, "El nombre no puede estar vacío");
    params.push(nombre.trim());
    fields.push(`nombre = $${params.length}`);
  }
  if (apodo !== undefined) {
    params.push(apodo?.trim() || null);
    fields.push(`apodo = $${params.length}`);
  }
  if (email !== undefined) {
    params.push(email?.trim() || null);
    fields.push(`email = $${params.length}`);
  }

  if (!fields.length) throw createHttpError(400, "No se enviaron campos para actualizar");

  params.push(id);
  fields.push(`updated_at = NOW()`);

  const { rows } = await pool.query(
    `UPDATE jugadores SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0];
};

const deletePlayer = async (id) => {
  await getPlayerById(id);
  await pool.query(
    "UPDATE jugadores SET activo = FALSE, updated_at = NOW() WHERE id = $1",
    [id]
  );
};

export { getAllPlayers, getPlayerById, createPlayer, updatePlayer, deletePlayer };
