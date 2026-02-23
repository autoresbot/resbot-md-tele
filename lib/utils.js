/*
╔══════════════════════════════════════════════╗
║    🤖 RESBOT TELEGRAM - Utilities            ║
╠══════════════════════════════════════════════╣
║ Kumpulan fungsi utilitas yang digunakan      ║
║ di seluruh project.                          ║
╚══════════════════════════════════════════════╝
*/

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import os from 'os';
import FormData from 'form-data';
import { logger, logCustom } from './logger.js';
import levenshtein from 'fast-levenshtein';
import moment from 'moment-timezone';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();
const tmpFolder = path.resolve('./tmp');
const DatabaseFolder = path.resolve('./database/media');
const mode = config.mode;

// Pastikan folder tmp dan media ada
if (!fs.existsSync(tmpFolder)) {
  fs.mkdirSync(tmpFolder, { recursive: true });
}
if (!fs.existsSync(DatabaseFolder)) {
  fs.mkdirSync(DatabaseFolder, { recursive: true });
}

// ──────────────────────────────────────────────
// 📝 Logging Functions
// ──────────────────────────────────────────────

function logWithTime(pushName, truncatedContent, warna = 'hijau') {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const time = chalk.blue(`[${hours}:${minutes}]`);
  const name = chalk.yellow(pushName);

  if (!truncatedContent || typeof truncatedContent !== 'string') return;
  const trimmedContent = truncatedContent.trim();
  if (!trimmedContent) return;

  let message;
  switch (warna.toLowerCase()) {
    case 'hijau':
      message = chalk.greenBright(trimmedContent);
      break;
    case 'merah':
      message = chalk.redBright(trimmedContent);
      break;
    case 'biru':
      message = chalk.blueBright(trimmedContent);
      break;
    case 'kuning':
      message = chalk.yellowBright(trimmedContent);
      break;
    case 'ungu':
      message = chalk.magentaBright(trimmedContent);
      break;
    case 'cyan':
      message = chalk.cyanBright(trimmedContent);
      break;
    default:
      message = chalk.greenBright(trimmedContent);
  }

  if (mode === 'development') {
    console.log(`${time} ${name} : ${message}`);
    logger.info(`${pushName} : ${trimmedContent}`);
  }
}

function warning(pushName, truncatedContent) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const time = chalk.cyan(`[${hours}:${minutes}]`);
  const name = chalk.yellow(pushName);
  const message = chalk.yellowBright(truncatedContent);
  console.log(`${time} ${name} : ${message}`);
}

function danger(pushName, truncatedContent) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const time = chalk.redBright(`[${hours}:${minutes}]`);
  const name = chalk.redBright(pushName);
  const message = chalk.redBright(truncatedContent);
  console.log(`${time} ${name} : ${message}`);
}

function success(pushName, truncatedContent) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const time = chalk.cyan(`[${hours}:${minutes}]`);
  const name = chalk.greenBright(pushName);
  const message = chalk.greenBright(truncatedContent);
  console.log(`${time} ${name} : ${message}`);
}

function log(pushname, content) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const time = chalk.blue(`[${hours}:${minutes}]`);
  const title = chalk.yellowBright(pushname);
  const message = chalk.greenBright(content);
  console.log(`${time} ${title} : ${message}`);
}

function logTracking(message) {
  logWithTime('Tracking', message);
}

// ──────────────────────────────────────────────
// 🔧 Command & Plugin Utilities
// ──────────────────────────────────────────────

function findClosestCommand(command, plugins) {
  let closestCommand = null;
  let minDistance = Infinity;

  for (const plugin of plugins) {
    for (const pluginCommand of plugin.Commands) {
      const distance = levenshtein.get(command, pluginCommand);
      if (distance < minDistance) {
        minDistance = distance;
        closestCommand = pluginCommand;
      }
    }
  }

  return closestCommand && minDistance <= 3 ? closestCommand : null;
}

// ──────────────────────────────────────────────
// 📁 File Utilities
// ──────────────────────────────────────────────

async function clearDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return;
    const files = await fs.promises.readdir(dirPath);

    if (files.length === 0) {
      logWithTime('System', `📁 Folder kosong: ${dirPath}`);
      return;
    }

    let successCount = 0;
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        await fs.promises.unlink(filePath);
        successCount++;
      } catch (err) {
        console.warn(`⚠️ Gagal hapus: ${file}`);
      }
    }

    if (successCount > 0) {
      logWithTime('System', `✔️ ${successCount} file berhasil dihapus dari ${dirPath}`);
    }
  } catch (error) {
    console.error('❌ Error saat membersihkan folder:', error);
  }
}

async function readJsonFile(filePath) {
  try {
    const data = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function writeJsonFile(filePath, data) {
  try {
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error menulis file JSON:', error);
  }
}

// ──────────────────────────────────────────────
// 📅 Date/Time Utilities
// ──────────────────────────────────────────────

function getCurrentDate() {
  return moment.tz('Asia/Jakarta').format('DD/MM/YYYY');
}

function getCurrentTime() {
  return moment.tz('Asia/Jakarta').format('HH:mm:ss');
}

function getGreetingTime() {
  const hour = moment.tz('Asia/Jakarta').hour();
  if (hour >= 5 && hour <= 10) return 'Selamat Pagi 🌅';
  if (hour >= 11 && hour < 15) return 'Selamat Siang ☀️';
  if (hour >= 15 && hour <= 18) return 'Selamat Sore 🌇';
  return 'Selamat Malam 🌙';
}

// ──────────────────────────────────────────────
// 📥 Download Utilities
// ──────────────────────────────────────────────

async function downloadFile(url, outputPath = null) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 45000,
    });

    if (outputPath) {
      fs.writeFileSync(outputPath, response.data);
      return outputPath;
    }
    return response.data;
  } catch (error) {
    throw new Error('Gagal mendownload file: ' + error.message);
  }
}

