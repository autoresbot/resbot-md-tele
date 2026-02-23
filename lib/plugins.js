/*
╔══════════════════════════════════════════════╗
║    🤖 RESBOT TELEGRAM - Plugin Loader        ║
╠══════════════════════════════════════════════╣
║ Memuat semua plugin dari folder plugins/     ║
║ secara rekursif. Setiap plugin harus export  ║
║ default dengan Commands[], handle(), dan     ║
║ properti opsional lainnya.                   ║
╚══════════════════════════════════════════════╝
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginsPath = path.join(process.cwd(), 'plugins');
let plugins = [];

/**
 * Memuat plugin secara rekursif dari sebuah direktori
 */
async function loadPlugins(directory) {
  const loadedPlugins = [];

  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        const subPlugins = await loadPlugins(fullPath);
        loadedPlugins.push(...subPlugins);
      } else if (file.endsWith('.js')) {
        try {
          const plugin = await import(
            pathToFileURL(fullPath).href + '?cacheBust=' + Date.now()
          );
          const pluginData = plugin.default || plugin;

          // Validasi bahwa plugin memiliki format yang benar
          if (pluginData.Commands && Array.isArray(pluginData.Commands) && typeof pluginData.handle === 'function') {
            loadedPlugins.push(pluginData);
          } else {
            console.warn(`⚠️ Plugin ${file} tidak memiliki Commands[] atau handle(). Skip.`);
          }
        } catch (error) {
          console.error(`❌ ERROR: Gagal memuat plugin: ${fullPath} : ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ ERROR: Gagal membaca direktori: ${directory} - ${error.message}`);
  }

  return loadedPlugins;
}

/**
 * Reload semua plugin
 */
async function reloadPlugins() {
  plugins = await loadPlugins(pluginsPath);
  if (plugins.length === 0) {
    console.warn('⚠️ WARNING: Tidak ada plugin yang dimuat.');
  }
  return plugins;
}

export { reloadPlugins };
