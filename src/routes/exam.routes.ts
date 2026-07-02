import { Router } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, familyGuard } from '../middleware/auth.js';
import { CumulativeExamGenerator } from '../services/exam/CumulativeExamGenerator.js';
import type { BackpackItem, Unit } from '../types/index.js';

export const examRouter = Router();

examRouter.use(authMiddleware);

/** POST /exam/:childId/:unitId/generate */
examRouter.post('/:childId/:unitId/generate', familyGuard, async (req, res) => {
  const childId = String(req.params.childId);
  const unitId = String(req.params.unitId);

  const curriculum = await query<{ units: Unit[] }>(
    'SELECT units FROM curricula WHERE child_id = $1 LIMIT 1',
    [childId],
  );
  const units = curriculum.rows[0]?.units ?? [];
  const parsedUnits = (typeof units === 'string' ? JSON.parse(units) : units) as Unit[];
  const targetUnit = parsedUnits.find((u) => u.id === unitId);

  if (!targetUnit) {
    res.status(404).json({ error: 'Unidad no encontrada en curriculum' });
    return;
  }

  const backpack = await query<BackpackItem>(
    'SELECT * FROM backpack_items WHERE child_id = $1 AND released = FALSE',
    [childId],
  );

  const questions = CumulativeExamGenerator.generate(
    targetUnit,
    parsedUnits,
    backpack.rows,
  );

  res.json({ questions, unitId });
});

/** POST /exam/:childId/:unitId/submit */
examRouter.post('/:childId/:unitId/submit', familyGuard, async (req, res) => {
  const childId = String(req.params.childId);
  const unitId = String(req.params.unitId);
  const { answers, questions, isPractice = false } = req.body;

  const result = CumulativeExamGenerator.evaluate(questions, answers, isPractice);

  await query(
    `INSERT INTO exam_history (child_id, unit_id, score, total_questions, percentage, passed, is_practice)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [childId, unitId, result.score, result.totalQuestions, result.percentage, result.passed, isPractice],
  );

  if (result.passed && !isPractice) {
    const nextUnitNum = parseInt(unitId.replace('unit-', ''), 10) + 1;
    const nextUnitId = `unit-${nextUnitNum}`;

    const progress = await query<{ unlocked_units: string[]; completed_units: string[] }>(
      'SELECT unlocked_units, completed_units FROM child_progress WHERE child_id = $1',
      [childId],
    );
    const unlocked = progress.rows[0]?.unlocked_units ?? ['unit-1'];
    const completed = progress.rows[0]?.completed_units ?? [];

    const newUnlocked = [...new Set([...unlocked, nextUnitId])];
    const newCompleted = [...new Set([...completed, unitId])];

    await query(
      `UPDATE child_progress SET
         current_unit_id = $2,
         unlocked_units = $3,
         completed_units = $4,
         updated_at = NOW()
       WHERE child_id = $1`,
      [childId, nextUnitId, JSON.stringify(newUnlocked), JSON.stringify(newCompleted)],
    );
  }

  res.json({ result });
});

examRouter.get('/:childId/history', familyGuard, async (req, res) => {
  const { childId } = req.params;
  const { rows } = await query(
    'SELECT * FROM exam_history WHERE child_id = $1 ORDER BY attempted_at DESC',
    [childId],
  );
  res.json({ history: rows });
});
