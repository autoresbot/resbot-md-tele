/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /start /menu /allmenu /help      ║
╠══════════════════════════════════════════════╣
║ Menu utama bot - Small Caps Style            ║
╚══════════════════════════════════════════════╝
*/

import { loadMenuOnce } from '../database/menu.js';
import config from '../config.js';
import { getGreetingTime, inlineKeyboard } from '../lib/utils.js';
import { isOwner, isPremiumUser } from '../lib/users.js';
import moment from 'moment-timezone';
import path from 'path';
import fs from 'fs';

// ─── Small Caps Converter ────────────────────
const smallCaps = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ',
  h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ',
  o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ', u: 'ᴜ',
  v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};

function toSmallCaps(text) {
  return text
    .toLowerCase()
    .split('')
    .map((c) => smallCaps[c] || c)
    .join('');
}

/**
 * Pilih file audio berdasarkan waktu sekarang
 */
function getAudioFile() {
  const hour = moment.tz('Asia/Jakarta').hour();
  let fileName;

  if (hour >= 3 && hour < 5) fileName = 'sahur.opus';
  else if (hour >= 5 && hour <= 10) fileName = 'pagi.opus';
  else if (hour >= 11 && hour < 15) fileName = 'siang.opus';
  else if (hour >= 15 && hour <= 18) fileName = 'sore.opus';
  else if (hour >= 19 && hour <= 21) fileName = 'petang.opus';
  else fileName = 'malam.opus';

  const filePath = path.join(process.cwd(), 'database', 'audio', fileName);

  if (fs.existsSync(filePath)) return filePath;
  return null;
}

async function handle(bot, messageInfo) {
  const { chatId, senderId, senderName, content, command, callbackData, message, prefix } = messageInfo;

  const menuData = await loadMenuOnce();
  const categories = Object.keys(menuData);
  const p = prefix || '/';

  const greeting = getGreetingTime();
  const role = isOwner(senderId) ? '👑 ᴏᴡɴᴇʀ' : isPremiumUser(senderId) ? '💎 ᴘʀᴇᴍɪᴜᴍ' : '👤 ᴜꜱᴇʀ';

  // ─── Menu Kategori Tertentu ──────────────
  if (command === 'menu' && content) {
    const category = content.toLowerCase();

    if (menuData[category]) {
      const cmds = menuData[category]
        .map((c) => `┣⌬ ${p}${c}`)
        .join('\n');

      const response = `┏━━━⌬ *${toSmallCaps(category)}* ⌬━━━\n┃\n${cmds}\n┗━━━━━━━◧`;

      const buttons = [[{ text: '⬅️ ᴋᴇᴍʙᴀʟɪ', callback_data: 'start' }]];

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
      return;
    }
  }

  // ─── All Menu ────────────────────────────
  if (command === 'allmenu') {
    const sections = categories.map((cat) => {
      const cmds = menuData[cat]
        .map((c) => `┣⌬ ${p}${c}`)
        .join('\n');
      return `┏━━⌬ *${toSmallCaps(cat)}*\n┃\n${cmds}\n┗━━━━━━━◧`;
    });

    const response = sections.join('\n\n');

    const buttons = [[{ text: '⬅️ ᴋᴇᴍʙᴀʟɪ', callback_data: 'start' }]];

    if (callbackData) {
      try {
        if (response.length > 4000) {
          await bot.deleteMessage(chatId, message.message_id).catch(() => {});
          await bot.sendMessage(chatId, response.slice(0, 4000), {
            parse_mode: 'Markdown',
            ...inlineKeyboard(buttons),
          });
        } else {
          await bot.editMessageText(response, {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'Markdown',
            ...inlineKeyboard(buttons),
          });
        }
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
    return;
  }

  // ─── Menu Utama (/start, /menu, /help) ───
  const catList = categories.map((cat) => `┣⌬ ${toSmallCaps(cat)}`).join('\n');

  const response = `${greeting}, *${senderName}*! ${role}

┏━━━⌬ *ᴍᴇɴᴜ* ⌬━━━
┃
${catList}
┗━━━━━━━◧

_ᴘɪʟɪʜ ᴋᴀᴛᴇɢᴏʀɪ ᴅɪ ʙᴀᴡᴀʜ_ 👇`;

  // Buat buttons 2 kolom
  const buttons = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = [
      {
        text: `⌬ ${categories[i].toUpperCase()}`,
        callback_data: `menu_${categories[i]}`,
      },
    ];
    if (categories[i + 1]) {
      row.push({
        text: `⌬ ${categories[i + 1].toUpperCase()}`,
        callback_data: `menu_${categories[i + 1]}`,
      });
    }
    buttons.push(row);
  }

  buttons.push([{ text: '📋 ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ', callback_data: 'allmenu' }]);
  buttons.push([
    { text: '👤 ᴏᴡɴᴇʀ', callback_data: 'owner' },
    { text: '🌐 ᴡᴇʙꜱɪᴛᴇ', url: `https://${config.owner_website}` },
  ]);

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

  // ─── Kirim audio greeting setelah menu (hanya saat ketik command, bukan dari tombol) ──
  if (!callbackData) {
    try {
      const audioPath = getAudioFile();
      if (audioPath) {
        await bot.sendVoice(chatId, audioPath);
      }
    } catch (e) {
      // Abaikan jika gagal kirim audio
    }
  }
}

export default {
  Commands: ['start', 'menu', 'allmenu', 'help'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  handle,
};
