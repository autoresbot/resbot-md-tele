/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /id                              ║
╠══════════════════════════════════════════════╣
║ Menampilkan Telegram ID pengguna.            ║
╚══════════════════════════════════════════════╝
*/

async function handle(bot, messageInfo) {
  const { chatId, senderId, senderName, username, isGroup, chat, replyToMessage, message } = messageInfo;

  // Jika reply ke pesan orang lain, tampilkan ID orang itu
  if (replyToMessage && replyToMessage.sender) {
    const target = replyToMessage.sender;
    const response = `🆔 <b>Info User (Reply)</b>

👤 <b>Nama:</b> ${target.first_name || '-'}${target.last_name ? ' ' + target.last_name : ''}
🆔 <b>ID:</b> <code>${target.id}</code>
📛 <b>Username:</b> ${target.username ? '@' + target.username : '-'}
🤖 <b>Bot:</b> ${target.is_bot ? 'Ya' : 'Tidak'}`;

    return await messageInfo.replyHTML(response);
  }

  // Tampilkan ID sendiri
  let response = `🆔 <b>Info ID Kamu</b>

👤 <b>Nama:</b> ${senderName}
🆔 <b>User ID:</b> <code>${senderId}</code>
📛 <b>Username:</b> ${username ? '@' + username : '-'}`;

  // Jika di grup, tambahkan info grup
  if (isGroup) {
    response += `\n\n💬 <b>Info Grup</b>\n📝 <b>Nama:</b> ${chat.title || '-'}\n🆔 <b>Chat ID:</b> <code>${chatId}</code>`;
  }

  await messageInfo.replyHTML(response);
}

export default {
  Commands: ['id'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
  handle,
};
