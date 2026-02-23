/*
╔══════════════════════════════════════════════╗
║    🤖 RESBOT TELEGRAM - User Management      ║
╠══════════════════════════════════════════════╣
║ Mengelola data pengguna: registrasi, limit,  ║
║ premium, owner, dan penyimpanan data.        ║
╚══════════════════════════════════════════════╝
*/

import config from '../config.js';
import { promises as fsp } from 'fs';

const usersJson = './database/users.json';
const ownerJson = './database/owner.json';

let savingQueueUsers = Promise.resolve();
let savingQueueOwners = Promise.resolve();

const AUTOSAVE = 5; // Simpan setiap 5 detik
const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

let db = {};
let dbOwner = [];

// ──────────────────────────────────────────────
// 📁 File Operations
// ──────────────────────────────────────────────

async function fileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadUsers() {
  try {
    if (!(await fileExists(usersJson))) {
      await fsp.writeFile(usersJson, JSON.stringify({}, null, 2), 'utf8');
    }
    const data = await fsp.readFile(usersJson, 'utf8');
    db = JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading users file:', error);
    db = {};
  }
}

async function loadOwners() {
  try {
    if (!(await fileExists(ownerJson))) {
      await fsp.writeFile(ownerJson, JSON.stringify([], null, 2), 'utf8');
    }
    const data = await fsp.readFile(ownerJson, 'utf8');
    dbOwner = JSON.parse(data);
    if (!Array.isArray(dbOwner)) {
      throw new Error('Format owner.json tidak sesuai (harus berupa array).');
    }
  } catch (error) {
    console.error('❌ Error loading owner file:', error);
    dbOwner = [];
  }
}

async function saveUsers() {
  savingQueueUsers = savingQueueUsers.then(async () => {
    try {
      await fsp.writeFile(usersJson, JSON.stringify(db, null, 2), 'utf8');
    } catch (error) {
      console.error('❌ Error saving users file:', error);
    }
  });
}

async function saveOwners() {
  savingQueueOwners = savingQueueOwners.then(async () => {
    try {
      await fsp.writeFile(ownerJson, JSON.stringify(dbOwner, null, 2), 'utf8');
    } catch (error) {
      console.error('❌ Error saving owners file:', error);
    }
  });
}

// ──────────────────────────────────────────────
// 👤 User CRUD
// ──────────────────────────────────────────────

function generateUUID() {
  return (
    'xxxxxxxxyxxxxyxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }) + Date.now().toString(16)
  );
}

async function readUsers() {
  return db;
}

/**
 * Menambahkan user baru
 * @param {string|number} telegramId - Telegram User ID
 * @param {object} userData - Data user
 */
