/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /ai                             ║
╠══════════════════════════════════════════════╣
║ Chat dengan AI (Gemini) melalui API.         ║
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
        `⚠️ *Format Penggunaan:*\n\n💬 Contoh: \`${prefix}${command} siapa penemu lampu\``,
      );
    }

    // Tampilkan typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Panggil API
    const response = await axios.get(`https://api.autoresbot.com/api/gemini`, {
      params: { text: content, apikey: config.APIKEY },
      timeout: 30000,
    });

    if (response.data && response.data.data) {
      return await messageInfo.reply(response.data.data);
    } else {
      return await messageInfo.reply('❌ Maaf, tidak ada respons dari server.');
    }
  } catch (error) {
    logCustom('info', error.message, `ERROR-COMMAND-${command}.txt`);
    return await messageInfo.reply('⚠️ Gagal: Periksa Apikey Anda! (/apikey)');
  }
}

export default {
  handle,
  Commands: ['ai'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  limitDeduction: 1,
};
