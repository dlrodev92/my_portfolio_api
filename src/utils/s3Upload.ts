import { s3, S3_CONFIG, S3_FOLDERS, UPLOAD_CONFIG } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface FileUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}


export const uploadFileToS3 = async (
  file: FileUpload,
  folder: keyof typeof S3_FOLDERS
): Promise<UploadResult> => {
  try {
    
    if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      return {
        success: false,
        error: `File type ${file.mimetype} not allowed`,
      };
    }

    
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return {
        success: false,
        error: `File size ${file.size} exceeds limit of ${UPLOAD_CONFIG.maxFileSize}`,
      };
    }

    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const s3Key = `${S3_FOLDERS[folder]}/${uniqueFilename}`;

    // Upload parameters
    const uploadParams = {
      Bucket: S3_CONFIG.bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', 
    };

    
    const result = await s3.upload(uploadParams).promise();

    return {
      success: true,
      url: result.Location,
      key: s3Key,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};


export const uploadMultipleFilesToS3 = async (
  files: FileUpload[],
  folder: keyof typeof S3_FOLDERS
): Promise<UploadResult[]> => {
  const uploadPromises = files.map(file => uploadFileToS3(file, folder));
  return Promise.all(uploadPromises);
};


export const deleteFileFromS3 = async (key: string): Promise<boolean> => {
  try {
    await s3.deleteObject({
      Bucket: S3_CONFIG.bucketName,
      Key: key,
    }).promise();
    
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    return false;
  }
};