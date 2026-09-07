// Storage abstraction: local filesystem now, swap to R2/S3 for worldwide CDN later
// No community backend - your own implementation
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
export const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure dirs exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// For free worldwide CDN later: set STORAGE_TYPE=r2 and configure S3 compatible
// This file is the only place you need to change to switch to R2/S3
export const storage = {
  type: process.env.STORAGE_TYPE || 'local', // 'local' | 'r2'
  
  // Returns public URL for file. For local, it's /files/:name . For R2, it's CDN URL
  getFileUrl(filename) {
    if (this.type === 'r2') {
      return `${process.env.CDN_BASE_URL}/${filename}`;
    }
    return `/files/${filename}`;
  },
  
  async saveFile(buffer, filename) {
    if (this.type === 'local') {
      const filepath = path.join(UPLOAD_DIR, filename);
      await fs.promises.writeFile(filepath, buffer);
      return filename;
    }
    // TODO: Add R2/S3 upload via @aws-sdk/client-s3 when you migrate to free R2
    throw new Error('R2 storage not configured. Set STORAGE_TYPE=local or implement S3 upload');
  }
};
