/*
╔══════════════════════════════════════════════╗
║     🤖 RESBOT TELEGRAM - Startup             ║
╠══════════════════════════════════════════════╣
║ Menampilkan info server dan memulai koneksi  ║
║ bot Telegram.                                ║
╚══════════════════════════════════════════════╝
*/

import os from 'os';
import chalk from 'chalk';
import figlet from 'figlet';
import config from '../config.js';
import { success, danger } from '../lib/utils.js';
import { connectToTelegram } from '../lib/connection.js';

const TERMINAL_WIDTH = process.stdout.columns || 45;
const ALIGNMENT_PADDING = 5;

const horizontalLine = (length = TERMINAL_WIDTH, char = '=') => char.repeat(length);

const getServerSpecs = async () => ({
  hostname: os.hostname(),
  platform: os.platform(),
  arch: os.arch(),
  nodeVersion: process.versions.node,
  totalMemory: `${(os.totalmem() / 1024 ** 3).toFixed(2)} GB`,
  freeMemory: `${(os.freemem() / 1024 ** 3).toFixed(2)} GB`,
  uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
  mode: config.mode,
  botMode: config.BOT_MODE,
});

async function showServerInfo(e = {}) {
  const { title: t = 'RESBOT', borderChar: o = '=', color: i = 'cyan' } = e;

  const n = {
    horizontalLayout: TERMINAL_WIDTH > 40 ? 'default' : 'fitted',
    width: Math.min(TERMINAL_WIDTH - 4, 40),
  };

  const a = await getServerSpecs();

  const labels = [
    '◧ Hostname',
    '◧ Platform',
    '◧ Architecture',
    '◧ Node.js',
    '◧ Total Memory',
    '◧ Free Memory',
    '◧ Uptime',
    '◧ Mode',
    '◧ Bot Mode',
  ];
  const values = Object.values(a);
  const maxLen = Math.max(...labels.map((l) => l.length));

  const specLines = labels
    .map((label, idx) => `${chalk.green(label.padEnd(maxLen + ALIGNMENT_PADDING))}: ${values[idx]}`)
    .join('\n');

  console.log(
    `\n${chalk[i](horizontalLine(TERMINAL_WIDTH, o))}\n` +
      `${chalk[i](figlet.textSync(t, n))}\n` +
      `${chalk[i](horizontalLine(TERMINAL_WIDTH, o))}\n\n` +
      `${chalk.yellow.bold('◧ Info Script :')}\n` +
      `${chalk.green('Version:')} Resbot Telegram ${global.version}\n` +
      `${chalk.green('Platform:')} Telegram Bot API\n` +
      `${chalk.yellow.bold('------------------')}\n` +
      `${chalk.yellow.bold('◧ Server Specifications :')}\n` +
      `${specLines}\n\n` +
      `${chalk[i](horizontalLine(TERMINAL_WIDTH, o))}\n` +
      `${chalk[i].bold(' ◧ Thank you for using this script! ◧ ')}\n` +
      `${chalk[i](horizontalLine(TERMINAL_WIDTH, o))}\n`,
  );
}

async function start_app() {
  await showServerInfo();

  // Validasi token
  if (!config.BOT_TOKEN || config.BOT_TOKEN === 'your_bot_token_here') {
    danger('Error', 'BOT_TOKEN belum dikonfigurasi!');
    danger('Info', 'Langkah-langkah:');
    console.log(chalk.yellow('  1. Buka Telegram dan cari @BotFather'));
    console.log(chalk.yellow('  2. Kirim /newbot dan ikuti instruksi'));
    console.log(chalk.yellow('  3. Salin token dan masukkan ke file .env'));
    console.log(chalk.yellow('  4. Restart bot'));
    process.exit(1);
  }

  await connectToTelegram();
}

export { showServerInfo, start_app, getServerSpecs };
