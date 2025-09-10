import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import { CONFIG } from '../config/env';

export async function downloadWithRetry(
  url: string,
  filePath: string,
  retries: number = CONFIG.MAX_RETRIES // assumes a `config` object is in scope
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const fileHash = await new Promise<string>((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const fileStream = fs.createWriteStream(filePath);

        const request = https.get(url, { timeout: CONFIG.DOWNLOAD_TIMEOUT_MS }, response => {
          response.on('data', (chunk: Buffer) => hash.update(chunk));
          response.pipe(fileStream);
        });

        request.on('error', error => {
          // remove partially written file
          fs.unlink(filePath, () => {});
          reject(error);
        });

        fileStream.on('finish', () => {
          fileStream.close(() => {
            resolve(hash.digest('hex'));
          });
        });

        fileStream.on('error', error => {
          fs.unlink(filePath, () => {});
          reject(error);
        });
      });

      const stats = fs.statSync(filePath);
      if (stats.size < 1024) {
        throw new Error('Downloaded file is too small');
      }

      return fileHash;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // exponential backoff: attempt * delay
      await new Promise(res => setTimeout(res, attempt * CONFIG.RETRY_DELAY_MS));
    }
  }
  throw new Error('Unexpected fallthrough in downloadWithRetry');
}
