/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /pinterest /pin                 ║
╠══════════════════════════════════════════════╣
║ Cari gambar dari Pinterest.                  ║
║ Ketik /pin <query> untuk mencari.            ║
╚══════════════════════════════════════════════╝
*/

import ApiAutoresbotModule from 'api-autoresbot';
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from '../../config.js';
import { getBuffer } from '../../lib/utils.js';
import { logCustom } from '../../lib/logger.js';

async function handle(bot, messageInfo) {
  const { chatId, prefix, command, content } = messageInfo;

  try {
    if (!content.trim()) {
      return await messageInfo.reply(
        `⚠️ *Format:* \`${prefix}${command} <query>\`\n\n📝 Contoh: \`${prefix}${command} kucing lucu\``,
      );
    }

    const statusMsg = await messageInfo.reply('🔍 *Mencari gambar...*');
    await bot.sendChatAction(chatId, 'upload_photo');

    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.get('/api/search/pinterest', { text: content });

    if (response.code === 200 && response.data) {
      const buffer = await getBuffer(response.data);

      if (!buffer) {
        await bot.editMessageText('❌ Gagal mengunduh gambar.', {
          chat_id: chatId,
          message_id: statusMsg.message_id,
        });
        return;
      }

      await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
      await bot.sendPhoto(chatId, Buffer.from(buffer), {
        caption: `📌 *Pinterest:* \`${content}\``,
        reply_to_message_id: messageInfo.id,
        parse_mode: 'Markdown',
      });
    } else {
      logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
      await bot.editMessageText('❌ Tidak ditemukan hasil untuk pencarian ini.', {
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
  Commands: ['pin', 'pinterest'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  limitDeduction: 1,
};
