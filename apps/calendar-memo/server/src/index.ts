import express from 'express';
import cors from 'cors';
import { join } from 'path';

import memosRouter from './routes/memoes';
import tagsRouter from './routes/tags';
import uploadRouter from './routes/upload';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件 - CORS 配置
const corsOrigin = process.env.CORS_ORIGIN 
  ? (process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN.split(','))
  : (process.env.NODE_ENV === 'production' 
    ? false 
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']);

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/memos', memosRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/upload', uploadRouter);

// 404 处理
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: '接口不存在' });
});

// 全局错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ 
    success: false, 
    error: 'INTERNAL_ERROR', 
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误' 
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Database] PostgreSQL via Prisma`);
});
