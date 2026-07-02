import { OAuth2Client } from 'google-auth-library';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import type { User } from '../types/index.js';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface AuthRequest extends Request {
  user?: User;
}

export async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = await verifyGoogleToken(token);
    if (!payload?.sub || !payload.email) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    const { rows } = await query<User>(
      'SELECT id, google_id, email, display_name, avatar_url, family_id FROM users WHERE google_id = $1',
      [payload.sub],
    );

    if (!rows[0]) {
      res.status(403).json({ error: 'Usuario no registrado. Iniciá sesión con Google primero.' });
      return;
    }

    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/** Verifica que el child_id pertenezca al family_id del usuario autenticado */
export async function assertChildBelongsToFamily(
  childId: string,
  familyId: string,
): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    'SELECT id FROM children WHERE id = $1 AND family_id = $2',
    [childId, familyId],
  );
  return Boolean(rows[0]);
}

export async function familyGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const raw = req.params.childId ?? req.body.childId;
  const childId = Array.isArray(raw) ? raw[0] : raw;
  if (!childId || !req.user) {
    res.status(400).json({ error: 'childId requerido' });
    return;
  }

  const ok = await assertChildBelongsToFamily(childId, req.user.family_id);
  if (!ok) {
    res.status(403).json({ error: 'Acceso denegado: hijo no pertenece a tu familia' });
    return;
  }
  next();
}
