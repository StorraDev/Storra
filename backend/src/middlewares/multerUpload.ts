import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure temp directory exists
const tempDir = 'temp/';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// File filter to accept only videos and PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only videos and PDFs are allowed.'));
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 
}
});
