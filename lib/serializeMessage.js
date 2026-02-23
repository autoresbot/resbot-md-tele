/*
╔══════════════════════════════════════════════╗
║   🤖 RESBOT TELEGRAM - Message Serializer    ║
╠══════════════════════════════════════════════╣
║ Mengubah raw update Telegram menjadi format  ║
║ messageInfo yang konsisten untuk digunakan   ║
║ oleh handler dan plugins.                    ║
╚══════════════════════════════════════════════╝
*/

import config from '../config.js';

/**
 * Serialize update Telegram (message atau callback_query)
 * menjadi format unified messageInfo.
 *
 * @param {object} update - Raw update dari Telegram
 * @param {object} bot - Instance TelegramBot
 * @param {string} type - 'message' atau 'callback_query'
 * @returns {object|null} messageInfo yang sudah di-serialize
 */
function serializeMessage(update, bot, type = 'message') {
  try {
    let msg, chatId, sender, senderName, isGroup, isPrivate, text, messageId;
    let callbackData = null;

    if (type === 'callback_query') {
      // ─── Callback Query ─────────────────
      msg = update.message;
      chatId = msg?.chat?.id;
      sender = update.from;
      senderName = sender?.first_name || 'Unknown';
      isGroup = msg?.chat?.type === 'group' || msg?.chat?.type === 'supergroup';
      isPrivate = msg?.chat?.type === 'private';
      text = update.data || '';
      messageId = msg?.message_id;
      callbackData = update.data;
    } else {
      // ─── Regular Message ────────────────
      msg = update;
      chatId = msg.chat?.id;
      sender = msg.from;
      senderName = sender?.first_name || 'Unknown';
      isGroup = msg.chat?.type === 'group' || msg.chat?.type === 'supergroup';
      isPrivate = msg.chat?.type === 'private';
      messageId = msg.message_id;

      // Extract text dari berbagai tipe message
      text =
        msg.text ||
        msg.caption ||
        '';
    }

    if (!chatId || !sender) return null;

    // ─── Parse command dan content ──────
    let command = '';
    let prefix = '';
    let content = '';
    let fullText = text || '';

    if (type === 'callback_query' && callbackData) {
      // ─── Callback Query: parse callback_data sebagai command ──
      // Pattern: "menu_ai" → command="menu", content="ai"
      // Pattern: "allmenu" → command="allmenu", content=""
      // Pattern: "owner"  → command="owner", content=""
      prefix = '/';

      if (callbackData.includes('_')) {
        const parts = callbackData.split('_');
        command = parts[0].toLowerCase();
        content = parts.slice(1).join('_').toLowerCase();
      } else {
        command = callbackData.toLowerCase();
        content = '';
      }

      fullText = `/${command}${content ? ' ' + content : ''}`;
    } else if (text) {
      // ─── Regular Message: parse command dari text ──
      // Telegram commands biasanya dimulai dengan /
      // Juga support prefix lain yang dikonfigurasi
      const firstWord = text.trim().split(/\s+/)[0].toLowerCase();

      // Cek apakah menggunakan prefix yang valid
      const usedPrefix = config.prefix.find((p) => firstWord.startsWith(p));

      if (usedPrefix) {
        // Hapus prefix dan ambil command
        let rawCommand = firstWord.slice(usedPrefix.length);

        // Telegram menambahkan @botname di command grup, hapus
        if (rawCommand.includes('@')) {
          rawCommand = rawCommand.split('@')[0];
        }

        command = rawCommand;
        prefix = usedPrefix;
        content = text.slice(text.indexOf(' ') + 1).trim();

        // Jika command === fullText (tidak ada content), set content kosong
        if (content === text.trim() || content === firstWord) {
          content = '';
        }
      }
    }

    // ─── Deteksi tipe pesan ─────────────
    let messageType = 'text';
    if (msg.photo) messageType = 'photo';
    else if (msg.video) messageType = 'video';
    else if (msg.audio) messageType = 'audio';
    else if (msg.voice) messageType = 'voice';
    else if (msg.document) messageType = 'document';
    else if (msg.sticker) messageType = 'sticker';
    else if (msg.animation) messageType = 'animation';
    else if (msg.video_note) messageType = 'video_note';
    else if (msg.contact) messageType = 'contact';
    else if (msg.location) messageType = 'location';
    else if (msg.poll) messageType = 'poll';
    else if (callbackData) messageType = 'callback_query';

    // ─── Reply message info ─────────────
    const replyToMessage = msg.reply_to_message
      ? {
          messageId: msg.reply_to_message.message_id,
          sender: msg.reply_to_message.from,
          text: msg.reply_to_message.text || msg.reply_to_message.caption || '',
          type: getReplyType(msg.reply_to_message),
        }
      : null;

    // ─── Entities (mentions, hashtags, etc) ──
    const entities = msg.entities || msg.caption_entities || [];
    const mentions = entities
      .filter((e) => e.type === 'mention' || e.type === 'text_mention')
      .map((e) => {
        if (e.type === 'text_mention') return e.user;
        return { username: text.slice(e.offset + 1, e.offset + e.length) };
      });

    // ─── Build messageInfo ──────────────
    return {
      // Identifikasi
      id: messageId,
      chatId,
      sender,
      senderId: sender.id,
      senderName,
      pushName: senderName,
      username: sender.username || null,

      // Context
      isGroup,
      isPrivate,
      chat: msg.chat,
      chatTitle: msg.chat?.title || senderName,
      chatType: msg.chat?.type,

      // Pesan
      message: msg,
      rawUpdate: update,
      type: messageType,
      text: fullText,
      content, // Teks setelah command
      fullText, // Teks lengkap
      prefix,
      command,
      callbackData,

      // Reply & Mentions
      replyToMessage,
      mentions,
      entities,

      // Media
      photo: msg.photo || null,
      video: msg.video || null,
      audio: msg.audio || null,
      voice: msg.voice || null,
      document: msg.document || null,
      sticker: msg.sticker || null,
      animation: msg.animation || null,

      // Helper method: reply shortcut
      reply: async (text, options = {}) => {
        return bot.sendMessage(chatId, text, {
          reply_to_message_id: messageId,
          parse_mode: 'Markdown',
          ...options,
        });
      },

      // Helper method: reply dengan HTML
      replyHTML: async (text, options = {}) => {
        return bot.sendMessage(chatId, text, {
          reply_to_message_id: messageId,
          parse_mode: 'HTML',
          ...options,
        });
      },

      // Helper method: kirim foto
      replyPhoto: async (photo, caption = '', options = {}) => {
        return bot.sendPhoto(chatId, photo, {
          caption,
          reply_to_message_id: messageId,
          parse_mode: 'Markdown',
          ...options,
        });
      },

      // Helper method: kirim dokumen
      replyDocument: async (doc, caption = '', options = {}) => {
        return bot.sendDocument(chatId, doc, {
          caption,
          reply_to_message_id: messageId,
          parse_mode: 'Markdown',
          ...options,
        });
      },

      // Helper method: kirim audio
      replyAudio: async (audio, caption = '', options = {}) => {
        return bot.sendAudio(chatId, audio, {
          caption,
          reply_to_message_id: messageId,
          parse_mode: 'Markdown',
          ...options,
        });
      },

      // Helper method: kirim sticker
      replySticker: async (sticker, options = {}) => {
        return bot.sendSticker(chatId, sticker, {
          reply_to_message_id: messageId,
          ...options,
        });
      },

      // Helper method: kirim video
      replyVideo: async (video, caption = '', options = {}) => {
        return bot.sendVideo(chatId, video, {
          caption,
          reply_to_message_id: messageId,
          parse_mode: 'Markdown',
          ...options,
        });
      },

      // Helper: edit message (untuk callback query)
      editMessage: async (text, options = {}) => {
        return bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          ...options,
        });
      },
    };
  } catch (e) {
    console.error('Error serialize message:', e.message);
    return null;
  }
}

/**
 * Menentukan tipe pesan reply
 */
function getReplyType(msg) {
  if (msg.photo) return 'photo';
  if (msg.video) return 'video';
  if (msg.audio) return 'audio';
  if (msg.voice) return 'voice';
  if (msg.document) return 'document';
  if (msg.sticker) return 'sticker';
  if (msg.animation) return 'animation';
  return 'text';
}

export default serializeMessage;
