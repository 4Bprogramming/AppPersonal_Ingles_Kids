import { Router } from 'express';
import { query } from '../db/pool.js';
import { DEFAULT_BENJA_INTERESTS, VOICE_DEFAULT_TOLERANCE } from '../config/constants.js';
import { authMiddleware, familyGuard, type AuthRequest } from '../middleware/auth.js';
import type { Child, ChildInterests } from '../types/index.js';

export const childrenRouter = Router();

childrenRouter.use(authMiddleware);

/** GET /children — todos los hijos de la familia (ilimitados) */
childrenRouter.get('/', async (req: AuthRequest, res) => {
  if (!req.user) return;
  const { rows } = await query<Child>(
    `SELECT * FROM children WHERE family_id = $1 ORDER BY created_at ASC`,
    [req.user.family_id],
  );
  res.json({ children: rows });
});

/** POST /children — [+] Añadir Nuevo Hijo */
childrenRouter.post('/', async (req: AuthRequest, res) => {
  if (!req.user) return;

  const {
    name,
    age,
    school_level = '1_grado',
    book = 'small_big_things_1',
    avatar = '⚽',
    interests = {},
  } = req.body;

  if (!name) {
    res.status(400).json({ error: 'name es requerido' });
    return;
  }

  const mergedInterests: ChildInterests = {
    ...DEFAULT_BENJA_INTERESTS,
    ...interests,
    family: { ...DEFAULT_BENJA_INTERESTS.family, ...(interests.family ?? {}) },
  };

  try {
    const child = await query<Child>(
      `INSERT INTO children (family_id, name, age, school_level, book, avatar, interests)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.family_id, name, age ?? null, school_level, book, avatar, JSON.stringify(mergedInterests)],
    );

    const childId = child.rows[0].id;

    // Estado inicial: mapa vacío + mochila vacía
    await query(
      `INSERT INTO child_progress (child_id, current_unit_id, unlocked_units, mic_tolerance)
       VALUES ($1, 'unit-1', '["unit-1"]', $2)`,
      [childId, VOICE_DEFAULT_TOLERANCE],
    );

    res.status(201).json({ child: child.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo crear el hijo' });
  }
});

/** PATCH /children/:childId — actualizar perfil */
childrenRouter.patch('/:childId', familyGuard, async (req: AuthRequest, res) => {
  const { childId } = req.params;
  const { name, age, school_level, avatar, interests, book } = req.body;

  const { rows } = await query<Child>(
    `UPDATE children SET
       name = COALESCE($2, name),
       age = COALESCE($3, age),
       school_level = COALESCE($4, school_level),
       avatar = COALESCE($5, avatar),
       interests = COALESCE($6, interests),
       book = COALESCE($7, book),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      childId,
      name,
      age,
      school_level,
      avatar,
      interests ? JSON.stringify(interests) : null,
      book,
    ],
  );

  res.json({ child: rows[0] });
});

childrenRouter.get('/:childId/progress', familyGuard, async (req, res) => {
  const { childId } = req.params;
  const { rows } = await query(
    'SELECT * FROM child_progress WHERE child_id = $1',
    [childId],
  );
  const backpack = await query(
    'SELECT * FROM backpack_items WHERE child_id = $1 ORDER BY added_at DESC',
    [childId],
  );
  res.json({ progress: rows[0], backpack: backpack.rows });
});

childrenRouter.patch('/:childId/mic-tolerance', familyGuard, async (req, res) => {
  const { childId } = req.params;
  const { tolerance } = req.body;
  const { rows } = await query(
    `UPDATE child_progress SET mic_tolerance = $2, updated_at = NOW()
     WHERE child_id = $1 RETURNING mic_tolerance`,
    [childId, tolerance],
  );
  res.json({ mic_tolerance: rows[0]?.mic_tolerance });
});

childrenRouter.post('/:childId/backpack', familyGuard, async (req, res) => {
  const { childId } = req.params;
  const { word, context, unit_id, activity_id, attempts } = req.body;
  const { rows } = await query(
    `INSERT INTO backpack_items (child_id, word, context, unit_id, activity_id, attempts)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [childId, word, context, unit_id, activity_id, attempts ?? 3],
  );
  res.status(201).json({ item: rows[0] });
});

childrenRouter.patch('/:childId/backpack/:itemId/release', familyGuard, async (req, res) => {
  const { itemId } = req.params;
  await query('UPDATE backpack_items SET released = TRUE WHERE id = $1', [itemId]);
  res.json({ success: true });
});
