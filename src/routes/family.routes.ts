import { Router } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

export const familyRouter = Router();

familyRouter.use(authMiddleware);

/** POST /family/invite — Papá/Mamá invita al otro progenitor por email Google */
familyRouter.post('/invite', async (req: AuthRequest, res) => {
  const { email } = req.body;
  if (!email || !req.user) {
    res.status(400).json({ error: 'email requerido' });
    return;
  }

  const normalized = String(email).toLowerCase().trim();

  try {
    await query(
      `INSERT INTO family_invites (family_id, invited_email, invited_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (family_id, invited_email) DO UPDATE SET status = 'pending'`,
      [req.user.family_id, normalized, req.user.id],
    );
    res.json({ success: true, message: `Invitación enviada a ${normalized}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo crear la invitación' });
  }
});

familyRouter.get('/members', async (req: AuthRequest, res) => {
  if (!req.user) return;
  const { rows } = await query(
    `SELECT id, email, display_name, avatar_url FROM users WHERE family_id = $1`,
    [req.user.family_id],
  );
  res.json({ members: rows });
});

familyRouter.get('/invites', async (req: AuthRequest, res) => {
  if (!req.user) return;
  const { rows } = await query(
    `SELECT invited_email, status, created_at FROM family_invites WHERE family_id = $1`,
    [req.user.family_id],
  );
  res.json({ invites: rows });
});
