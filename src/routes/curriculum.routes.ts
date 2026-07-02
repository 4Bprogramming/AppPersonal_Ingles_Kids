import { Router } from 'express';
import multer from 'multer';
import { query } from '../db/pool.js';
import { authMiddleware, familyGuard, type AuthRequest } from '../middleware/auth.js';
import { aiContentGenerator } from '../services/ai/AIContentGenerator.js';
import { prepareImageFromBase64, prepareImageFromMulter } from '../services/ai/imageUtils.js';
import type { Child, ChildInterests, Unit } from '../types/index.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const curriculumRouter = Router();

curriculumRouter.use(authMiddleware);

/** GET /curriculum/:childId */
curriculumRouter.get('/:childId', familyGuard, async (req, res) => {
  const { childId } = req.params;
  const { rows } = await query(
    'SELECT * FROM curricula WHERE child_id = $1 ORDER BY generated_at DESC LIMIT 1',
    [childId],
  );
  res.json({ curriculum: rows[0] ?? null });
});

/**
 * POST /curriculum/:childId/scan
 * 📸 Escanear Programa Completo (Crear Mapa)
 * Acepta JSON { imageBase64, mimeType } (Expo/RN) o multipart campo image.
 */
curriculumRouter.post(
  '/:childId/scan',
  familyGuard,
  (req, res, next) => {
    const contentType = req.headers['content-type'] ?? '';
    if (contentType.includes('multipart/form-data')) {
      upload.single('image')(req, res, next);
      return;
    }
    next();
  },
  async (req: AuthRequest, res) => {
    const childId = String(req.params.childId);
    const file = req.file;
    const body = req.body as { imageBase64?: string; mimeType?: string };

    let prepared;
    if (file) {
      prepared = prepareImageFromMulter(file);
    } else if (body.imageBase64) {
      prepared = prepareImageFromBase64(body.imageBase64, body.mimeType ?? 'image/jpeg');
    } else {
      res.status(400).json({ error: 'Imagen requerida (imageBase64 o campo image)' });
      return;
    }

    const childResult = await query<Child>('SELECT * FROM children WHERE id = $1', [childId]);
    const child = childResult.rows[0];
    if (!child) {
      res.status(404).json({ error: 'Hijo no encontrado' });
      return;
    }

    const interests = (typeof child.interests === 'string'
      ? JSON.parse(child.interests)
      : child.interests) as ChildInterests;

    const result = await aiContentGenerator.generateCurriculumFromIndex({
      childId,
      imageBase64: prepared.base64,
      imageBuffer: prepared.buffer,
      mimeType: prepared.mimeType,
      childName: child.name,
      childAge: child.age ?? 7,
      interests,
      bookTitle: 'Small Big Things 1',
    });

    if (!result.success) {
      res.status(422).json({ error: result.error, units: [] });
      return;
    }

    const book = child.book ?? 'small_big_things_1';
    const units = result.units as Unit[];

    const saved = await query(
      `INSERT INTO curricula (child_id, book, units, generated_from_image)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (child_id, book) DO UPDATE SET
         units = EXCLUDED.units,
         generated_from_image = TRUE,
         generated_at = NOW()
       RETURNING *`,
      [childId, book, JSON.stringify(units)],
    );

    res.status(201).json({
      success: true,
      curriculum: saved.rows[0],
      unitsCount: units.length,
    });
  },
);
