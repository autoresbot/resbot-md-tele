/*
╔══════════════════════════════════════════════╗
║    🤖 RESBOT TELEGRAM - Handler System       ║
╠══════════════════════════════════════════════╣
║ Sistem handler yang menjalankan pre-process  ║
║ pada setiap pesan masuk sebelum diteruskan   ║
║ ke plugin system.                            ║
╚══════════════════════════════════════════════╝
*/

import fs from 'fs';
import path from 'path';
import config from '../config.js';
import { logWithTime } from './utils.js';
import { pathToFileURL } from 'url';

const mode = config.mode;
const handlers = [];

/**
 * Fungsi rekursif untuk membaca semua file `.js` dari folder `handle/`
 */
async function loadHandlers(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`[INFO] Handler directory tidak ditemukan: ${dir}`);
    return;
  }

  const files = await fs.promises.readdir(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = await fs.promises.stat(fullPath);

    if (stats.isDirectory()) {
      await loadHandlers(fullPath);
    } else if (file.endsWith('.js')) {
      try {
        const module = await import(pathToFileURL(fullPath).href + `?update=${Date.now()}`);
        const handler = module.default || module;

        if (typeof handler.process === 'function') {
          if (typeof handler.priority === 'undefined') {
            handler.priority = 100;
          }
          handlers.push(handler);
        }
      } catch (err) {
        console.error(`❌ Gagal load handler ${fullPath}:`, err.message);
      }
    }
  }
}

/**
 * Inisialisasi handler - load semua dan urutkan berdasarkan priority
 */
export async function initHandlers() {
  const handleDir = path.join(process.cwd(), 'handle');
  if (fs.existsSync(handleDir)) {
    await loadHandlers(handleDir);
    handlers.sort((a, b) => a.priority - b.priority);
    console.log(`[✔] Load All Handler done... (${handlers.length} handlers)`);
  } else {
    console.log(`[INFO] Folder "handle" tidak ditemukan, skip loading handlers.`);
  }
}

/**
 * Pre-process: Jalankan semua handler sebelum plugin
 * Return false jika handler memutus
 */
export async function preProcess(bot, messageInfo) {
  let stopProcessing = false;

  for (const handler of handlers) {
    if (stopProcessing) break;

    try {
      const result = await handler.process(bot, messageInfo);

      if (result === false) {
        logWithTime(
          'System',
          `Handler ${handler.name || 'anonymous'} menghentikan pemrosesan.`,
        );
        stopProcessing = true;
        return false;
      }
    } catch (error) {
      console.error(`Error pada handler ${handler.name || 'anonymous'}:`, error.message);
    }
  }

  return true;
}

export default {
  initHandlers,
  preProcess,
  handlers,
};
