/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /ssweb                          ║
╠══════════════════════════════════════════════╣
║ Screenshot website. Kirim URL untuk          ║
║ mendapatkan tangkapan layar halaman web.     ║
╚══════════════════════════════════════════════╝
*/

import config from '../../config.js';
import { logCustom } from '../../lib/logger.js';
import axios from 'axios';

async function handle(bot, messageInfo) {
  const { chatId, prefix, command, content } = messageInfo;

  try {
    if (!content.trim()) {
      return await messageInfo.reply(
        `⚠️ *Format:* \`${prefix}${command} <url>\`\n\n📝 Contoh: \`${prefix}${command} google.com\``,
      );
    }

    // Tambahkan https:// jika belum ada
    let url = content.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    await bot.sendChatAction(chatId, 'upload_photo');
    const statusMsg = await messageInfo.reply('📸 *Mengambil screenshot...*');

    const response = await axios.get('https://api.autoresbot.com/api/ssweb', {
      params: { url, apikey: config.APIKEY },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const imgBuffer = Buffer.from(response.data);

    await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
    await bot.sendPhoto(chatId, imgBuffer, {
      caption: `📸 *Screenshot:* \`${url}\``,
      reply_to_message_id: messageInfo.id,
      parse_mode: 'Markdown',
    });
  } catch (error) {
    logCustom('info', error.message, `ERROR-COMMAND-${command}.txt`);
    await messageInfo.reply('❌ Gagal mengambil screenshot. Pastikan URL valid!');
  }
}

export default {
  handle,
  Commands: ['ssweb', 'ss'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  limitDeduction: 1,
};
