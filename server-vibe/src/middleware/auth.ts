import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      error: 'Autenticación requerida. Token Bearer ausente.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!supabaseAdmin) {
    // Si no está configurado Supabase service_role, permitir en desarrollo local identificando un usuario genérico
    req.userId = 'dev-user';
    return next();
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        ok: false,
        error: 'Token inválido o expirado.',
        code: 'INVALID_TOKEN',
      });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al verificar autenticación';
    return res.status(500).json({
      ok: false,
      error: message,
      code: 'AUTH_VERIFICATION_ERROR',
    });
  }
}
