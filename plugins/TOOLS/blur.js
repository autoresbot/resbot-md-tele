/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /blur                           ║
╠══════════════════════════════════════════════╣
║ Blur gambar dengan level tertentu.           ║
║ Kirim/reply foto dengan command.             ║
╚══════════════════════════════════════════════╝
*/

import config from '../../config.js';
import { downloadTelegramFile, uploadBuffer } from '../../lib/utils.js';
import { logCustom } from '../../lib/logger.js';
import axios from 'axios';

async function handle(bot, messageInfo) {
  const { chatId, prefix, command, content, photo, replyToMessage, message } = messageInfo;

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
        `⚠️ Kirim foto dengan caption \`${prefix}${command} [level]\` atau reply foto dengan \`${prefix}${command}\`\n\n📝 Level blur: 1-50 (default: 10)`,
      );
    }

    // Parse sigma level dari content
    const sigma = parseInt(content) || 10;
    const clampedSigma = Math.max(1, Math.min(50, sigma));

    // Step 1: Download foto
    await bot.sendChatAction(chatId, 'upload_photo');
    const fileData = await downloadTelegramFile(bot, fileId);
    if (!fileData) {
      return await messageInfo.reply('❌ Gagal mendownload gambar!');
    }

    // Step 2: Upload ke autoresbot.com
    const statusMsg = await messageInfo.reply('🔄 *Memproses blur...*');
    const imageUrl = await uploadBuffer(fileData.buffer, 'image.jpg');
    if (!imageUrl) {
      await bot.editMessageText('❌ Gagal mengupload gambar!', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
      return;
    }

    // Step 3: Hit API blur
    const response = await axios.get('https://api.autoresbot.com/api/tools/blur', {
      params: { apikey: config.APIKEY, url: imageUrl, sigma: clampedSigma },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const imgBuffer = Buffer.from(response.data);

    // Step 4: Kirim hasil
    await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
    await bot.sendPhoto(chatId, imgBuffer, {
      caption: `✅ *Blur Berhasil!* (level: ${clampedSigma})`,
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
  Commands: ['blur'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  limitDeduction: 1,
};
