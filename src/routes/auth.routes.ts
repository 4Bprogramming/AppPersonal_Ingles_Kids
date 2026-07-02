import { Router } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, verifyGoogleToken, type AuthRequest } from '../middleware/auth.js';
import type { User } from '../types/index.js';

export const authRouter = Router();

/** POST /auth/google — login/registro con ID token del SDK móvil */
authRouter.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: 'idToken requerido' });
    return;
  }

  try {
    const payload = await verifyGoogleToken(idToken);
    if (!payload?.sub || !payload.email) {
      res.status(401).json({ error: 'Token Google inválido' });
      return;
    }

    const existing = await query<User>(
      'SELECT * FROM users WHERE google_id = $1',
      [payload.sub],
    );

    if (existing.rows[0]) {
      res.json({ user: existing.rows[0], isNew: false });
      return;
    }

    // ¿Hay invitación pendiente para este email?
    const invite = await query<{ family_id: string }>(
      `SELECT family_id FROM family_invites
       WHERE invited_email = $1 AND status = 'pending' LIMIT 1`,
      [payload.email.toLowerCase()],
    );

    let familyId: string;

    if (invite.rows[0]) {
      familyId = invite.rows[0].family_id;
      await query(
        `UPDATE family_invites SET status = 'accepted'
         WHERE invited_email = $1 AND family_id = $2`,
        [payload.email.toLowerCase(), familyId],
      );
    } else {
      const family = await query<{ id: string }>(
        `INSERT INTO families (name) VALUES ($1) RETURNING id`,
        [`Familia ${payload.family_name ?? payload.email}`],
      );
      familyId = family.rows[0].id;
    }

    const user = await query<User>(
      `INSERT INTO users (google_id, email, display_name, avatar_url, family_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, google_id, email, display_name, avatar_url, family_id`,
      [
        payload.sub,
        payload.email.toLowerCase(),
        payload.name ?? null,
        payload.picture ?? null,
        familyId,
      ],
    );

    res.status(201).json({ user: user.rows[0], isNew: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en autenticación Google' });
  }
});

authRouter.get('/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});
