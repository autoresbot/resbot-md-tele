/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /claim                          ║
╠══════════════════════════════════════════════╣
║ Klaim reward harian (money & limit).         ║
║ Cooldown bisa diatur di config.js            ║
╚══════════════════════════════════════════════╝
*/

import config from '../../config.js';
import { findUser, updateUser } from '../../lib/users.js';

// Simpan waktu claim terakhir per user (in-memory)
const claimCooldowns = new Map();

async function handle(bot, messageInfo) {
  const { senderId, senderName } = messageInfo;

  // Cek apakah user terdaftar
  const userData = findUser(senderId);
  if (!userData) {
    return await messageInfo.reply('⚠️ Kamu belum terdaftar.\n\nKetik /register <username> untuk mendaftar.');
  }

  const [docId, user] = userData;
  const now = Date.now();
  const cooldownMs = config.CLAIM.cooldown * 60 * 1000; // Menit ke milidetik

  // Cek cooldown
  const lastClaim = claimCooldowns.get(String(senderId));
  if (lastClaim) {
    const remaining = cooldownMs - (now - lastClaim);
    if (remaining > 0) {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      return await messageInfo.reply(
        `⏳ Kamu sudah claim!\n\nTunggu *${minutes} menit ${seconds} detik* lagi.`,
      );
    }
  }

  // Berikan reward
  const newMoney = (user.money || 0) + config.CLAIM.money;
  const newLimit = (user.limit || 0) + config.CLAIM.limit;

  updateUser(senderId, { money: newMoney, limit: newLimit });

  // Set cooldown
  claimCooldowns.set(String(senderId), now);

  await messageInfo.reply(
    `🎁 *Claim Berhasil!*\n\nKamu dapat *${config.CLAIM.money} money* dan *${config.CLAIM.limit} limit*!\n\n💰 Money: *${newMoney}*\n🎫 Limit: *${newLimit}*`,
  );
}

export default {
  Commands: ['claim'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  handle,
};
