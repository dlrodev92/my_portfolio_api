import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const s3 = new AWS.S3();


export const S3_CONFIG = {
  bucketName: process.env.AWS_S3_BUCKET_NAME!,
  region: process.env.AWS_REGION!,
  baseUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
};

export const S3_FOLDERS = {
  projects: 'portfolio/projects',
  blog: 'portfolio/blog',
  general: 'portfolio/general',
};


export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
};