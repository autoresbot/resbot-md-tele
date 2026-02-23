/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /play                           ║
╠══════════════════════════════════════════════╣
║ Cari dan download audio dari YouTube.        ║
║ Ketik /play <judul lagu> untuk mencari.      ║
╚══════════════════════════════════════════════╝
*/

import yts from 'yt-search';
import ApiAutoresbotModule from 'api-autoresbot';
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from '../../config.js';
import { logCustom } from '../../lib/logger.js';
import axios from 'axios';

/**
 * Pencarian YouTube
 */
async function searchYouTube(query) {
  const searchResults = await yts(query);
  return searchResults.all.find((item) => item.type === 'video') || searchResults.all[0];
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch API dengan retry
 */
async function fetchWithRetry(api, endpoint, params, maxRetries = 6, delayMs = 7000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.get(endpoint, params);
      if (response && response.status && response.data.url) {
        return response;
      }
      throw new Error(`Response tidak valid (percobaan ${attempt})`);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await delay(delayMs);
      }
    }
  }
  throw lastError;
}

/**
 * Download URL ke buffer
 */
async function downloadToBuffer(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
  });
  return Buffer.from(response.data);
}

async function handle(bot, messageInfo) {
  const { chatId, prefix, command, content } = messageInfo;

  try {
    const query = content.trim();
    if (!query) {
      return await messageInfo.reply(
        `⚠️ *Format:* \`${prefix}${command} <judul lagu>\`\n\n📝 Contoh: \`${prefix}${command} matahariku\``,
      );
    }

    const statusMsg = await messageInfo.reply('🔍 *Mencari lagu...*');

    // Pencarian YouTube
    const video = await searchYouTube(query);

    if (!video || !video.url) {
      await bot.editMessageText('❌ Tidak dapat menemukan video yang sesuai.', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
      return;
    }

    if (video.seconds > 3600) {
      await bot.editMessageText('⚠️ Video terlalu panjang (maks 1 jam).', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
      return;
    }

    // Update status
    await bot.editMessageText('⏳ *Mengunduh audio...*', {
      chat_id: chatId,
      message_id: statusMsg.message_id,
      parse_mode: 'Markdown',
    });

    // Kirim info video dengan thumbnail
    const caption = `🎵 *${video.title}*\n\n⏱ Durasi: ${video.timestamp}\n👁 Views: ${video.views?.toLocaleString() || '-'}\n📅 Upload: ${video.ago || '-'}`;

    await bot.sendPhoto(chatId, video.thumbnail, {
      caption,
      reply_to_message_id: messageInfo.id,
      parse_mode: 'Markdown',
    });

    // Download audio via API
    await bot.sendChatAction(chatId, 'upload_voice');

    const api = new ApiAutoresbot(config.APIKEY);
    const response = await fetchWithRetry(
      api,
      '/api/downloader/ytplay',
      { url: video.url, format: 'm4a' },
      7,
      9000,
    );

    if (response && response.status) {
      const audioBuffer = await downloadToBuffer(response.data.url);

      await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

      await bot.sendAudio(chatId, audioBuffer, {
        reply_to_message_id: messageInfo.id,
        title: video.title,
        performer: video.author?.name || 'YouTube',
      });
    } else {
      await bot.editMessageText('❌ Gagal mengunduh audio.', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
    }
  } catch (error) {
    logCustom('info', error.message, `ERROR-COMMAND-${command}.txt`);
    await messageInfo.reply('❌ Gagal memproses. Coba lagi nanti!');
  }
}

export default {
  handle,
  Commands: ['play'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  limitDeduction: 1,
};
