import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ==================== 共享配置 ====================

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_ALGORITHM = 'HS256';

// ==================== 共享类型 ====================

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar?: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JWTPayload {
  userId: string;
}

// ==================== 工具函数 ====================

/**
 * 生成 JWT Token
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Express 认证中间件
 * 验证请求头中的 Bearer Token，并将 userId 附加到 req 对象
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: '请先登录',
    });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: '登录已过期，请重新登录',
    });
    return;
  }

  (req as any).userId = decoded.userId;
  next();
}