function addUser(telegramId, userData) {
  const id = String(telegramId);
  if (db[id]) return false;

  db[id] = {
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return true;
}

/**
 * Cek apakah user sudah terdaftar
 * @param {string|number} telegramId - Telegram User ID
 */
function isUserRegistered(telegramId) {
  return !!db[String(telegramId)];
}

/**
 * Registrasi user baru
 * @param {string|number} telegramId - Telegram User ID
 * @param {string} username - Username yang dipilih
 * @param {object} extraData - Data tambahan (first_name, etc)
 */
function registerUser(telegramId, username, extraData = {}) {
  const id = String(telegramId);
  const uname = username.toLowerCase();

  // Cek apakah sudah terdaftar
  if (db[id]) return 'registered';

  // Cek apakah username sudah dipakai
  const usernameExists = Object.values(db).some((u) => u.username === uname);
  if (usernameExists) return 'taken';

  db[id] = {
    username: uname,
    telegramId: telegramId,
    firstName: extraData.firstName || '',
    money: 0,
    limit: 0,
    level: 1,
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return id;
}

/**
 * Mencari user berdasarkan Telegram ID atau username
 * @param {string|number} identifier - Telegram User ID atau username
 */
function findUser(identifier) {
  if (!identifier) return null;

  const id = String(identifier);

  // Cari langsung berdasarkan key (Telegram ID)
  if (db[id]) return [id, db[id]];

  // Cari berdasarkan username
  const entry = Object.entries(db).find(
    ([_, user]) => user.username === id.toLowerCase(),
  );
  return entry || null;
}

function findUserByUsername(username) {
  const uname = username.toLowerCase();
  return Object.entries(db).find(([_, user]) => user.username === uname) || null;
}

function updateUser(identifier, updateData) {
  const result = findUser(identifier);
  if (!result) return false;

  const [docId, oldData] = result;

  if (updateData.money !== undefined) {
    updateData.money = Math.max(0, updateData.money);
  }
  if (updateData.limit !== undefined) {
    updateData.limit = Math.max(0, updateData.limit);
  }

  db[docId] = {
    ...oldData,
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  return true;
}

function deleteUser(identifier) {
  const id = String(identifier);
  if (!db[id]) return false;
  delete db[id];
  return true;
}

// ──────────────────────────────────────────────
// 💎 Premium & Status
// ──────────────────────────────────────────────

function isPremiumUser(telegramId) {
  const userData = findUser(telegramId);
  if (!userData) return false;

  const [_, user] = userData;
  const premiumDate = new Date(user.premium);
  return !isNaN(premiumDate) && premiumDate > new Date();
}

function getInactiveUsers() {
  const sevenDaysAgo = Date.now() - 7 * MS_IN_A_DAY;
  return Object.entries(db)
    .filter(([_, userData]) => {
      if (!userData.updatedAt) return false;
      return new Date(userData.updatedAt).getTime() < sevenDaysAgo;
    })
    .map(([id, userData]) => ({ id, updatedAt: userData.updatedAt }));
}

function getActiveUsers(days = 7) {
  const threshold = Date.now() - days * MS_IN_A_DAY;
  return Object.entries(db)
    .filter(([_, userData]) => {
      if (!userData.updatedAt) return false;
      return new Date(userData.updatedAt).getTime() >= threshold;
    })
    .map(([id, userData]) => ({ id, updatedAt: userData.updatedAt }));
}

// ──────────────────────────────────────────────
// 🔐 Owner Management
// ──────────────────────────────────────────────

/**
 * Cek apakah user adalah owner
 * @param {string|number} telegramId - Telegram User ID
 */
function isOwner(telegramId) {
  const id = String(telegramId);
  const configOwners = (config.owner_ids || []).map(String);
  const dynamicOwners = dbOwner.map(String);
  return configOwners.includes(id) || dynamicOwners.includes(id);
}

function listOwner() {
  const configOwners = (config.owner_ids || []).map(String);
  return [...new Set([...configOwners, ...dbOwner.map(String)])];
}

function addOwner(telegramId) {
  const id = String(telegramId);
  if (!dbOwner.includes(id)) {
    dbOwner.push(id);
    return true;
  }
  return false;
}

function delOwner(telegramId) {
  const id = String(telegramId);
  const index = dbOwner.indexOf(id);
  if (index !== -1) {
    dbOwner.splice(index, 1);
    return true;
  }
  return false;
}

// ──────────────────────────────────────────────
// 🔄 Reset Functions
// ──────────────────────────────────────────────

async function resetMoney() {
  for (const userId in db) {
    if (db.hasOwnProperty(userId)) {
      db[userId].money = 0;
      db[userId].updatedAt = new Date().toISOString();
    }
  }
}

async function resetLimit() {
  for (const userId in db) {
    if (db.hasOwnProperty(userId)) {
      db[userId].limit = 0;
      db[userId].updatedAt = new Date().toISOString();
    }
  }
}

async function resetLevel() {
  for (const userId in db) {
    if (db.hasOwnProperty(userId)) {
      db[userId].level = 0;
      db[userId].updatedAt = new Date().toISOString();
    }
  }
}

async function resetUsers() {
  db = {};
  await saveUsers();
}

async function resetOwners() {
  dbOwner = [];
  await saveOwners();
}

function resetMemberOld() {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let deletedCount = 0;

  for (const userId in db) {
    if (!db.hasOwnProperty(userId)) continue;
    const user = db[userId];
    const lastUpdate = new Date(user.updatedAt).getTime();
    if (now - lastUpdate > THIRTY_DAYS_MS) {
      delete db[userId];
      deletedCount++;
    }
  }
  return deletedCount;
}

// ──────────────────────────────────────────────
// ⏰ Auto-save & Init
// ──────────────────────────────────────────────

setInterval(saveUsers, AUTOSAVE * 1000);
setInterval(saveOwners, AUTOSAVE * 1000);

// Load data pertama kali
loadUsers();
loadOwners();

// ──────────────────────────────────────────────
// 📤 Exports
// ──────────────────────────────────────────────

export {
  readUsers,
  addUser,
  updateUser,
  deleteUser,
  findUser,
  findUserByUsername,
  getInactiveUsers,
  getActiveUsers,
  isPremiumUser,
  isOwner,
  listOwner,
  addOwner,
  delOwner,
  saveUsers,
  saveOwners,
  resetUsers,
  resetOwners,
  resetMoney,
  resetLimit,
  resetLevel,
  resetMemberOld,
  registerUser,
  isUserRegistered,
  db,
  dbOwner,
};
