/*
╔══════════════════════════════════════════════╗
║    🤖 RESBOT TELEGRAM - Logger               ║
╠══════════════════════════════════════════════╣
║ Sistem logging menggunakan Winston.           ║
╚══════════════════════════════════════════════╝
*/

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Buat folder logs jika belum ada
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }),
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '7d',
    }),
  ],
});

/**
 * Log kustom ke file tertentu
 */
function logCustom(level, message, fileName) {
  try {
    const logFilePath = path.join(logDir, fileName);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
    fs.appendFileSync(logFilePath, logEntry);
  } catch (error) {
    console.error('Error writing custom log:', error.message);
  }
}

export { logger, logCustom };
