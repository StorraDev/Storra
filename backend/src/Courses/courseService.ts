import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { s3 } from '../utils/awss3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export const uploadFileToS3 = async (file: Express.Multer.File): Promise<string> => {
  try {
    const fileStream = fs.createReadStream(file.path);
    const key = `courses/${uuidv4()}-${path.basename(file.originalname)}`;

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
        // Add metadata
        Metadata: {
          'original-name': file.originalname,
          'upload-date': new Date().toISOString()
        }
      }
    });

    // Monitor upload progress (optional)
    upload.on('httpUploadProgress', (progress) => {
      console.log(`Upload progress: ${Math.round((progress.loaded! / progress.total!) * 100)}%`);
    });

    await upload.done();
    
    // Clean up temporary file
    fs.unlinkSync(file.path);

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    // Clean up temporary file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};