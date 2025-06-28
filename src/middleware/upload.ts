import multer from 'multer';
import { UPLOAD_CONFIG } from '../config/s3';


const storage = multer.memoryStorage();


const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};


export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.maxFileSize,
  },
});