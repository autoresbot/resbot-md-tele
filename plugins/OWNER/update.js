/*
╔══════════════════════════════════════════════╗
║   🤖 Plugin: /update                         ║
╠══════════════════════════════════════════════╣
║ Update bot ke versi terbaru dari GitHub.     ║
║ Hanya bisa digunakan oleh owner.             ║
╚══════════════════════════════════════════════╝
*/

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import unzipper from 'unzipper';
import fse from 'fs-extra';

const SERVER_URL = 'https://github.com/autoresbot/resbot-md-tele/archive/refs/heads/master.zip';
const VERSION_URL = 'https://raw.githubusercontent.com/autoresbot/resbot-md-tele/master/version.txt';

// File/folder yang TIDAK akan ditimpa saat update
const WHITELIST_FILE = ['config.js', 'strings.js', 'database', '.env', 'nodemon.json'];

async function handle(bot, messageInfo) {
  const { chatId } = messageInfo;

  try {
    await bot.sendChatAction(chatId, 'typing');
    const statusMsg = await messageInfo.reply('⏳ *Memeriksa update...*');

    // ===== CHECK VERSION =====
    const localVersionPath = path.join(process.cwd(), 'version.txt');

    let localVersion = '0.0.0';
    if (fs.existsSync(localVersionPath)) {
      localVersion = fs.readFileSync(localVersionPath, 'utf-8').trim();
    }

    // Ambil versi terbaru
    let remoteVersion;
    try {
      const versionResponse = await axios.get(VERSION_URL, { timeout: 10000 });
      remoteVersion = versionResponse.data.trim();
    } catch {
      await bot.editMessageText('❌ Gagal mengambil info versi terbaru.', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
      return;
    }

    if (!remoteVersion) {
      await bot.editMessageText('❌ Remote version kosong.', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
      return;
    }

    if (localVersion === remoteVersion) {
      await bot.editMessageText(`✅ Versi sudah terbaru (*${localVersion}*)`, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      });
      return;
    }

    // ===== DOWNLOAD & UPDATE =====
    await bot.editMessageText('📥 *Mengunduh update...*', {
      chat_id: chatId,
      message_id: statusMsg.message_id,
      parse_mode: 'Markdown',
    });

    const zipPath = path.join(process.cwd(), 'update.zip');
    const extractPath = path.join(process.cwd(), 'update_temp');

    // 1️⃣ Download ZIP
    const response = await axios({
      method: 'GET',
      url: SERVER_URL,
      responseType: 'stream',
      timeout: 60000,
    });

    const writer = fs.createWriteStream(zipPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // 2️⃣ Extract ZIP
    await bot.editMessageText('📦 *Mengekstrak file...*', {
      chat_id: chatId,
      message_id: statusMsg.message_id,
      parse_mode: 'Markdown',
    });

    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    const extractedFolders = fs.readdirSync(extractPath);
    if (!extractedFolders.length) {
      throw new Error('Folder hasil extract tidak ditemukan');
    }

    const sourceBase = path.join(extractPath, extractedFolders[0]);
    const targetBase = process.cwd();

    // 3️⃣ Copy files (skip whitelist)
    await bot.editMessageText('🔄 *Memperbarui file...*', {
      chat_id: chatId,
      message_id: statusMsg.message_id,
      parse_mode: 'Markdown',
    });

    const items = fs.readdirSync(sourceBase);
    for (const item of items) {
      if (WHITELIST_FILE.includes(item)) continue;

      const sourcePath = path.join(sourceBase, item);
      const targetPath = path.join(targetBase, item);

      await fse.copy(sourcePath, targetPath, {
        overwrite: true,
        errorOnExist: false,
      });
    }

    // 4️⃣ Update version.txt
    fs.writeFileSync(localVersionPath, remoteVersion);

    // Cleanup
    await fse.remove(zipPath);
    await fse.remove(extractPath);

    const whitelistText = WHITELIST_FILE.map((v) => `  • ${v}`).join('\n');

    await bot.editMessageText(
      `✅ *Update Berhasil!*\n\n` +
      `◧ Versi lama: *${localVersion}*\n` +
      `◧ Versi baru: *${remoteVersion}*\n\n` +
      `📁 Tidak ditimpa:\n${whitelistText}\n\n` +
      `_Silakan restart bot._`,
      {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      },
    );
  } catch (error) {
    console.error('Update Error:', error);
    await messageInfo.reply(`❌ Gagal update.\n${error.message}`);
  }
}

export default {
  handle,
  Commands: ['update'],
  OnlyPremium: false,
  OnlyOwner: true,
  OnlyGroup: false,
  OnlyPrivate: false,
  OnlyAdmin: false,
};
