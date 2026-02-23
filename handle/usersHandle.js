/*
╔══════════════════════════════════════════════╗
║   🤖 Handler: User Registration Check        ║
╠══════════════════════════════════════════════╣
║ Memastikan user sudah terdaftar sebelum      ║
║ menggunakan command (kecuali command publik). ║
║ Priority: 10 (dijalankan awal)               ║
╚══════════════════════════════════════════════╝
*/

import { isUserRegistered, isOwner } from '../lib/users.js';
import { commandWithoutRegister } from '../autoresbot.js';
import mess from '../strings.js';

export default {
  name: 'userRegistrationCheck',
  priority: 10,

  async process(bot, messageInfo) {
    const { senderId, command, prefix } = messageInfo;

    // Skip jika bukan command
    if (!prefix || !command) return true;

    // Skip jika owner
    if (isOwner(senderId)) return true;

    // Skip untuk command yang tidak perlu registrasi
    if (commandWithoutRegister.includes(command)) return true;

    // Cek apakah user sudah terdaftar
    if (!isUserRegistered(senderId)) {
      await messageInfo.reply(mess.general.notRegistered);
      return false; // Hentikan pemrosesan
    }

    return true; // Lanjutkan
  },
};
