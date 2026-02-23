/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: Owner - Manage Users             ║
╠══════════════════════════════════════════════╣
║ Kelola limit, money, dan premium user.       ║
║ Hanya bisa digunakan oleh Owner.             ║
╚══════════════════════════════════════════════╝
*/

import { findUser, updateUser, isPremiumUser } from '../../lib/users.js';
import { inlineKeyboard } from '../../lib/utils.js';

/**
 * Resolve target user dari reply atau argument
 * Return: { targetId, targetData } atau null
 */
function resolveTarget(messageInfo, content) {
  let targetId = null;

  // 1. Dari reply ke pesan user
  if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
    targetId = messageInfo.replyToMessage.sender.id;
  }
  // 2. Dari argument (Telegram ID atau @username)
  else if (content) {
    const args = content.trim().split(/\s+/);
    const identifier = args[0];

    // Hapus @ jika ada
    targetId = identifier.startsWith('@') ? identifier.slice(1) : identifier;
  }

  if (!targetId) return null;

  const userData = findUser(targetId);
  if (!userData) return null;

  return { targetId: userData[0], targetData: userData[1] };
}

async function handle(bot, messageInfo) {
  const { chatId, senderId, command, content } = messageInfo;

  // ─── /addlimit <user> <jumlah> ──────────────
  if (command === 'addlimit') {
    const args = content.trim().split(/\s+/);

    // Jika reply, args[0] = jumlah. Jika tidak reply, args[0] = user, args[1] = jumlah
    let amount;
    let target;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      target = resolveTarget(messageInfo, '');
      // Pakai reply, jadi args[0] = jumlah
      target = { targetId: String(messageInfo.replyToMessage.sender.id), targetData: null };
      const userData = findUser(target.targetId);
      if (userData) {
        target.targetId = userData[0];
        target.targetData = userData[1];
      } else {
        return await messageInfo.reply('⚠️ User tersebut belum terdaftar!');
      }
      amount = parseInt(args[0]);
    } else {
      if (args.length < 2) {
        return await messageInfo.reply(
          '⚠️ *Format:*\n\n' +
          '`/addlimit <userId> <jumlah>`\n' +
          '`/addlimit <jumlah>` _(reply pesan user)_\n\n' +
          '📝 Contoh: `/addlimit 123456789 100`',
        );
      }
      target = resolveTarget(messageInfo, args[0]);
      amount = parseInt(args[1]);
    }

    if (!target || !target.targetData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan! Pastikan user sudah terdaftar.');
    }

    if (isNaN(amount) || amount <= 0) {
      return await messageInfo.reply('⚠️ Jumlah harus berupa angka positif!');
    }

    const newLimit = (target.targetData.limit || 0) + amount;
    updateUser(target.targetId, { limit: newLimit });

    await messageInfo.reply(
      `✅ *Berhasil!*\n\n👤 *User:* ${target.targetData.username || target.targetId}\n🎫 *Limit:* ${target.targetData.limit || 0} → *${newLimit}*\n➕ *Ditambahkan:* +${amount}`,
    );
  }

  // ─── /addmoney <user> <jumlah> ─────────────
  else if (command === 'addmoney') {
    const args = content.trim().split(/\s+/);
    let amount;
    let target;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      const userData = findUser(String(messageInfo.replyToMessage.sender.id));
      if (!userData) return await messageInfo.reply('⚠️ User tersebut belum terdaftar!');
      target = { targetId: userData[0], targetData: userData[1] };
      amount = parseInt(args[0]);
    } else {
      if (args.length < 2) {
        return await messageInfo.reply(
          '⚠️ *Format:*\n\n' +
          '`/addmoney <userId> <jumlah>`\n' +
          '`/addmoney <jumlah>` _(reply pesan user)_\n\n' +
          '📝 Contoh: `/addmoney 123456789 5000`',
        );
      }
      target = resolveTarget(messageInfo, args[0]);
      amount = parseInt(args[1]);
    }

    if (!target || !target.targetData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    if (isNaN(amount) || amount <= 0) {
      return await messageInfo.reply('⚠️ Jumlah harus berupa angka positif!');
    }

    const newMoney = (target.targetData.money || 0) + amount;
    updateUser(target.targetId, { money: newMoney });

    await messageInfo.reply(
      `✅ *Berhasil!*\n\n👤 *User:* ${target.targetData.username || target.targetId}\n💰 *Money:* ${target.targetData.money || 0} → *${newMoney}*\n➕ *Ditambahkan:* +${amount}`,
    );
  }

  // ─── /dellimit <user> <jumlah> ──────────────
  else if (command === 'dellimit') {
    const args = content.trim().split(/\s+/);
    let amount;
    let target;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      const userData = findUser(String(messageInfo.replyToMessage.sender.id));
      if (!userData) return await messageInfo.reply('⚠️ User tersebut belum terdaftar!');
      target = { targetId: userData[0], targetData: userData[1] };
      amount = parseInt(args[0]);
    } else {
      if (args.length < 2) {
        return await messageInfo.reply(
          '⚠️ *Format:*\n\n' +
          '`/dellimit <userId> <jumlah>`\n' +
          '`/dellimit <jumlah>` _(reply pesan user)_\n\n' +
          '📝 Contoh: `/dellimit 123456789 50`',
        );
      }
      target = resolveTarget(messageInfo, args[0]);
      amount = parseInt(args[1]);
    }

    if (!target || !target.targetData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    if (isNaN(amount) || amount <= 0) {
      return await messageInfo.reply('⚠️ Jumlah harus berupa angka positif!');
    }

    const newLimit = Math.max(0, (target.targetData.limit || 0) - amount);
    updateUser(target.targetId, { limit: newLimit });

    await messageInfo.reply(
      `✅ *Berhasil!*\n\n👤 *User:* ${target.targetData.username || target.targetId}\n🎫 *Limit:* ${target.targetData.limit || 0} → *${newLimit}*\n➖ *Dikurangi:* -${amount}`,
    );
  }

  // ─── /delmoney <user> <jumlah> ─────────────
  else if (command === 'delmoney') {
    const args = content.trim().split(/\s+/);
    let amount;
    let target;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      const userData = findUser(String(messageInfo.replyToMessage.sender.id));
      if (!userData) return await messageInfo.reply('⚠️ User tersebut belum terdaftar!');
      target = { targetId: userData[0], targetData: userData[1] };
      amount = parseInt(args[0]);
    } else {
      if (args.length < 2) {
        return await messageInfo.reply(
          '⚠️ *Format:*\n\n' +
          '`/delmoney <userId> <jumlah>`\n' +
          '`/delmoney <jumlah>` _(reply pesan user)_\n\n' +
          '📝 Contoh: `/delmoney 123456789 1000`',
        );
      }
      target = resolveTarget(messageInfo, args[0]);
      amount = parseInt(args[1]);
    }

    if (!target || !target.targetData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    if (isNaN(amount) || amount <= 0) {
      return await messageInfo.reply('⚠️ Jumlah harus berupa angka positif!');
    }

    const newMoney = Math.max(0, (target.targetData.money || 0) - amount);
    updateUser(target.targetId, { money: newMoney });

    await messageInfo.reply(
      `✅ *Berhasil!*\n\n👤 *User:* ${target.targetData.username || target.targetId}\n💰 *Money:* ${target.targetData.money || 0} → *${newMoney}*\n➖ *Dikurangi:* -${amount}`,
    );
  }

  // ─── /addpremium <user> <hari> ─────────────
  else if (command === 'addpremium') {
    const args = content.trim().split(/\s+/);
    let days;
    let target;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      const userData = findUser(String(messageInfo.replyToMessage.sender.id));
      if (!userData) return await messageInfo.reply('⚠️ User tersebut belum terdaftar!');
      target = { targetId: userData[0], targetData: userData[1] };
      days = parseInt(args[0]);
    } else {
      if (args.length < 2) {
        return await messageInfo.reply(
          '⚠️ *Format:*\n\n' +
          '`/addpremium <userId> <hari>`\n' +
          '`/addpremium <hari>` _(reply pesan user)_\n\n' +
          '📝 Contoh: `/addpremium 123456789 30`',
        );
      }
      target = resolveTarget(messageInfo, args[0]);
      days = parseInt(args[1]);
    }

    if (!target || !target.targetData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    if (isNaN(days) || days <= 0) {
      return await messageInfo.reply('⚠️ Jumlah hari harus berupa angka positif!');
    }

    // Hitung tanggal premium baru
    const currentPremium = target.targetData.premium ? new Date(target.targetData.premium) : new Date();
    const baseDate = currentPremium > new Date() ? currentPremium : new Date();
    const newPremiumDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    updateUser(target.targetId, { premium: newPremiumDate.toISOString() });

    await messageInfo.reply(
      `✅ *Premium Ditambahkan!*\n\n👤 *User:* ${target.targetData.username || target.targetId}\n💎 *Premium s/d:* ${newPremiumDate.toLocaleDateString('id-ID')}\n📅 *Durasi:* +${days} hari`,
    );
  }

  // ─── /delpremium <user> ────────────────────
  else if (command === 'delpremium') {
    let target;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      const userData = findUser(String(messageInfo.replyToMessage.sender.id));
      if (!userData) return await messageInfo.reply('⚠️ User tersebut belum terdaftar!');
      target = { targetId: userData[0], targetData: userData[1] };
    } else {
      if (!content.trim()) {
        return await messageInfo.reply(
          '⚠️ *Format:*\n\n`/delpremium <userId>`\n`/delpremium` _(reply pesan user)_',
        );
      }
      target = resolveTarget(messageInfo, content.trim());
    }

    if (!target || !target.targetData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    updateUser(target.targetId, { premium: null });

    await messageInfo.reply(
      `✅ *Premium Dihapus!*\n\n👤 *User:* ${target.targetData.username || target.targetId}\n💎 *Premium:* ❌ Tidak Aktif`,
    );
  }

  // ─── /cekuser <user> ──────────────────────
  else if (command === 'cekuser') {
    let target;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      const userData = findUser(String(messageInfo.replyToMessage.sender.id));
      if (!userData) return await messageInfo.reply('⚠️ User tersebut belum terdaftar!');
      target = { targetId: userData[0], targetData: userData[1] };
    } else {
      if (!content.trim()) {
        return await messageInfo.reply(
          '⚠️ *Format:*\n\n`/cekuser <userId>`\n`/cekuser` _(reply pesan user)_',
        );
      }
      target = resolveTarget(messageInfo, content.trim());
    }

    if (!target || !target.targetData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    const user = target.targetData;
    const premiumStatus = isPremiumUser(target.targetId)
      ? `✅ Aktif (s/d ${new Date(user.premium).toLocaleDateString('id-ID')})`
      : '❌ Tidak Aktif';

    const response = `
🔍 *Detail User*

👤 *Username:* ${user.username || '-'}
👤 *Nama:* ${user.firstName || '-'}
🆔 *Telegram ID:* \`${target.targetId}\`
💎 *Premium:* ${premiumStatus}
💰 *Money:* ${user.money || 0}
🎫 *Limit:* ${user.limit || 0}
⭐ *Level:* ${user.level || 1}
📊 *Role:* ${user.role || 'user'}
📊 *Status:* ${user.status || 'active'}
📅 *Terdaftar:* ${new Date(user.createdAt).toLocaleDateString('id-ID')}
🕐 *Terakhir aktif:* ${new Date(user.updatedAt).toLocaleDateString('id-ID')}
    `.trim();

    await messageInfo.reply(response);
  }
}

export default {
  Commands: ['addlimit', 'addmoney', 'dellimit', 'delmoney', 'addpremium', 'delpremium', 'cekuser'],
  OnlyPremium: false,
  OnlyOwner: true,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  handle,
};
