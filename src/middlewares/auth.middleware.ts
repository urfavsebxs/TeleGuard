import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  const cookieToken = req.cookies?.authToken; // Obtener token de cookie
  const validApiKey = process.env.API_SECRET;
  const jwtSecret = process.env.JWT_SECRET || 'tu_secreto_jwt_aqui';

  // 1. Intentar con token de cookie (prioridad para dashboard)
  if (cookieToken) {
    try {
      const decoded = jwt.verify(cookieToken, jwtSecret);
      (req as any).user = decoded;
      return next();
    } catch (error) {
      // Cookie inválida, continuar con otros métodos
    }
  }

  // 2. Intentar con JWT en Authorization header
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, jwtSecret);
      (req as any).user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token JWT inválido o expirado',
      });
    }
  }

  // 3. Si no hay JWT, intentar con API Key (para integraciones externas)
  if (apiKey) {
    if (!validApiKey) {
      console.warn('⚠️  API_SECRET no está configurada');
      return next();
    }

    if (apiKey !== validApiKey) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'API key inválida',
      });
    }

    return next();
  }

  // Si no hay ninguno, rechazar
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Se requiere autenticación (Cookie, Bearer token o X-API-Key)',
  });
};
