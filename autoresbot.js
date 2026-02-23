/*
╔══════════════════════════════════════════════╗
║    🤖 RESBOT TELEGRAM - Core Processing      ║
╠══════════════════════════════════════════════╣
║ 📦 Version    : 1.0.0                       ║
║ 📡 Platform   : Telegram Bot API            ║
║                                              ║
║ File ini menangani pemrosesan pesan utama.   ║
║ Menerima pesan dari connection.js, melewati  ║
║ handler pipeline, lalu mencocokkan dengan    ║
║ plugin yang sesuai.                          ║
╚══════════════════════════════════════════════╝
*/

// List command tanpa registrasi
export const commandWithoutRegister = ['start', 'help', 'menu', 'owner', 'register', 'id'];

import chokidar from 'chokidar';
import config from './config.js';
const mode = config.mode;

import chalk from 'chalk';
import handler from './lib/handler.js';
import mess from './strings.js';
import path from 'path';
import { logWithTime, log, danger, findClosestCommand, logTracking } from './lib/utils.js';
import { isOwner, isPremiumUser, updateUser, findUser, isUserRegistered } from './lib/users.js';
import { reloadPlugins } from './lib/plugins.js';
import { logCustom } from './lib/logger.js';

// Inisialisasi handler
handler.initHandlers();

// Variabel global
const lastMessageTime = {};
const pluginsPath = path.join(process.cwd(), 'plugins');
let plugins = [];

// Load plugin awal
reloadPlugins()
  .then((loadedPlugins) => {
    plugins = loadedPlugins;
    console.log(`[✔] Load All Plugins done... (${plugins.length} plugins)`);
  })
  .catch((error) => {
    console.error('❌ ERROR: Gagal memuat plugins:', error);
  });

// Hot reload hanya di development
if (mode === 'development') {
  const watcher = chokidar.watch(pluginsPath, {
    persistent: true,
    ignoreInitial: true,
    ignored: /(^|[\/\\])\../,
  });

  watcher.on('change', (filePath) => {
    if (filePath.endsWith('.js')) {
      logWithTime('System', `File changed: ${filePath}`);
      reloadPlugins()
        .then((loadedPlugins) => {
          plugins = loadedPlugins;
        })
        .catch((error) => {
          console.error('❌ ERROR: Gagal memuat plugins:', error);
        });
    }
  });

  logWithTime('System', 'Hot reload active in development mode.');
} else {
  logWithTime('System', 'Hot reload disabled in production mode.');
}

/**
 * Fungsi utama untuk memproses setiap pesan masuk
 */
