/* eslint-disable no-console */
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import ffmpegStatic from 'ffmpeg-static';
import { v4 as uuidv4 } from 'uuid';


ffmpeg.setFfprobePath(ffprobeStatic.path);
ffmpeg.setFfmpegPath(ffmpegStatic!);
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface UploadResponse {
  Location: string;
}

const s3Client = new S3Client({
  region: 'us-east-1', // Set any valid region
  endpoint: `${process.env.DO_SPACE_ENDPOINT}`,
  credentials: {
    accessKeyId: `${process.env.DO_SPACE_ACCESS_KEY}`,
    secretAccessKey: `${process.env.DO_SPACE_SECRET_KEY}`,
  },
});


export const uploadVideoToDigitalOcean = async (
  file: Express.Multer.File
): Promise<{ Location: string; duration: number }> => {
  try {
    const fileName = file.originalname.replace(/\s+/g, '-');
    const tempPath = `/tmp/${fileName}`;

    // Write file temporarily to disk
    await fs.promises.writeFile(tempPath, new Uint8Array(file.buffer));

    // Extract video duration
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(tempPath, (err: any, metadata: any) => {
        if (err) return reject(err);
        const seconds = metadata.format.duration || 0;
        resolve(seconds);
      });
    });

    // Upload video to DigitalOcean
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.DO_SPACE_BUCKET!,
      Key: fileName,
      Body: fs.createReadStream(tempPath),
      ACL: 'public-read',
      ContentType: file.mimetype,
    });

    await s3Client.send(uploadCommand);

    // Clean up temporary file
    await fs.promises.unlink(tempPath);

    const Location = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${fileName}`;

    return { Location, duration };
  } catch (error) {
    console.error('Video upload failed:', error);
    throw error;
  }
};


// export const uploadToDigitalOceanAWS = async (
//   file: Express.Multer.File,
// ): Promise<UploadResponse> => {
//   try {
//     // ✅ Use buffer directly (no file stream needed)
//     const safeName = file.originalname.replace(/\s+/g, '-');
//     const uniqueKey = `pdfs/${Date.now()}-${uuidv4()}-${safeName}`;
//     const fileName = file.originalname.replace(/\s+/g, '-');

//     // Prepare the upload command
//     const command = new PutObjectCommand({
//       Bucket: `${process.env.DO_SPACE_BUCKET}`,
//       Key: fileName,
//       Body: file.buffer, // ✅ Use buffer directly
//       ACL: 'public-read',
//       ContentType: file.mimetype,
//     });

//     // Execute the upload
//     await s3Client.send(command);

//     const Location = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${uniqueKey}`;

//     return { Location };
//   } catch (error) {
//     console.error(`Error uploading file: ${file.originalname}`, error);
//     throw error;
//   }
// };


export const uploadToDigitalOceanAWS = async (
  file: Express.Multer.File,
): Promise<UploadResponse> => {
  const safeName = file.originalname.replace(/\s+/g, "-");
  const uniqueKey = `pdfs/${Date.now()}-${uuidv4()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.DO_SPACE_BUCKET!,
    Key: uniqueKey,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  const endpointWithoutProtocol = process.env.DO_SPACE_ENDPOINT!.replace(/^https?:\/\//, '');
  const Location = `https://${process.env.DO_SPACE_BUCKET}.${endpointWithoutProtocol}/${uniqueKey}`;

  return { Location };
};


export const deleteFromDigitalOceanAWS = async (
  fileUrl: string,
): Promise<void> => {
  try {
    // Extract the file key from the URL
    const key = fileUrl.replace(
      `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/`,
      '',
    );

    // Prepare the delete command
    const command = new DeleteObjectCommand({
      Bucket: `${process.env.DO_SPACE_BUCKET}`,
      Key: key,
    });

    // Execute the delete command
    await s3Client.send(command);

    console.log(`Successfully deleted file: ${fileUrl}`);
  } catch (error: any) {
    console.error(`Error deleting file: ${fileUrl}`, error);
    throw new Error(`Failed to delete file: ${error?.message}`);
  }
};
