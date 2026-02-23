/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /ping                           ║
╠══════════════════════════════════════════════╣
║ Mengecek response time bot.                  ║
╚══════════════════════════════════════════════╝
*/

import axios from 'axios';

async function handle(bot, messageInfo) {
  const { chatId, content } = messageInfo;

  try {
    if (!content) {
      // Response time internal
      const startTime = process.hrtime();
      const endTime = process.hrtime(startTime);
      const responseTime = endTime[0] + endTime[1] / 1e9;

      await messageInfo.reply(`⌬ *Response Time:* \`${responseTime.toFixed(6)} s\``);
      return;
    }

    // Ping ke domain eksternal
    await bot.sendChatAction(chatId, 'typing');

    const domain = content.startsWith('http') ? content : `https://${content}`;
    const startTime = process.hrtime();
    await axios.get(domain, { timeout: 10000 });
    const endTime = process.hrtime(startTime);
    const responseTime = endTime[0] + endTime[1] / 1e9;

    await messageInfo.reply(
      `⚡ *Ping Result*\n\n🌐 *Domain:* \`${domain}\`\n⏱ *Response Time:* \`${responseTime.toFixed(6)} s\``,
    );
  } catch (error) {
    await messageInfo.reply('❌ Gagal melakukan ping. Pastikan URL valid!');
  }
}

export default {
  handle,
  Commands: ['ping'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
};
