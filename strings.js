/*
╔══════════════════════════════════════════════╗
║          🤖 RESBOT TELEGRAM                  ║
╠══════════════════════════════════════════════╣
║ 📦 Version    : 1.0.0                       ║
║ 📡 Platform   : Telegram Bot API            ║
╚══════════════════════════════════════════════╝
*/

const mess = {
  game: {
    isPlaying:
      '⚠️ _Permainan sedang berlangsung._ Ketik *nyerah* untuk mengakhiri permainan.',
    isGroup: '⚠️ _Permainan hanya bisa dimainkan di grup_',
    isStop: '⚠️ _Fitur game dimatikan di grup ini_',
  },
  general: {
    isOwner: '⚠️ Perintah ini hanya untuk Owner Bot.',
    isPremium: '⚠️ Perintah ini hanya untuk pengguna premium.',
    isAdmin: '⚠️ Perintah ini hanya untuk Admin',
    isGroup: '⚠️ Perintah ini hanya digunakan di grup',
    limit:
      '⚠️ Limit kamu sudah habis.\n\nKetik /claim untuk mendapatkan limit.\nAtau 💎 Berlangganan Member Premium agar limitmu tanpa batas.',
    success: '✅ Berhasil!',
    isBlocked: '⚠️ Kamu sedang diblokir dari penggunaan bot ini.',
    isBanned: '⚠️ Kamu sedang diban pada grup ini.',
    fiturBlocked: '⚠️ Fitur sedang diban di grup ini.',
    notRegistered: '⚠️ Kamu belum terdaftar. Ketik /register <username> untuk mendaftar.',
  },
  action: {
    user_kick: '✅ Berhasil mengeluarkan peserta dari grup.',
    mute: 'Grup telah berhasil di-mute. Semua perintah akan dinonaktifkan kecuali /unmute.',
    unmute: 'Grup telah berhasil di-unmute. Semua perintah kembali aktif.',
  },
  handler: {
    badword_warning:
      '⚠️ *BADWORD TERDETEKSI* (@detectword)\n\n@sender telah diperingati (@warning/@totalwarning)',
    badword_block:
      '⛔ @sender Telah diblokir karena mengirim *BADWORD* secara berulang.',
    antispamchat:
      '⚠️ @sender Jangan spam, ini peringatan ke-@warning dari @totalwarning.',
    antispamchat2:
      '⛔ @sender Telah diblokir karena melakukan spam secara berulang.',
  },
  game_handler: {
    menyerah: 'Yahh Menyerah\nJawaban: @answer\n\nIngin bermain? Ketik *@command*',
    waktu_habis: '⏳ Waktu habis! Jawabannya : @answer',
  },
};

export default mess;
