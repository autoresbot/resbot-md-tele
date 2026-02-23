# 🤖 Resbot Telegram

> Bot Telegram multifungsi dengan arsitektur plugin-based yang scalable dan mudah dikembangkan.

```
╔══════════════════════════════════════════════╗
║          🤖 RESBOT TELEGRAM                  ║
╠══════════════════════════════════════════════╣
║ 📦 Version    : 1.0.0                       ║
║ 👨‍💻 Developer  : Azhari Creative             ║
║ 🌐 Website    : https://autoresbot.com      ║
║ 📡 Platform   : Telegram Bot API            ║
╚══════════════════════════════════════════════╝
```

## 📌 Pendahuluan

Resbot Telegram adalah bot multifungsi yang dibangun di atas **Telegram Bot API** resmi. Bot ini memiliki arsitektur modular berbasis plugin sehingga sangat mudah untuk menambahkan fitur baru.

### Kenapa Telegram?

- ✅ **Bot API Resmi** — Telegram menyediakan Bot API yang stabil dan terdokumentasi
- ✅ **Tanpa Reverse Engineering** — Tidak bergantung pada library pihak ketiga yang rawan berubah
- ✅ **Stabil & Resmi** — Tidak ada masalah koneksi atau session management
- ✅ **Rich Features** — Inline keyboard, callback query, webhook support
- ✅ **No Phone Number Needed** — Bot memiliki identitas sendiri via @BotFather

## 🚀 Quick Start

### 1. Prasyarat

