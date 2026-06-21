# Rummys — API

API REST construida con **Express + PostgreSQL** para registrar partidas de Rummy y llevar una tabla de posiciones con puntos generales.

## Tecnologías

- Node.js (ESModules)
- Express 4
- PostgreSQL (via `pg`)
- Helmet, CORS, Morgan, express-rate-limit

## Instalación

```bash
npm install
cp .env.example .env
# Editá .env con tus credenciales de base de datos
npm run migrate
npm run dev
```

La API escucha en `http://localhost:3000` por defecto.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con hot-reload (nodemon) |
| `npm start` | Servidor de producción |
| `npm run migrate` | Aplica migraciones SQL pendientes |

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores. Las más importantes:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default: 3000) |
| `NODE_ENV` | `development` o `production` |
| `CORS_ORIGIN` | URL del frontend permitido |
| `DATABASE_URL` | Connection string de PostgreSQL (recomendada) |
| `DB_SSL` | `true` si la BD es cloud, `false` si es local |

## Base de datos

El sistema de migraciones es incremental: aplica sólo los archivos `.sql` de `migrations/` que aún no se ejecutaron, registrándolos en la tabla `_migrations`.

```bash
npm run migrate
```

### Esquema

```
jugadores          — Jugadores registrados
partidas           — Partidas jugadas
partida_jugadores  — Relación jugador↔partida con puntos y posición
```

> La posición se calcula automáticamente: **más puntos = mejor posición** (posición 1 = ganador).

## Sistema de puntos generales

Cada partida otorga puntos generales según el resultado:

| Resultado | Puntos |
|-----------|--------|
| 1° lugar (ganador) | +4 |
| 2° lugar (no último) | +2 |
| Último lugar | −1 |
| Resto | 0 |

En partidas de 2 jugadores: ganador +4, perdedor −1.

## Endpoints

### Salud

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Estado de la API |
| GET | `/api/v1/health/db` | Estado de la base de datos |

### Tabla General

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/tabla-general` | Ranking de jugadores con puntos generales, totales y promedios |

**Respuesta:**
```json
{
  "status": "ok",
  "data": [
    {
      "id": 1,
      "nombre": "Juan",
      "apodo": "Juancho",
      "partidas_jugadas": 5,
      "primeros": 2,
      "segundos": 1,
      "ultimos": 1,
      "total_puntos": 1540,
      "promedio_puntos": 308,
      "puntos_generales": 9
    }
  ]
}
```

### Jugadores

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/jugadores` | Listar (query: `search`, `activo`) |
| GET | `/api/v1/jugadores/:id` | Obtener por ID |
| POST | `/api/v1/jugadores` | Crear (`nombre` requerido, `apodo`, `email` opcionales) |
| PUT | `/api/v1/jugadores/:id` | Editar |
| DELETE | `/api/v1/jugadores/:id` | Eliminar (soft delete) |
| GET | `/api/v1/jugadores/:id/historial` | Historial y estadísticas del jugador |

### Partidas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/partidas` | Listar (query: `jugador_id`, `desde`, `hasta`) |
| GET | `/api/v1/partidas/:id` | Detalle con jugadores y posiciones |
| POST | `/api/v1/partidas` | Crear (mínimo 2 jugadores con `jugador_id` y `puntos`) |
| PUT | `/api/v1/partidas/:id` | Editar |
| DELETE | `/api/v1/partidas/:id` | Eliminar (soft delete) |

**Body para crear/editar partida:**
```json
{
  "fecha": "2026-06-21T20:00:00Z",
  "notas": "Partida del sábado",
  "jugadores": [
    { "jugador_id": 1, "puntos": 450 },
    { "jugador_id": 2, "puntos": 300 },
    { "jugador_id": 3, "puntos": 150 }
  ]
}
```

## Formato de respuesta

Todas las respuestas siguen el mismo envelope:

```json
{ "status": "ok", "data": { ... } }
{ "status": "error", "message": "...", "details": "..." }
```

## Rate limiting

200 requests por IP cada 15 minutos (configurable en `src/app.js`).
