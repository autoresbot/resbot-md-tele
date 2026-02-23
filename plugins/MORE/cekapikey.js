/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /cekapikey                      ║
╠══════════════════════════════════════════════╣
║ Cek status dan masa aktif API key bot.       ║
╚══════════════════════════════════════════════╝
*/

import ApiAutoresbotModule from 'api-autoresbot';
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from '../../config.js';

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

async function handle(bot, messageInfo) {
  const { chatId } = messageInfo;

  try {
    await bot.sendChatAction(chatId, 'typing');

    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.get('/check_apikey');

    if (response && response.limit_key) {
      const tanggalAktif = new Date(response.limit_key * 1000);
      const formattedDate = `${tanggalAktif.getDate()} ${BULAN[tanggalAktif.getMonth()]} ${tanggalAktif.getFullYear()}`;

      await messageInfo.reply(
        `✅ *Apikey Aktif*\n\n◧ Masa Aktif Hingga: *${formattedDate}*\n◧ Limit: *${response.limit_apikey}*`,
      );
    } else {
      await messageInfo.reply('⛔ Apikey Tidak Terdaftar / Expired');
    }
  } catch (error) {
    await messageInfo.reply(`❌ Error: ${error.message}`);
  }
}

export default {
  handle,
  Commands: ['cekapikey', 'apikey'],
  OnlyPremium: false,
  OnlyOwner: false,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
};
