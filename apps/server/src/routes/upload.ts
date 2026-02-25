import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const router = Router();

// 确保上传目录存在
const UPLOAD_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG/PNG/GIF 格式'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/upload
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'NO_FILE', message: '未上传文件' });
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        url,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'UPLOAD_ERROR' });
  }
});

// 错误处理中间件
router.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'FILE_TOO_LARGE', message: '文件超过 5MB 限制' });
    }
  }
  if (err.message === '仅支持 JPG/PNG/GIF 格式') {
    return res.status(415).json({ success: false, error: 'INVALID_FILE_TYPE', message: err.message });
  }
  res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
});

export default router;