- Node.js 18+ terinstall
- Bot Token dari [@BotFather](https://t.me/BotFather)

### 2. Buat Bot Token

1. Buka Telegram dan cari `@BotFather`
2. Kirim `/newbot`
3. Ikuti instruksi untuk memberi nama bot
4. Salin token yang diberikan

### 3. Konfigurasi

```bash
# Salin file environment
cp .env.example .env

# Edit file .env dan masukkan token
BOT_TOKEN=your_bot_token_here
```

### 4. Install & Jalankan

```bash
# Install dependencies
npm install

# Jalankan bot
npm start

# Atau development mode (auto-reload)
npm run dev
```

## 📁 Struktur Project

```
resbot-telegram/
│
├── index.js                 # Entry point utama
├── config.js                # Konfigurasi bot
├── autoresbot.js            # Core message processing
├── strings.js               # String messages/templates
├── .env                     # Environment variables (token, dll)
├── .env.example             # Template environment
├── package.json             # Dependencies & scripts
│
├── lib/                     # Core library
│   ├── connection.js        # Koneksi Telegram (polling/webhook)
│   ├── serializeMessage.js  # Serialize update Telegram
│   ├── handler.js           # Pre-process handler pipeline
│   ├── plugins.js           # Plugin loader
│   ├── users.js             # User management
│   ├── utils.js             # Utility functions
│   ├── logger.js            # Logging system (Winston)
│   ├── startup.js           # Startup & server info
│   └── version.js           # Version management
│
├── handle/                  # Pre-process handlers
│   └── usersHandle.js       # Cek registrasi user
│
├── plugins/                 # Plugin commands (auto-loaded)
│   ├── start.js             # /start - Welcome message
│   ├── menu.js              # /menu & /allmenu
│   ├── owner.js             # /owner info
│   ├── AI/                  # Kategori AI
│   │   └── ai.js            # /ai - Chat AI
│   ├── TOOLS/               # Kategori Tools
│   │   ├── ping.js          # /ping - Response time
│   │   └── sticker.js       # /sticker - Buat sticker
│   ├── INFORMATION/         # Kategori Info
│   │   └── register.js      # /register & /profile
│   └── ...                  # Kategori lainnya
│
├── database/                # Data storage (JSON)
│   ├── users.json           # Data pengguna
│   ├── owner.json           # Data owner
│   ├── menu.js              # Menu loader
│   ├── assets/              # Asset files
│   └── ...
│
├── tmp/                     # Temporary files
└── logs/                    # Log files
```

## 🔌 Arsitektur Plugin

### Format Plugin

Setiap plugin adalah file `.js` yang mengekspor default object:

```javascript
async function handle(bot, messageInfo) {
  const { chatId, senderId, senderName, content, command, prefix } = messageInfo;

  // Tampilkan typing indicator
  await bot.sendChatAction(chatId, 'typing');

  // Kirim response
  await messageInfo.reply('Halo! 👋');
}

export default {
  Commands: ['hello', 'hi'],     // Array command yang di-handle
  OnlyPremium: false,             // Hanya untuk premium
  OnlyOwner: false,               // Hanya untuk owner
  OnlyGroup: false,               // Hanya di grup
  OnlyPrivate: false,             // Hanya di private
  OnlyAdmin: false,               // Hanya untuk admin grup
  limitDeduction: 0,              // Pengurangan limit per penggunaan
  handle,
};
```

### MessageInfo Object

Object `messageInfo` yang diterima setiap plugin berisi:

| Property         | Type     | Deskripsi                           |
| ---------------- | -------- | ----------------------------------- |
| `chatId`         | number   | ID chat (grup/private)              |
| `senderId`       | number   | Telegram User ID pengirim           |
| `senderName`     | string   | Nama pengirim                       |
| `username`       | string   | Username Telegram (@username)       |
| `isGroup`        | boolean  | Apakah dari grup                    |
| `isPrivate`      | boolean  | Apakah dari private chat            |
| `command`        | string   | Nama command (tanpa prefix)         |
| `prefix`         | string   | Prefix yang digunakan               |
| `content`        | string   | Teks setelah command                |
| `fullText`       | string   | Teks lengkap                        |
| `message`        | object   | Raw message dari Telegram           |
| `photo`          | array    | Data foto (jika ada)                |
| `video`          | object   | Data video (jika ada)               |
| `document`       | object   | Data dokumen (jika ada)             |
| `replyToMessage` | object   | Pesan yang di-reply (jika ada)      |
| `reply(text)`    | function | Helper untuk reply dengan Markdown  |
| `replyHTML(text)` | function | Helper untuk reply dengan HTML      |
| `replyPhoto()`   | function | Helper untuk kirim foto             |
| `replyDocument()` | function | Helper untuk kirim dokumen          |
| `replyVideo()`   | function | Helper untuk kirim video            |
| `replySticker()` | function | Helper untuk kirim sticker          |

### Menambah Plugin Baru

1. Buat file `.js` di folder `plugins/` (atau subfolder kategori)
2. Ikuti format plugin di atas
3. Plugin akan otomatis ter-load saat bot start
4. Di **development mode**, plugin akan auto-reload saat file berubah

## 🔧 Konfigurasi

### Environment Variables (`.env`)

| Variable       | Deskripsi                          | Default   |
| -------------- | ---------------------------------- | --------- |
| `BOT_TOKEN`    | Token dari @BotFather              | (wajib)   |
| `BOT_MODE`     | Mode koneksi: `polling`/`webhook`  | `polling` |
| `WEBHOOK_URL`  | URL webhook (jika mode webhook)    | -         |
| `WEBHOOK_PORT` | Port webhook                       | `3000`    |
| `APIKEY`       | API key untuk layanan eksternal    | -         |

### Config.js

Pengaturan tambahan seperti owner IDs, rate limit, prefix, dan fitur proteksi bisa diatur di `config.js`.

## 📡 Mode Koneksi

### Polling (Development)
```env
BOT_MODE=polling
```
Bot akan terus-menerus memanggil API Telegram untuk mengecek update baru. Cocok untuk development.

### Webhook (Production)
```env
BOT_MODE=webhook
WEBHOOK_URL=https://yourdomain.com
WEBHOOK_PORT=3000
```
Telegram akan mengirim update langsung ke server Anda. Lebih efisien untuk production.

## 🛡️ Fitur Keamanan

- **Rate Limiter** — Mencegah spam command
- **Owner System** — Command khusus owner
- **Premium System** — Fitur eksklusif untuk premium user
- **Admin Check** — Command khusus admin grup
- **Limit System** — Batasi penggunaan per user
- **Registration** — User harus register sebelum menggunakan bot

## 📝 License

ISC License

## 👨‍💻 Credits

- **Developer:** Azhari Creative
- **Website:** [autoresbot.com](https://autoresbot.com)
- **Platform:** Telegram Bot API via [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
