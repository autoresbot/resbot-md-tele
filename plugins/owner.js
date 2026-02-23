/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /owner                          ║
╠══════════════════════════════════════════════╣
║ Menampilkan info owner bot.                  ║
╚══════════════════════════════════════════════╝
*/

import config from '../config.js';
import { listOwner } from '../lib/users.js';
import { inlineKeyboard } from '../lib/utils.js';

async function handle(bot, messageInfo) {
  const { chatId, callbackData, message } = messageInfo;

  const owners = listOwner();

  if (owners.length === 0) {
    await bot.sendMessage(chatId, '⚠️ Owner belum terdaftar!');
    return;
  }

  const ownerList = owners
    .map((id, i) => `┣⌬ Owner ${i + 1}: \`${id}\``)
    .join('\n');

  const response = `┏━━━⌬ *ᴏᴡɴᴇʀ* ⌬━━━
┃
${ownerList}
┗━━━━━━━◧`;

  // Tombol chat langsung ke owner
  const buttons = owners.map((id, i) => ([
    { text: `💬 Chat Owner ${owners.length > 1 ? i + 1 : ''}`.trim(), url: `tg://user?id=${id}` },
  ]));

  buttons.push([{ text: '⬅️ ᴋᴇᴍʙᴀʟɪ', callback_data: 'start' }]);

  if (callbackData) {
    try {
      await bot.editMessageText(response, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        ...inlineKeyboard(buttons),
      });
    } catch (e) {
      await bot.sendMessage(chatId, response, {
        parse_mode: 'Markdown',
        ...inlineKeyboard(buttons),
      });
    }
  } else {
    await bot.sendMessage(chatId, response, {
      parse_mode: 'Markdown',
      ...inlineKeyboard(buttons),
    });
  }
}

export default {
  Commands: ['owner'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  handle,
};