async function processMessage(bot, messageInfo) {
  const { chatId, senderId, senderName, isGroup, isPrivate, fullText, prefix, command, content } =
    messageInfo;

  const isPremiumUsers = isPremiumUser(senderId);
  const isOwnerUsers = isOwner(senderId);

  try {
    // ─── Pre-process melalui Handler Pipeline ──
    const shouldContinue = await handler.preProcess(bot, messageInfo);
    if (!shouldContinue) return;

    // ─── Rate Limiter ──────────────────────────
    let truncatedContent = fullText.length > 10 ? fullText.slice(0, 10) + '...' : fullText;
    const currentTime = Date.now();

    if (
      lastMessageTime[chatId] &&
      currentTime - lastMessageTime[chatId] < config.rate_limit &&
      prefix &&
      !isOwnerUsers
    ) {
      danger(senderName, `Rate limit : ${truncatedContent}`);
      return;
    }
    if (prefix) {
      lastMessageTime[chatId] = currentTime;
    }

    // ─── Log pesan masuk ───────────────────────
    if (truncatedContent.trim() && prefix) {
      const logMessage =
        config.mode === 'production'
          ? () => log(senderName, truncatedContent)
          : () => logWithTime('CHAT', `${senderName}(${senderId}) - ${truncatedContent}`);
      logMessage();
    }

    // ─── Handle Destination ────────────────────
    if (
      (config.bot_destination.toLowerCase() === 'private' && isGroup) ||
      (config.bot_destination.toLowerCase() === 'group' && !isGroup)
    ) {
      if (!isOwnerUsers) {
        logWithTime('SYSTEM', `Destination handle only - ${config.bot_destination} chat`);
        return;
      }
    }

    // ─── Cari command yang cocok di plugins ────
    let commandFound = false;

    if (!command || !prefix) return; // Tidak ada command, skip

    for (const plugin of plugins) {
      if (plugin.Commands.includes(command)) {
        commandFound = true;

        // Cek Premium
        if (plugin.OnlyPremium && !isPremiumUsers && !isOwnerUsers) {
          logTracking(`Handler - Bukan premium (${command})`);
          await messageInfo.reply(mess.general.isPremium);
          return;
        }

        // Cek Owner
        if (plugin.OnlyOwner && !isOwnerUsers) {
          logTracking(`Handler - Bukan Owner (${command})`);
          await messageInfo.reply(mess.general.isOwner);
          return;
        }

        // Cek Group Only
        if (plugin.OnlyGroup && !isGroup) {
          await messageInfo.reply(mess.general.isGroup);
          return;
        }

        // Cek Private Only
        if (plugin.OnlyPrivate && isGroup) {
          await messageInfo.reply('⚠️ Perintah ini hanya bisa digunakan di chat pribadi.');
          return;
        }

        // Cek Admin (Telegram)
        if (plugin.OnlyAdmin && isGroup) {
          try {
            const member = await bot.getChatMember(chatId, senderId);
            if (!['administrator', 'creator'].includes(member.status)) {
              await messageInfo.reply(mess.general.isAdmin);
              return;
            }
          } catch (e) {
            // Skip jika gagal cek admin
          }
        }

        // Cek Limit
        if (!isPremiumUsers && !isOwnerUsers && plugin.limitDeduction) {
          try {
            const dataUsers = findUser(senderId);
            if (!dataUsers) {
              await messageInfo.reply(mess.general.notRegistered);
              return;
            }

            const [docId, userData] = dataUsers;
            const isLimitExceeded = userData.limit < plugin.limitDeduction || userData.limit < 1;

            if (isLimitExceeded) {
              logTracking('Handler - Limit habis');
              await messageInfo.reply(mess.general.limit);
              return;
            }

            await updateUser(senderId, {
              limit: userData.limit - plugin.limitDeduction,
            });
          } catch (error) {
            console.error(`Error saat mengurangi limit: ${error.message}`);
          }
        }

        // ─── Jalankan Plugin ─────────────────
        const pluginResult = await plugin.handle(bot, messageInfo);
        logTracking(`Plugins - ${command} dijalankan oleh ${senderId}`);

        if (pluginResult === false) return;
      }
    }

    // ─── Command tidak ditemukan ───────────────
    if (config.commandSimilarity && !commandFound && command && prefix) {
      const closestCommand = findClosestCommand(command, plugins);
      if (closestCommand && fullText.length < 30) {
        logTracking(`Handler - Command tidak ditemukan (${command})`);

        await messageInfo.reply(
          `❓ Command *${command}* tidak ditemukan.\n\nApakah maksud Anda *${prefix}${closestCommand}*?`,
        );
      }
    }
  } catch (error) {
    logCustom('info', error, 'ERROR-processMessage.txt');
    danger(command, `Kesalahan di processMessage: ${error}`);
  }
}

/**
 * Menangani event member baru masuk/keluar grup
 */
async function memberUpdate(bot, eventInfo) {
  const { chatId, action, members, chat } = eventInfo;

  try {
    if (action === 'add') {
      for (const member of members) {
        if (member.is_bot) continue;

        const name = member.first_name || 'Anggota Baru';
        const groupName = chat.title || 'Grup';

        await bot.sendMessage(
          chatId,
          `👋 Selamat datang *${name}* di *${groupName}*!\n\nKetik /menu untuk melihat fitur yang tersedia.`,
          { parse_mode: 'Markdown' },
        );
      }
    } else if (action === 'remove') {
      for (const member of members) {
        if (member.is_bot) continue;

        const name = member.first_name || 'Anggota';
        await bot.sendMessage(chatId, `👋 Selamat tinggal *${name}*. Sampai jumpa!`, {
          parse_mode: 'Markdown',
        });
      }
    }
  } catch (error) {
    logCustom('info', error, 'ERROR-memberUpdate.txt');
    console.error(chalk.redBright(`Error: ${error.message}`));
  }
}

export { processMessage, memberUpdate };
