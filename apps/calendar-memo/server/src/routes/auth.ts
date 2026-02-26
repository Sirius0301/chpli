import { Router } from 'express';
import { CodeType } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// 腾讯云 SES/SMS 配置（实际项目中使用）
const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID;
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY;
const SMS_SIGN_NAME = process.env.SMS_SIGN_NAME;
const SMS_TEMPLATE_ID = process.env.SMS_TEMPLATE_ID;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;

// 是否是开发环境
const isDev = process.env.NODE_ENV !== 'production';

// ============ 验证 Schema ============

const sendCodeSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  type: z.enum(['REGISTER', 'RESET_PASSWORD', 'CHANGE_PASSWORD']),
}).refine(data => data.email || data.phone, {
  message: '邮箱或手机号至少提供一个',
});

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  code: z.string().length(6),
  password: z.string().min(8),
  name: z.string().min(1).max(50),
}).refine(data => data.email || data.phone, {
  message: '邮箱或手机号至少提供一个',
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  password: z.string().min(1),
}).refine(data => data.email || data.phone, {
  message: '邮箱或手机号至少提供一个',
});

const resetPasswordSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
}).refine(data => data.email || data.phone, {
  message: '邮箱或手机号至少提供一个',
});

const changePasswordSchema = z.object({
  code: z.string().length(6),
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// ============ 工具函数 ============

// 生成 6 位数字验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成 JWT Token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// 验证 JWT Token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// 检查密码强度
function validatePassword(password: string): { valid: boolean; message?: string } {
  // 长度检查
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }

  // 必须包含中英文（至少一种）
  const hasEnglish = /[a-zA-Z]/.test(password);
  const hasChinese = /[\u4e00-\u9fa5]/.test(password);
  if (!hasEnglish && !hasChinese) {
    return { valid: false, message: '密码必须包含中文或英文字符' };
  }

  // 必须包含数字
  if (!/\d/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }

  // 必须包含特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: '密码必须包含特殊字符（如!@#$等）' };
  }

  return { valid: true };
}

// 发送验证码（模拟/实际）
async function sendVerificationCode(
  email: string | undefined,
  phone: string | undefined,
  code: string,
  type: string
): Promise<{ success: boolean; devCode?: string; message?: string }> {
  const typeName = {
    'REGISTER': '注册',
    'RESET_PASSWORD': '重置密码',
    'CHANGE_PASSWORD': '修改密码',
  }[type] || '验证';

  // 开发环境：直接返回验证码
  if (isDev) {
    console.log(`[Dev] ${typeName} 验证码: ${code} -> ${email || phone}`);
    return { success: true, devCode: code };
  }

  // 生产环境：调用腾讯云 SES/SMS
  try {
    if (phone && TENCENT_SECRET_ID && TENCENT_SECRET_KEY) {
      // 发送短信验证码
      // const tencentcloud = require('tencentcloud-sdk-nodejs');
      // const smsClient = new tencentcloud.sms.v20210111.Client({...});
      // await smsClient.SendSms({...});
      console.log(`[SMS] 发送验证码到 ${phone}: ${code}`);
      return { success: true };
    } else if (email && TENCENT_SECRET_ID && TENCENT_SECRET_KEY) {
      // 发送邮件验证码
      // const SesClient = require('tencentcloud-sdk-nodejs').ses.v20201002.Client;
      // await sesClient.SendEmail({...});
      console.log(`[Email] 发送验证码到 ${email}: ${code}`);
      return { success: true };
    } else {
      return { success: false, message: '短信/邮件服务未配置' };
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    return { success: false, message: '发送失败，请稍后重试' };
  }
}

// 认证中间件
export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: '请先登录',
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: '登录已过期，请重新登录',
    });
  }

  req.userId = decoded.userId;
  next();
}

// ============ API 路由 ============

/**
 * POST /auth/send-code
 * 发送验证码
 */
router.post('/send-code', async (req, res) => {
  try {
    const result = sendCodeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.issues[0].message,
      });
    }

    const { email, phone, type } = result.data;
    const contact = email || phone;

    // 检查验证码频率限制（每小时5次）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await prisma.verificationCode.count({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
        type: type as CodeType,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCodes >= 5) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT',
        message: '发送过于频繁，请稍后再试',
      });
    }

    // 生成验证码
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟过期

    // 保存验证码到数据库
    await prisma.verificationCode.create({
      data: {
        email: email || null,
        phone: phone || null,
        code,
        type: type as CodeType,
        expiresAt,
      },
    });

    // 发送验证码
    const sendResult = await sendVerificationCode(email, phone, code, type);

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        error: 'SEND_FAILED',
        message: sendResult.message || '发送失败',
      });
    }

    res.json({
      success: true,
      message: '验证码已发送',
      ...(isDev && { code: sendResult.devCode }), // 开发环境返回验证码
    });
  } catch (error) {
    console.error('[Send Code Error]', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    });
  }
});

/**
 * POST /auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.issues[0].message,
      });
    }

    const { email, phone, code, password, name } = result.data;

    // 验证密码强度
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: passwordCheck.message,
      });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'USER_EXISTS',
        message: '该邮箱或手机号已注册',
      });
    }

    // 验证验证码
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
        code,
        type: CodeType.REGISTER,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message: '验证码错误或已过期',
      });
    }

    // 标记验证码为已使用
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    // 生成 JWT
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: '注册成功',
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    });
  }
});

/**
 * POST /auth/login
 * 用户登录（支持邮箱或手机号）
 */
router.post('/login', async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.issues[0].message,
      });
    }

    const { email, phone, password } = result.data;

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    // 统一错误提示（不暴露具体字段）
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: '账号或密码错误',
      });
    }

    // 检查账号状态
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: '账号已被禁用',
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: '账号或密码错误',
      });
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 生成 JWT
    const token = generateToken(user.id);

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: '登录成功',
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    });
  }
});

/**
 * POST /auth/reset-password
 * 重置密码（忘记密码）
 */
router.post('/reset-password', async (req, res) => {
  try {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.issues[0].message,
      });
    }

    const { email, phone, code, newPassword } = result.data;

    // 验证密码强度
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: passwordCheck.message,
      });
    }

    // 验证验证码
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
        code,
        type: CodeType.RESET_PASSWORD,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message: '验证码错误或已过期',
      });
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    // 标记验证码为已使用
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: '密码重置成功',
    });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    });
  }
});

/**
 * POST /auth/change-password
 * 修改密码（需登录）
 */
router.post('/change-password', authMiddleware, async (req: any, res) => {
  try {
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.issues[0].message,
      });
    }

    const { code, oldPassword, newPassword } = result.data;
    const userId = req.userId;

    // 验证密码强度
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: passwordCheck.message,
      });
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    // 验证旧密码
    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidOldPassword) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_PASSWORD',
        message: '原密码错误',
      });
    }

    // 验证验证码
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        OR: [
          { email: user.email || undefined },
          { phone: user.phone || undefined },
        ],
        code,
        type: CodeType.CHANGE_PASSWORD,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message: '验证码错误或已过期',
      });
    }

    // 标记验证码为已使用
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('[Change Password Error]', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    });
  }
});

/**
 * GET /auth/me
 * 获取当前用户信息
 */
router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[Get Me Error]', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    });
  }
});

export default router;
