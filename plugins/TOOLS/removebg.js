/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /removebg                       ║
╠══════════════════════════════════════════════╣
║ Hapus background gambar menggunakan API.     ║
║ Kirim/reply foto dengan command.             ║
╚══════════════════════════════════════════════╝
*/

import config from '../../config.js';
import { downloadTelegramFile, uploadBuffer } from '../../lib/utils.js';
import { logCustom } from '../../lib/logger.js';
import axios from 'axios';

const API_URL = 'https://api.autoresbot.com/api/tools/removebg';

/**
 * Poll API sampai status "done" atau timeout
 */
async function pollResult(jobId, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));

    const res = await axios.get(API_URL, {
      params: { apikey: config.APIKEY, job_id: jobId },
      timeout: 15000,
    });

    if (res.data.status === 'done' && res.data.result) {
      return res.data.result;
    }

    if (res.data.status !== 'processing') {
      throw new Error(res.data.message || 'Gagal memproses gambar');
    }
  }

  throw new Error('Timeout: proses terlalu lama');
}

async function handle(bot, messageInfo) {
  const { chatId, prefix, command, photo, replyToMessage, message } = messageInfo;

  try {
    // Cari foto dari pesan atau reply
    let fileId = null;

    if (photo && photo.length > 0) {
      fileId = photo[photo.length - 1].file_id;
    } else if (replyToMessage) {
      const reply = message.reply_to_message;
      if (reply.photo) {
        fileId = reply.photo[reply.photo.length - 1].file_id;
      }
    }

    if (!fileId) {
      return await messageInfo.reply(
        `⚠️ Kirim foto dengan caption \`${prefix}${command}\` atau reply foto dengan \`${prefix}${command}\``,
      );
    }

    // Step 1: Download foto dari Telegram
    await bot.sendChatAction(chatId, 'typing');
    const fileData = await downloadTelegramFile(bot, fileId);
    if (!fileData) {
      return await messageInfo.reply('❌ Gagal mendownload gambar!');
    }

    // Step 2: Upload ke autoresbot.com
    const statusMsg = await messageInfo.reply('⏳ *Mengupload gambar...*');
    const imageUrl = await uploadBuffer(fileData.buffer, 'image.jpg');
    if (!imageUrl) {
      await bot.editMessageText('❌ Gagal mengupload gambar!', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
      return;
    }

    // Step 3: Kirim ke API RemoveBG
    await bot.editMessageText('🔄 *Menghapus background...*', {
      chat_id: chatId,
      message_id: statusMsg.message_id,
      parse_mode: 'Markdown',
    });

    const response = await axios.get(API_URL, {
      params: { apikey: config.APIKEY, url: imageUrl },
      timeout: 30000,
    });

    let base64Result;

    if (response.data.status === 'done' && response.data.result) {
      base64Result = response.data.result;
    } else if (response.data.status === 'processing' && response.data.job_id) {
      await bot.editMessageText('🔄 *Sedang diproses... mohon tunggu*', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      });

      base64Result = await pollResult(response.data.job_id);
    } else {
      throw new Error(response.data.message || 'Response tidak valid');
    }

    // Step 4: Convert base64 ke buffer dan kirim
    const cleanBase64 = base64Result.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(cleanBase64, 'base64');

    await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
    await bot.sendPhoto(chatId, imgBuffer, {
      caption: '✅ *Remove Background Berhasil!*',
      reply_to_message_id: messageInfo.id,
      parse_mode: 'Markdown',
    });
  } catch (error) {
    logCustom('info', error.message, `ERROR-COMMAND-${command}.txt`);
    await messageInfo.reply('❌ Gagal memproses gambar. Coba lagi nanti!');
  }
}

export default {
  handle,
  Commands: ['removebg', 'rbg'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  limitDeduction: 1,
};
