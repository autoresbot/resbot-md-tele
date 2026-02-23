/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /register & /profile            ║
╠══════════════════════════════════════════════╣
║ Registrasi pengguna baru dan lihat profil.   ║
╚══════════════════════════════════════════════╝
*/

import { registerUser, findUser, isOwner, isPremiumUser } from '../../lib/users.js';
import { getCurrentDate } from '../../lib/utils.js';

async function handle(bot, messageInfo) {
  const { chatId, senderId, senderName, command, content, username } = messageInfo;

  if (command === 'register') {
    // ─── Registrasi ──────────────────────
    const usernameInput = content.trim();

    if (!usernameInput) {
      return await messageInfo.reply(
        '⚠️ *Format:* `/register <username>`\n\n📝 Contoh: `/register john`',
      );
    }

    if (usernameInput.length < 3 || usernameInput.length > 20) {
      return await messageInfo.reply('⚠️ Username harus 3-20 karakter!');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usernameInput)) {
      return await messageInfo.reply('⚠️ Username hanya boleh huruf, angka, dan underscore!');
    }

    const result = registerUser(senderId, usernameInput, {
      firstName: senderName,
    });

    if (result === 'registered') {
      return await messageInfo.reply('✅ Kamu sudah terdaftar sebelumnya!');
    }

    if (result === 'taken') {
      return await messageInfo.reply(
        `⚠️ Username *${usernameInput}* sudah digunakan. Pilih username lain!`,
      );
    }

    await messageInfo.reply(
      `🎉 *Registrasi Berhasil!*\n\n👤 *Username:* ${usernameInput}\n🆔 *ID:* \`${senderId}\`\n📅 *Tanggal:* ${getCurrentDate()}\n\nKetik /menu untuk mulai menggunakan bot!`,
    );
  } else if (command === 'profile' || command === 'me') {
    // ─── Lihat Profil ────────────────────
    const userData = findUser(senderId);

    if (!userData) {
      return await messageInfo.reply(
        '⚠️ Kamu belum terdaftar!\n\nKetik `/register <username>` untuk mendaftar.',
      );
    }

    const [docId, user] = userData;
    const role = isOwner(senderId)
      ? '👑 Owner'
      : isPremiumUser(senderId)
      ? '💎 Premium'
      : '👤 User';

    const premiumStatus = isPremiumUser(senderId)
      ? `✅ Aktif (s/d ${new Date(user.premium).toLocaleDateString('id-ID')})`
      : '❌ Tidak Aktif';

    const response = `
╭─── MY PROFILE
│ x
│ *Username:* ${user.username}
│ *ID:* \`${senderId}\`
│ *Status:* ${role}
│ *Premium:* ${premiumStatus}
│ *Money:* ${user.money || 0}
│ *Limit:* ${user.limit || 0}
│ *Level:* ${user.level || 1}
├────
╰────────────────────────`.trim();

    await messageInfo.reply(response);
  }
}

export default {
  Commands: ['register', 'profile', 'me'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  handle,
};
