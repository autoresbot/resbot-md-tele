/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /sticker                        ║
╠══════════════════════════════════════════════╣
║ Konversi gambar/video menjadi sticker.       ║
╚══════════════════════════════════════════════╝
*/

import { downloadTelegramFile } from '../../lib/utils.js';
import config from '../../config.js';
import fs from 'fs';
import path from 'path';

async function handle(bot, messageInfo) {
  const { chatId, photo, video, animation, sticker, replyToMessage, message } = messageInfo;

  try {
    // Cari media yang akan dikonversi
    let fileId = null;

    // Dari foto langsung
    if (photo && photo.length > 0) {
      fileId = photo[photo.length - 1].file_id; // Ambil resolusi tertinggi
    }
    // Dari animasi/GIF
    else if (animation) {
      fileId = animation.file_id;
    }
    // Dari reply ke foto/video/sticker
    else if (replyToMessage) {
      const reply = message.reply_to_message;
      if (reply.photo) {
        fileId = reply.photo[reply.photo.length - 1].file_id;
      } else if (reply.animation) {
        fileId = reply.animation.file_id;
      } else if (reply.sticker) {
        // Konversi sticker ke gambar (untuk sticker webp)
        fileId = reply.sticker.file_id;
      }
    }

    if (!fileId) {
      return await messageInfo.reply(
        '⚠️ *Cara penggunaan:*\n\n1️⃣ Kirim foto dengan caption `/sticker`\n2️⃣ Reply foto/GIF dengan `/sticker`',
      );
    }

    // Tampilkan loading
    await bot.sendChatAction(chatId, 'typing');

    // Download file
    const fileData = await downloadTelegramFile(bot, fileId);
    if (!fileData) {
      return await messageInfo.reply('❌ Gagal mendownload media!');
    }

    // Simpan sementara
    const tmpPath = path.join(process.cwd(), 'tmp', `sticker_${Date.now()}.webp`);
    fs.writeFileSync(tmpPath, fileData.buffer);

    // Kirim sebagai sticker
    await bot.sendSticker(chatId, tmpPath, {
      reply_to_message_id: messageInfo.id,
    });

    // Hapus file temp
    try {
      fs.unlinkSync(tmpPath);
    } catch (e) {}
  } catch (error) {
    console.error('Error sticker:', error);
    await messageInfo.reply('❌ Gagal membuat sticker. Coba lagi!');
  }
}

export default {
  handle,
  Commands: ['sticker', 's', 'stiker'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
};