async function getBuffer(url, options = {}) {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: { DNT: 1, 'Upgrade-Insecure-Request': 1 },
      timeout: 45000,
      ...options,
      responseType: 'arraybuffer',
    });
    return res.data;
  } catch (err) {
    return false;
  }
}

// ──────────────────────────────────────────────
// 📤 Upload Utilities
// ──────────────────────────────────────────────

async function uploadTmpFile(filePath, waktu = '1hour') {
  try {
    const form = new FormData();
    form.append('expired', waktu);
    form.append('file', fs.createReadStream(filePath));

    const response = await axios.put(
      'https://autoresbot.com/tmp-files/upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Referer: 'https://autoresbot.com/',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Upload error:', error.message);
    return false;
  }
}

/**
 * Upload buffer langsung ke autoresbot.com
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Nama file (misal: image.jpg)
 * @returns {string|null} URL file yang diupload
 */
async function uploadBuffer(buffer, filename = 'file.jpg') {
  try {
    const form = new FormData();
    form.append('file', buffer, { filename });

    const response = await axios.put(
      'https://autoresbot.com/tmp-files/upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Referer: 'https://autoresbot.com/',
        },
      },
    );

    if (response.data && response.data.status && response.data.data?.url) {
      return response.data.data.url;
    }
    return null;
  } catch (error) {
    console.error('Upload buffer error:', error.message);
    return null;
  }
}

// ──────────────────────────────────────────────
// 🔄 Telegram Specific Helpers
// ──────────────────────────────────────────────

/**
 * Download file dari Telegram server
 */
async function downloadTelegramFile(bot, fileId) {
  try {
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    return {
      buffer: Buffer.from(response.data),
      filePath: file.file_path,
      fileSize: file.file_size,
    };
  } catch (error) {
    console.error('Error downloading Telegram file:', error.message);
    return null;
  }
}

/**
 * Kirim typing action ke chat
 */
async function sendTyping(bot, chatId) {
  try {
    await bot.sendChatAction(chatId, 'typing');
  } catch (error) {
    // Ignore error
  }
}

/**
 * Kirim upload photo action ke chat
 */
async function sendUploadPhoto(bot, chatId) {
  try {
    await bot.sendChatAction(chatId, 'upload_photo');
  } catch (error) {
    // Ignore error
  }
}

/**
 * Kirim upload document action ke chat
 */
async function sendUploadDocument(bot, chatId) {
  try {
    await bot.sendChatAction(chatId, 'upload_document');
  } catch (error) {
    // Ignore error
  }
}

/**
 * Escape karakter khusus Markdown V2
 */
function escapeMarkdown(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Format teks bold (Markdown)
 */
function bold(text) {
  return `*${text}*`;
}

/**
 * Format teks italic (Markdown)
 */
function italic(text) {
  return `_${text}_`;
}

/**
 * Format teks code (Markdown)
 */
function code(text) {
  return `\`${text}\``;
}

/**
 * Format teks code block (Markdown)
 */
function codeBlock(text, language = '') {
  return `\`\`\`${language}\n${text}\n\`\`\``;
}

/**
 * Membuat inline keyboard button
 */
function inlineKeyboard(buttons) {
  return {
    reply_markup: {
      inline_keyboard: buttons,
    },
  };
}

/**
 * Membuat reply keyboard
 */
function replyKeyboard(buttons, options = {}) {
  return {
    reply_markup: {
      keyboard: buttons,
      resize_keyboard: options.resize !== false,
      one_time_keyboard: options.oneTime || false,
    },
  };
}

/**
 * Menghilangkan keyboard
 */
function removeKeyboard() {
  return {
    reply_markup: {
      remove_keyboard: true,
    },
  };
}

// ──────────────────────────────────────────────
// 📤 Exports
// ──────────────────────────────────────────────

export {
  // Logging
  logWithTime,
  warning,
  danger,
  success,
  log,
  logTracking,

  // Command
  findClosestCommand,

  // File
  clearDirectory,
  readJsonFile,
  writeJsonFile,

  // Date/Time
  getCurrentDate,
  getCurrentTime,
  getGreetingTime,

  // Download/Upload
  downloadFile,
  getBuffer,
  uploadTmpFile,
  uploadBuffer,

  // Telegram Helpers
  downloadTelegramFile,
  sendTyping,
  sendUploadPhoto,
  sendUploadDocument,

  // Formatting
  escapeMarkdown,
  bold,
  italic,
  code,
  codeBlock,

  // Keyboard
  inlineKeyboard,
  replyKeyboard,
  removeKeyboard,

  // Paths
  tmpFolder,
  DatabaseFolder,
  rootDir,
};
