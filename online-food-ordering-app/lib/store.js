'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function validStore(data) {
  if (!data || !Array.isArray(data.users) || !Array.isArray(data.orders)) return false;
  const users = new Set();
  const emails = new Set();
  for (const user of data.users) {
    if (!user || typeof user.id !== 'string' || !user.id || typeof user.email !== 'string' || !user.email
      || typeof user.passwordHash !== 'string' || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(user.passwordHash)
      || users.has(user.id) || emails.has(user.email)) return false;
    users.add(user.id); emails.add(user.email);
  }
  const orders = new Set();
  const requests = new Set();
  for (const order of data.orders) {
    if (!order || typeof order.id !== 'string' || !order.id || orders.has(order.id)
      || !users.has(order.userId) || typeof order.requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(order.requestId)
      || requests.has(`${order.userId}:${order.requestId}`) || order.status !== 'demo-confirmed'
      || typeof order.createdAt !== 'string' || !Number.isFinite(Date.parse(order.createdAt))
      || !Array.isArray(order.items) || order.items.length < 1 || order.items.length > 100) return false;
    const items = new Set();
    for (const item of order.items) {
      if (!item || typeof item.id !== 'string' || !/^\d{1,8}$/.test(item.id) || items.has(item.id)
        || typeof item.name !== 'string' || !item.name || !Number.isSafeInteger(item.priceCents) || item.priceCents < 1
        || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return false;
      items.add(item.id);
    }
    const total = order.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    const fingerprint = JSON.stringify(order.items.map(item => ({ id: item.id, quantity: item.quantity })).sort((a,b) => a.id.localeCompare(b.id)));
    if (!Number.isSafeInteger(total) || order.totalCents !== total || order.fingerprint !== fingerprint) return false;
    orders.add(order.id); requests.add(`${order.userId}:${order.requestId}`);
  }
  return true;
}

function createStore(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filename = path.join(directory, 'store.json');
  if (!fs.existsSync(filename)) write({ users: [], orders: [] });

  function read() {
    try {
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (!validStore(data)) {
        throw new Error('Invalid storage schema');
      }
      return data;
    } catch (cause) {
      const error = new Error('Account storage is unavailable. Try again later.');
      error.status = 503;
      error.cause = cause;
      throw error;
    }
  }

  function write(data) {
    const temporary = `${filename}.${randomUUID()}.tmp`;
    let descriptor;
    try {
      if (!validStore(data)) throw new Error('Invalid storage schema');
      descriptor = fs.openSync(temporary, 'wx', 0o600);
      fs.writeFileSync(descriptor, JSON.stringify(data, null, 2) + '\n');
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = undefined;
      fs.renameSync(temporary, filename);
    } catch (cause) {
      if (descriptor !== undefined) fs.closeSync(descriptor);
      try { fs.unlinkSync(temporary); } catch { /* preserve the original on failure */ }
      const error = new Error('Account storage could not be updated. Try again later.');
      error.status = 503;
      error.cause = cause;
      throw error;
    }
  }
  return { read, write };
}

module.exports = { createStore };
