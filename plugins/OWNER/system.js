/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: Owner - System Management       ║
╠══════════════════════════════════════════════╣
║ System commands: broadcast, listuser,        ║
║ addowner, delowner, reset, ban, dll.         ║
║ Hanya bisa digunakan oleh Owner.             ║
╚══════════════════════════════════════════════╝
*/

import {
  readUsers,
  addOwner,
  delOwner,
  listOwner,
  findUser,
  updateUser,
  resetMoney,
  resetLimit,
  resetMemberOld,
  saveUsers,
  saveOwners,
  db,
} from '../../lib/users.js';
import { inlineKeyboard } from '../../lib/utils.js';

async function handle(bot, messageInfo) {
  const { chatId, senderId, command, content } = messageInfo;

  // ─── /addowner <userId> ─────────────────────
  if (command === 'addowner') {
    const targetId = content.trim();

    if (!targetId) {
      return await messageInfo.reply(
        '⚠️ *Format:* `/addowner <telegramId>`\n\n📝 Contoh: `/addowner 123456789`',
      );
    }

    const result = addOwner(targetId);
    if (result) {
      await saveOwners();
      await messageInfo.reply(`✅ *Berhasil!*\n\n👑 User \`${targetId}\` ditambahkan sebagai Owner.`);
    } else {
      await messageInfo.reply(`⚠️ User \`${targetId}\` sudah terdaftar sebagai Owner!`);
    }
  }

  // ─── /delowner <userId> ─────────────────────
  else if (command === 'delowner') {
    const targetId = content.trim();

    if (!targetId) {
      return await messageInfo.reply(
        '⚠️ *Format:* `/delowner <telegramId>`\n\n📝 Contoh: `/delowner 123456789`',
      );
    }

    if (String(targetId) === String(senderId)) {
      return await messageInfo.reply('⚠️ Kamu tidak bisa menghapus dirimu sendiri dari Owner!');
    }

    const result = delOwner(targetId);
    if (result) {
      await saveOwners();
      await messageInfo.reply(`✅ *Berhasil!*\n\n❌ User \`${targetId}\` dihapus dari Owner.`);
    } else {
      await messageInfo.reply(`⚠️ User \`${targetId}\` bukan Owner!`);
    }
  }

  // ─── /listowner ─────────────────────────────
  else if (command === 'listowner') {
    const owners = listOwner();

    if (owners.length === 0) {
      return await messageInfo.reply('⚠️ Belum ada Owner terdaftar!');
    }

    const ownerList = owners
      .map((id, i) => `${i + 1}. 👑 \`${id}\``)
      .join('\n');

    await messageInfo.reply(`🔐 *Daftar Owner Bot*\n\n${ownerList}\n\n📊 Total: ${owners.length} owner`);
  }

  // ─── /listuser ──────────────────────────────
  else if (command === 'listuser') {
    const users = db;
    const entries = Object.entries(users);

    if (entries.length === 0) {
      return await messageInfo.reply('⚠️ Belum ada user terdaftar!');
    }

    const PAGE_SIZE = 10;
    const page = parseInt(content) || 1;
    const totalPages = Math.ceil(entries.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageEntries = entries.slice(start, end);

    const userList = pageEntries
      .map(([id, user], i) => {
        const premium = user.premium && new Date(user.premium) > new Date() ? '💎' : '👤';
        return `${start + i + 1}. ${premium} *${user.username || '-'}* | ID: \`${id}\` | 🎫${user.limit || 0} | 💰${user.money || 0}`;
      })
      .join('\n');

    let response = `📋 *Daftar User* (Hal. ${page}/${totalPages})\n\n${userList}\n\n📊 Total: ${entries.length} user`;

    // Tombol navigasi
    const buttons = [];
    const navRow = [];
    if (page > 1) navRow.push({ text: '⬅️ Prev', callback_data: `listuser_${page - 1}` });
    if (page < totalPages) navRow.push({ text: '➡️ Next', callback_data: `listuser_${page + 1}` });
    if (navRow.length > 0) buttons.push(navRow);

    if (buttons.length > 0) {
      await bot.sendMessage(chatId, response, {
        parse_mode: 'Markdown',
        ...inlineKeyboard(buttons),
      });
    } else {
      await messageInfo.reply(response);
    }
  }

  // ─── /listuser_<page> (callback navigation) ──
  else if (command === 'listuser' && content) {
    // Handled by the above with content as page number
  }

  // ─── /broadcast <pesan> ─────────────────────
  else if (command === 'broadcast' || command === 'bc') {
    if (!content.trim()) {
      return await messageInfo.reply(
        '⚠️ *Format:* `/broadcast <pesan>`\n\n📝 Contoh: `/broadcast Halo semua! Bot sudah di-update.`',
      );
    }

    const users = Object.keys(db);
    let successCount = 0;
    let failCount = 0;

    await messageInfo.reply(`📢 *Memulai broadcast ke ${users.length} user...*`);

    for (const userId of users) {
      try {
        await bot.sendMessage(
          userId,
          `📢 *BROADCAST*\n\n${content}`,
          { parse_mode: 'Markdown' },
        );
        successCount++;
      } catch (e) {
        failCount++;
      }
      // Delay untuk menghindari rate limit Telegram
      await new Promise((r) => setTimeout(r, 100));
    }

    await messageInfo.reply(
      `✅ *Broadcast Selesai!*\n\n📤 *Berhasil:* ${successCount}\n❌ *Gagal:* ${failCount}\n📊 *Total:* ${users.length}`,
    );
  }

  // ─── /ban <user> ────────────────────────────
  else if (command === 'ban') {
    let targetId;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      targetId = String(messageInfo.replyToMessage.sender.id);
    } else {
      targetId = content.trim();
    }

    if (!targetId) {
      return await messageInfo.reply(
        '⚠️ *Format:* `/ban <userId>` atau reply pesan user',
      );
    }

    const userData = findUser(targetId);
    if (!userData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    updateUser(userData[0], { status: 'banned' });
    await messageInfo.reply(`⛔ *Berhasil!*\n\nUser \`${targetId}\` (${userData[1].username || '-'}) telah di-*BAN*.`);
  }

  // ─── /unban <user> ──────────────────────────
  else if (command === 'unban') {
    let targetId;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      targetId = String(messageInfo.replyToMessage.sender.id);
    } else {
      targetId = content.trim();
    }

    if (!targetId) {
      return await messageInfo.reply(
        '⚠️ *Format:* `/unban <userId>` atau reply pesan user',
      );
    }

    const userData = findUser(targetId);
    if (!userData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    updateUser(userData[0], { status: 'active' });
    await messageInfo.reply(`✅ *Berhasil!*\n\nUser \`${targetId}\` (${userData[1].username || '-'}) telah di-*UNBAN*.`);
  }

  // ─── /resetlimit ───────────────────────────
  else if (command === 'resetlimit') {
    await resetLimit();
    await saveUsers();
    await messageInfo.reply('✅ *Reset Limit Berhasil!*\n\nSemua limit user telah direset ke 0.');
  }

  // ─── /resetmoney ───────────────────────────
  else if (command === 'resetmoney') {
    await resetMoney();
    await saveUsers();
    await messageInfo.reply('✅ *Reset Money Berhasil!*\n\nSemua money user telah direset ke 0.');
  }

  // ─── /clearmember ──────────────────────────
  else if (command === 'clearmember') {
    const deletedCount = resetMemberOld();
    await saveUsers();
    await messageInfo.reply(
      `✅ *Pembersihan Selesai!*\n\n🗑️ *${deletedCount}* member yang tidak aktif selama 30 hari telah dihapus.`,
    );
  }

  // ─── /setlevel <user> <level> ──────────────
  else if (command === 'setlevel') {
    const args = content.trim().split(/\s+/);
    let level;
    let target;

    if (messageInfo.replyToMessage && messageInfo.replyToMessage.sender) {
      const userData = findUser(String(messageInfo.replyToMessage.sender.id));
      if (!userData) return await messageInfo.reply('⚠️ User tersebut belum terdaftar!');
      target = { targetId: userData[0], targetData: userData[1] };
      level = parseInt(args[0]);
    } else {
      if (args.length < 2) {
        return await messageInfo.reply(
          '⚠️ *Format:*\n\n`/setlevel <userId> <level>`\n`/setlevel <level>` _(reply pesan user)_',
        );
      }
      const userData = findUser(args[0]);
      if (!userData) return await messageInfo.reply('⚠️ User tidak ditemukan!');
      target = { targetId: userData[0], targetData: userData[1] };
      level = parseInt(args[1]);
    }

    if (!target || !target.targetData) {
      return await messageInfo.reply('⚠️ User tidak ditemukan!');
    }

    if (isNaN(level) || level < 0) {
      return await messageInfo.reply('⚠️ Level harus berupa angka positif!');
    }

    updateUser(target.targetId, { level: level });
    await messageInfo.reply(
      `✅ *Berhasil!*\n\n👤 *User:* ${target.targetData.username || target.targetId}\n⭐ *Level:* ${target.targetData.level || 0} → *${level}*`,
    );
  }

  // ─── /stats ────────────────────────────────
  else if (command === 'stats') {
    const users = db;
    const totalUsers = Object.keys(users).length;
    const premiumUsers = Object.values(users).filter(
      (u) => u.premium && new Date(u.premium) > new Date(),
    ).length;
    const bannedUsers = Object.values(users).filter((u) => u.status === 'banned').length;
    const activeUsers = Object.values(users).filter((u) => {
      if (!u.updatedAt) return false;
      return Date.now() - new Date(u.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const totalMoney = Object.values(users).reduce((sum, u) => sum + (u.money || 0), 0);
    const totalLimit = Object.values(users).reduce((sum, u) => sum + (u.limit || 0), 0);

    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const response = `
📊 *Statistik Bot*

👥 *Total User:* ${totalUsers}
💎 *Premium:* ${premiumUsers}
⛔ *Banned:* ${bannedUsers}
🟢 *Aktif (7 hari):* ${activeUsers}

💰 *Total Money:* ${totalMoney}
🎫 *Total Limit:* ${totalLimit}

🖥️ *Sistem:*
⏱ Uptime: ${hours}h ${minutes}m ${seconds}s
📏 RAM: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
📦 Version: Resbot ${global.version}
    `.trim();

    await messageInfo.reply(response);
  }
}

export default {
  Commands: [
    'addowner', 'delowner', 'listowner', 'listuser',
    'broadcast', 'bc',
    'ban', 'unban',
    'resetlimit', 'resetmoney', 'clearmember',
    'setlevel', 'stats',
  ],
  OnlyPremium: false,
  OnlyOwner: true,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  handle,
};
