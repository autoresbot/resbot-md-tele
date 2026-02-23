/*
╔══════════════════════════════════════════════╗
║    🤖 RESBOT TELEGRAM - Bot Connection       ║
╠══════════════════════════════════════════════╣
║ Mengelola koneksi bot Telegram via polling   ║
║ atau webhook. Menangani event messages,      ║
║ callback_query, dan member updates.          ║
╚══════════════════════════════════════════════╝
*/

import TelegramBot from 'node-telegram-bot-api';
import chalk from 'chalk';
import config from '../config.js';
import { logWithTime, success, danger } from './utils.js';
import serializeMessage from './serializeMessage.js';
import { processMessage, memberUpdate } from '../autoresbot.js';

let bot = null;

/**
 * Membuat instance bot Telegram dan menghubungkan.
 * Mendukung 2 mode: polling (development) dan webhook (production).
 */
async function connectToTelegram() {
  const token = config.BOT_TOKEN;

  if (!token || token === 'your_bot_token_here') {
    danger('Error', 'BOT_TOKEN belum dikonfigurasi! Silakan isi di file .env');
    process.exit(1);
  }

  const mode = config.BOT_MODE?.toLowerCase() || 'polling';

  try {
    if (mode === 'webhook') {
      // ─── Webhook Mode ───────────────────
      bot = new TelegramBot(token, { webHook: { port: config.WEBHOOK_PORT } });
      await bot.setWebHook(`${config.WEBHOOK_URL}/bot${token}`);
      success('Telegram', `Webhook aktif di port ${config.WEBHOOK_PORT}`);
    } else {
      // ─── Polling Mode (Default) ─────────
      bot = new TelegramBot(token, {
        polling: {
          interval: 300,
          autoStart: true,
          params: {
            timeout: 10,
            allowed_updates: ['message', 'callback_query', 'chat_member', 'my_chat_member'],
          },
        },
      });
      success('Telegram', 'Polling mode aktif');
    }

    // ─── Event: Pesan masuk ─────────────
    bot.on('message', async (msg) => {
      try {
        const messageInfo = serializeMessage(msg, bot);
        if (!messageInfo) return;

        await processMessage(bot, messageInfo);
      } catch (error) {
        console.error(chalk.redBright(`Error dalam message handler: ${error.message}`));
      }
    });

    // ─── Event: Callback Query (Inline Buttons) ──
    bot.on('callback_query', async (query) => {
      try {
        // Answer callback untuk menghilangkan loading di button
        await bot.answerCallbackQuery(query.id);

        const messageInfo = serializeMessage(query, bot, 'callback_query');
        if (!messageInfo) return;

        await processMessage(bot, messageInfo);
      } catch (error) {
        console.error(chalk.redBright(`Error dalam callback_query handler: ${error.message}`));
      }
    });

    // ─── Event: Member baru masuk/keluar grup ────
    bot.on('new_chat_members', async (msg) => {
      try {
        await memberUpdate(bot, {
          chatId: msg.chat.id,
          action: 'add',
          members: msg.new_chat_members,
          chat: msg.chat,
        });
      } catch (error) {
        console.error(chalk.redBright(`Error dalam new_chat_members: ${error.message}`));
      }
    });

    bot.on('left_chat_member', async (msg) => {
      try {
        await memberUpdate(bot, {
          chatId: msg.chat.id,
          action: 'remove',
          members: [msg.left_chat_member],
          chat: msg.chat,
        });
      } catch (error) {
        console.error(chalk.redBright(`Error dalam left_chat_member: ${error.message}`));
      }
    });

    // ─── Event: Polling Error ─────────────
    bot.on('polling_error', (error) => {
      if (error.code === 'ETELEGRAM') {
        danger('Telegram API', error.message);
      } else if (error.code === 'EFATAL') {
        danger('Fatal', error.message);
        process.exit(1);
      } else {
        danger('Polling', error.message);
      }
    });

    // ─── Event: Webhook Error ─────────────
    bot.on('webhook_error', (error) => {
      danger('Webhook', error.message);
    });

    // ─── Mendapatkan info bot ─────────────
    const botInfo = await bot.getMe();
    global.botInfo = botInfo;

    success('Bot Info', `@${botInfo.username} (${botInfo.first_name}) - ID: ${botInfo.id}`);
    logWithTime('System', `Bot berhasil terhubung via ${mode}`);

    return bot;
  } catch (error) {
    danger('Connection Error', error.message);
    throw error;
  }
}

/**
 * Mendapatkan instance bot yang sedang aktif
 */
function getBot() {
  return bot;
}

export { connectToTelegram, getBot };
