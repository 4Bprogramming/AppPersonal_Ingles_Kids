import { Router } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, familyGuard, type AuthRequest } from '../middleware/auth.js';
import { teacherModeService } from '../services/ai/gemini/TeacherModeService.js';
import { isGeminiConfigured } from '../services/ai/gemini/client.js';
import type { Child, ChildInterests } from '../types/index.js';

export const aiRouter = Router();

aiRouter.use(authMiddleware);

/**
 * POST /ai/teacher/:childId/evaluate
 * Teacher Mode — gemini-1.5-flash con responseSchema
 */
aiRouter.post('/teacher/:childId/evaluate', familyGuard, async (req: AuthRequest, res) => {
  if (!isGeminiConfigured()) {
    res.status(503).json({ error: 'GEMINI_API_KEY no configurada' });
    return;
  }

  const childId = String(req.params.childId);
  const { questionPrompt, expectedAnswer, studentAnswer, unitTitle } = req.body;

  if (!questionPrompt || !expectedAnswer || studentAnswer === undefined) {
    res.status(400).json({ error: 'questionPrompt, expectedAnswer y studentAnswer son requeridos' });
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

  try {
    const feedback = await teacherModeService.evaluateAnswer({
      childName: child.name,
      childAge: child.age ?? 7,
      interests,
      questionPrompt,
      expectedAnswer,
      studentAnswer: String(studentAnswer),
      unitTitle,
    });

    res.json({ feedback });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Error en Teacher Mode',
    });
  }
});
