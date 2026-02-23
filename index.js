/*
╔══════════════════════════════════════════════╗
║          🤖 RESBOT TELEGRAM                  ║
╠══════════════════════════════════════════════╣
║ 📦 Version    : 1.0.0                       ║
║ 👨‍💻 Developer  : Azhari Creative             ║
║ 🌐 Website    : https://autoresbot.com      ║
║ 📡 Platform   : Telegram Bot API            ║
╚══════════════════════════════════════════════╝
*/

import 'dotenv/config';
import './lib/version.js';
import { clearDirectory } from './lib/utils.js';

console.log(`[✔] Starting Resbot Telegram...`);

// ─── Cek versi Node ───────────────────────────────
const [major] = process.versions.node.split('.').map(Number);

if (major < 18) {
  console.error(`❌ Script ini membutuhkan Node.js versi 18 atau lebih tinggi.`);
  console.error(`ℹ️ Versi Node.js kamu saat ini: ${process.versions.node}`);
  setTimeout(() => process.exit(1), 60_000);
} else {
  process.env.TZ = 'Asia/Jakarta';

  const config = (await import('./config.js')).default;

  // ─── Start App ───────────────────────────────────
  try {
    // Bersihkan folder tmp saat startup
    clearDirectory('./tmp');

    // Jalankan setiap 3 jam (3 jam = 10800000 ms)
    setInterval(() => {
      console.log('[SCHEDULE] Membersihkan folder tmp...');
      clearDirectory('./tmp');
    }, 3 * 60 * 60 * 1000);

    console.log('[✔] Cache cleaned successfully.');

    // Import dan jalankan startup
    const { start_app } = await import('./lib/startup.js');
    await start_app();
  } catch (err) {
    console.error('Error dalam proses start_app:', err.message);
    process.exit(1);
  }

  // ─── Error Handler ───────────────────────────────
  process.on('uncaughtException', async (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    // Jangan langsung exit untuk Telegram polling, cukup log
  });
}
