/*
╔══════════════════════════════════════════════╗
║          🤖 RESBOT TELEGRAM                  ║
╠══════════════════════════════════════════════╣
║ 📦 Version    : 1.0.0                       ║
║ 👨‍💻 Developer  : Azhari Creative             ║
║ 🌐 Website    : https://autoresbot.com      ║
║ 📡 Platform   : Telegram Bot API            ║
╚══════════════════════════════════════════════╝
*/

import moment from 'moment-timezone';

// ─── Konfigurasi Bot Telegram ─────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const BOT_MODE = process.env.BOT_MODE || 'polling'; // polling atau webhook
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '3000', 10);

const OWNER_NAME = 'Autoresbot';
const APIKEY = process.env.APIKEY || '';
const RATE_LIMIT = 3000; // 3 detik/chat
const SIMILARITY = true; // Pencarian kemiripan command
const MODE = 'production'; // [production, development]
const VERSION = global.version;

const EMAIL = 'autoresbot@gmail.com';
const REGION = 'Indonesia';
const WEBSITE = 'autoresbot.com';

// Owner Telegram User IDs (bisa berupa angka atau string)
const DATA_OWNER = [6398972009]; // 6398972009

// Konfiqurasi Chat
const DESTINATION = 'both'; // group, private, both
const AUTO_READ = false; // (tidak berlaku di Telegram, bot tidak bisa baca status)
const MIDNIGHT_RESTART = false;

// Prefix untuk command
// Di Telegram biasanya menggunakan "/" tapi bisa juga karakter lain
const PREFIX = ['/', '.', '#'];
const STATUS_PREFIX = true;

// Anti-spam di grup
const SPAM_LIMIT = 3;
const SPAM_COOLDOWN = 10;
const SPAM_WARNING = 3;
const SPAM_ACTION = 'both'; // kick, block, both

// Badword
const BADWORD_WARNING = 3;
const BADWORD_ACTION = 'both'; // kick, block, both

// Claim Reward
const CLAIM_MONEY = 7;        // Jumlah money per claim
const CLAIM_LIMIT = 9;        // Jumlah limit per claim
const CLAIM_COOLDOWN = 60;    // Cooldown dalam menit (60 = 1 jam)

const config = {
  // ─── Telegram Bot ────────────────────
  BOT_TOKEN,
  BOT_MODE,
  WEBHOOK_URL,
  WEBHOOK_PORT,
  APIKEY,

  // ─── Identitas ──────────────────────
  owner_name: OWNER_NAME,
  owner_ids: DATA_OWNER,
  owner_email: EMAIL,
  region: REGION,
  owner_website: WEBSITE,
  version: VERSION,

  // ─── Bot Settings ───────────────────
  bot_destination: DESTINATION,
  rate_limit: RATE_LIMIT,
  status_prefix: STATUS_PREFIX,
  prefix: PREFIX,
  mode: MODE,
  commandSimilarity: SIMILARITY,
  midnight_restart: MIDNIGHT_RESTART,

  // ─── Sticker ────────────────────────
  sticker_packname: OWNER_NAME,
  sticker_author: `Date: ${moment
    .tz('Asia/Jakarta')
    .format('DD/MM/YY')}\nOwner: Azhari Creative`,

  // ─── Spam Protection ────────────────
  SPAM: {
    limit: SPAM_LIMIT,
    cooldown: SPAM_COOLDOWN,
    warning: SPAM_WARNING,
    action: SPAM_ACTION,
  },

  // ─── Badword Protection ─────────────
  BADWORD: {
    warning: BADWORD_WARNING,
    action: BADWORD_ACTION,
  },

  // ─── Claim Reward ────────────────────
  CLAIM: {
    money: CLAIM_MONEY,
    limit: CLAIM_LIMIT,
    cooldown: CLAIM_COOLDOWN,
  },
};

export default config;
