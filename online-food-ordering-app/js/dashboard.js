'use strict';
const state = { cart: [], menu: new Map(), cartInView: false, totalCents: 0, pending: false, pendingOrder: null, userId: null, recoveryError: false, authInvalid: false };
const elements = {};
const recoveryKey = () => `food.pendingCheckout.${state.userId}`;
const fingerprint = items => JSON.stringify(items.map(({ id, quantity }) => ({ id, quantity })).sort((a, b) => a.id.localeCompare(b.id)));
function dashboardApi(url, options = {}) {
  return window.foodApi(url, { ...options, expectedAccountId: state.userId });
}

function freezeSnapshot(value) {
  return Object.freeze({ version: 1, requestId: value.requestId,
    items: Object.freeze(value.items.map(item => Object.freeze({ id: item.id, quantity: item.quantity }))),
    cart: Object.freeze(value.cart.map(item => Object.freeze({ id: item.id, quantity: item.quantity, name: item.name, priceCents: item.priceCents }))) });
}
function readSnapshot(text) {
  const value = JSON.parse(text);
  if (!value || value.version !== 1 || typeof value.requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(value.requestId) || !Array.isArray(value.items) || !Array.isArray(value.cart)
      || !value.items.length || value.items.length > 100 || value.items.length !== value.cart.length
      || new Set(value.items.map(item => item?.id)).size !== value.items.length
      || value.items.some(item => !item || typeof item.id !== 'string' || !/^\d{1,8}$/.test(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)
      || value.cart.some(item => !item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 200 || !Number.isSafeInteger(item.priceCents) || item.priceCents < 0 || item.priceCents > 1000000)
      || fingerprint(value.items) !== fingerprint(value.cart)) throw new Error('Invalid checkout recovery record.');
  return freezeSnapshot(value);
}
function editsLocked() { return state.pending || Boolean(state.pendingOrder) || state.recoveryError || state.authInvalid; }
function explainLockedCart() { elements.orderStatus.textContent = 'A checkout still needs confirmation. Retry checkout before changing the cart or refreshing the menu.'; }
function restorePendingOrder() {
  try {
    const saved = sessionStorage.getItem(recoveryKey());
    if (!saved) return;
    state.pendingOrder = readSnapshot(saved);
    state.cart = state.pendingOrder.cart.map(item => ({ ...item }));
    elements.orderStatus.textContent = 'Your unconfirmed checkout was restored. Retry checkout to confirm its outcome before changing the cart.';
    setView(true);
  } catch {
    state.recoveryError = true;
    elements.orderStatus.textContent = 'Checkout recovery information is unavailable. Restore browser storage before starting another checkout.';
  }
}
function savePendingOrder(snapshot) {
  // Save before POST: a reload, expired session, or lost response must retain the same operation.
  sessionStorage.setItem(recoveryKey(), JSON.stringify(snapshot));
  state.pendingOrder = snapshot;
}
function clearPendingOrder() {
  // A failure to remove a resolved record is safe: restoration checks saved orders first.
  try { sessionStorage.removeItem(recoveryKey()); } catch { /* retain a harmless resolved record */ }
  state.pendingOrder = null;
}
function confirmOrder(order) {
  const receipt = order.items.map(item => `${item.name} \u00d7 ${item.quantity}: ${money(item.priceCents * item.quantity)}`).join('\n');
  elements.orderStatus.textContent = `Demo order confirmed (${order.id}).\n${receipt}\nDemo total: ${money(order.totalCents)}. No payment was processed.`;
  clearPendingOrder(); state.cart = [];
}
async function reconcilePendingOrder() {
  if (!state.pendingOrder) return;
  const snapshot = state.pendingOrder;
  try {
    const { orders } = await dashboardApi('/api/orders');
    if (state.pendingOrder?.requestId !== snapshot.requestId) return; // Ignore a lookup overtaken by a successful retry.
    if (!Array.isArray(orders)) throw new Error('Unable to check the saved order. Retry checkout.');
    const order = orders.find(item => item.requestId === snapshot.requestId);
    if (!order) return; // Absence is not proof that an earlier request cannot still complete.
    if (fingerprint(order.items) !== fingerprint(snapshot.items)) {
      state.recoveryError = true;
      elements.orderStatus.textContent = 'Checkout recovery details conflict with a saved order. The cart is locked to prevent an unintended order.';
      return;
    }
    confirmOrder(order);
  } catch (error) { if (error.code === 'ACCOUNT_CHANGED' || state.pendingOrder?.requestId === snapshot.requestId) handleError(error); }
}

document.addEventListener('DOMContentLoaded', async () => {
  for (const id of ['emailDisplay', 'itemsInCart', 'menuDisplay', 'cartDisplay', 'cartItem', 'menuButton', 'cartButton', 'checkoutButton', 'signOutButton', 'orderStatus']) elements[id] = document.getElementById(id);
  const refresh = document.createElement('button');
  refresh.id = 'refreshMenuButton'; refresh.type = 'button'; refresh.className = elements.menuButton.className; refresh.textContent = 'Refresh menu';
  elements.menuButton.insertAdjacentElement('afterend', refresh); elements.refreshMenuButton = refresh;
  elements.menuButton.addEventListener('click', () => setView(false));
  elements.cartButton.addEventListener('click', () => setView(true));
  refresh.addEventListener('click', () => { if (editsLocked()) explainLockedCart(); else loadMenu(true); });
  elements.checkoutButton.addEventListener('click', checkOut);
  elements.signOutButton.addEventListener('click', signOut);
  elements.menuDisplay.addEventListener('click', event => {
    const button = event.target.closest('button[data-item-id]');
    if (button) addItem(button.dataset.itemId);
    if (event.target.closest('[data-retry-menu]')) loadMenu(!state.pendingOrder);
  });
  elements.cartItem.addEventListener('click', event => {
    const button = event.target.closest('button[data-quantity-change]');
    if (button) changeQty(button.dataset.itemId, Number(button.dataset.quantityChange));
  });
  try {
    const { user } = await window.foodApi('/api/session');
    state.userId = user.id; elements.emailDisplay.textContent = user.email;
    setView(false); restorePendingOrder(); await reconcilePendingOrder();
    if (state.authInvalid) return;
    refreshCart(); await loadMenu(!state.pendingOrder && !state.recoveryError);
  } catch (error) { handleError(error); }
});

function handleError(error) {
  if (error.status === 401 || error.code === 'ACCOUNT_CHANGED') { state.authInvalid = true; window.location.href = 'signin.html'; return; }
  elements.orderStatus.textContent = error.message;
}
function setView(cart) {
  state.cartInView = cart;
  elements.menuDisplay.hidden = cart;
  elements.cartDisplay.hidden = !cart;
  elements.menuButton.setAttribute('aria-pressed', String(!cart));
  elements.cartButton.setAttribute('aria-pressed', String(cart));
}
async function signOut() {
  if (state.pending) return;
  elements.signOutButton.disabled = true;
  try { await dashboardApi('/api/logout', { method: 'POST', body: {} }); window.location.href = 'signin.html'; }
  catch (error) { handleError(error); elements.signOutButton.disabled = false; }
}
function money(cents) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100); }
function message(text, retry = false) {
  elements.menuDisplay.replaceChildren();
  const node = document.createElement('p'); node.className = 'menu-message'; node.textContent = text;
  if (retry) { const button = document.createElement('button'); button.type = 'button'; button.dataset.retryMenu = ''; button.className = 'retry-button'; button.textContent = 'Retry'; node.appendChild(button); }
  elements.menuDisplay.appendChild(node);
}
let menuLoadSequence = 0;
async function loadMenu(reconcileCart = false) {
  const sequence = ++menuLoadSequence;
  message('Loading menu items\u2026');
  try {
    const { meals } = await dashboardApi('/api/menu');
    if (sequence !== menuLoadSequence) return;
    state.menu = new Map(meals.map(item => [item.id, item]));
    if (reconcileCart && !state.pendingOrder && !state.recoveryError && !state.pending) {
      const removed = state.cart.filter(item => !state.menu.has(item.id)).length;
      state.cart = state.cart.filter(item => state.menu.has(item.id)).map(item => ({ ...state.menu.get(item.id), quantity: item.quantity }));
      if (removed) elements.orderStatus.textContent = 'The menu changed. Unavailable items were removed from your cart; review the updated cart before checkout.';
      refreshCart();
    }
    elements.menuDisplay.replaceChildren();
    if (!meals.length) { message('No menu items are available right now. Please retry later.', true); return; }
    const fragment = document.createDocumentFragment();
    for (const item of meals) {
      const card = document.createElement('article');
      card.className = "bg-[url('/images/marbleBG.png')] bg-cover p-4 rounded-4xl shadow-md flex flex-col items-center h-full meal-card";
      if (item.image) { const image = document.createElement('img'); image.src = item.image; image.alt = item.name; image.loading = 'lazy'; image.className = 'object-cover w-full h-48 rounded-lg'; card.appendChild(image); }
      const title = document.createElement('h3'); title.className = 'text-xl text-orange-100 font-semibold text-center my-3'; title.textContent = item.name;
      const price = document.createElement('p'); price.className = 'text-white text-center mb-3'; price.textContent = `Demo price: ${money(item.priceCents)}`;
      const button = document.createElement('button'); button.type = 'button'; button.dataset.itemId = item.id; button.className = 'bg-purple-200 text-green-950 p-3 font-bold rounded-2xl hover:bg-purple-300 w-full mt-auto'; button.textContent = 'Add to cart'; button.disabled = editsLocked();
      card.append(title, price, button); fragment.appendChild(card);
    }
    elements.menuDisplay.appendChild(fragment);
  } catch (error) { if (sequence !== menuLoadSequence) return; if (error.status === 401 || error.code === 'ACCOUNT_CHANGED') handleError(error); else message('Unable to load the menu right now.', true); }
}
function addItem(id) {
  if (editsLocked()) { explainLockedCart(); return; }
  const meal = state.menu.get(id); if (!meal) return;
  const existing = state.cart.find(item => item.id === id);
  if (existing?.quantity >= 99) { elements.orderStatus.textContent = 'Maximum quantity is 99 per item.'; return; }
  if (!existing && state.cart.length >= 100) { elements.orderStatus.textContent = 'A cart can contain at most 100 different items.'; return; }
  if (existing) existing.quantity++; else state.cart.push({ ...meal, quantity: 1 });
  refreshCart(); elements.orderStatus.textContent = `${meal.name} added to cart.`;
}
function changeQty(id, change) {
  if (editsLocked()) { explainLockedCart(); return; }
  if (![-1, 1].includes(change)) return;
  const item = state.cart.find(entry => entry.id === id); if (!item) return;
  item.quantity = Math.min(99, item.quantity + change);
  state.cart = state.cart.filter(entry => entry.quantity > 0); refreshCart();
}
function refreshCart() {
  state.totalCents = state.cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  elements.itemsInCart.textContent = `Items in cart: ${state.cart.reduce((sum, item) => sum + item.quantity, 0)}`;
  if (elements.refreshMenuButton) elements.refreshMenuButton.disabled = editsLocked();
  for (const button of elements.menuDisplay.querySelectorAll('button[data-item-id]')) button.disabled = editsLocked();
  elements.cartItem.replaceChildren();
  if (!state.cart.length) { const empty = document.createElement('p'); empty.className = 'cart-message'; empty.textContent = 'Your cart is empty. Add something from the menu.'; elements.cartItem.appendChild(empty); return; }
  for (const item of state.cart) {
    const card = document.createElement('article'); card.className = 'bg-black rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4';
    const title = document.createElement('h3'); title.className = 'text-orange-100 text-xl'; title.textContent = `${item.name} \u2014 ${money(item.priceCents)} \u00d7 ${item.quantity}`;
    const controls = document.createElement('div'); controls.className = 'flex gap-3';
    for (const [change, text] of [[-1, '\u2212'], [1, '+']]) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.itemId = item.id; button.dataset.quantityChange = String(change); button.className = 'bg-purple-200 text-black text-xl font-bold py-1 px-4 rounded-lg'; button.textContent = text; button.setAttribute('aria-label', `${change > 0 ? 'Increase' : 'Decrease'} quantity of ${item.name}`); button.disabled = editsLocked(); controls.appendChild(button);
    }
    card.append(title, controls); elements.cartItem.appendChild(card);
  }
  const total = document.createElement('p'); total.className = 'text-2xl font-bold text-white text-center py-4'; total.textContent = `Demo total: ${money(state.totalCents)}`; elements.cartItem.appendChild(total);
}
async function checkOut() {
  if (state.pending || state.recoveryError || state.authInvalid) return;
  if (!state.userId) { elements.orderStatus.textContent = 'Please wait while your account loads.'; return; }
  if (!state.cartInView) { setView(true); return; }
  if (!state.cart.length && !state.pendingOrder) { elements.orderStatus.textContent = 'Your cart is empty.'; return; }
  if (!state.pendingOrder) {
    try { savePendingOrder(freezeSnapshot({ requestId: crypto.randomUUID(), items: state.cart, cart: state.cart })); }
    catch { elements.orderStatus.textContent = 'Unable to save checkout recovery information. Enable browser storage and retry; no order was submitted.'; return; }
  }
  state.pending = true; elements.checkoutButton.disabled = true; elements.signOutButton.disabled = true; refreshCart();
  let rejected = false;
  try {
    const snapshot = state.pendingOrder;
    const { order } = await dashboardApi('/api/orders', { method: 'POST', body: { requestId: snapshot.requestId, items: snapshot.items } });
    if (!order || order.requestId !== snapshot.requestId || fingerprint(order.items) !== fingerprint(snapshot.items)) throw new Error('Unable to verify the checkout response. Retry checkout to confirm its outcome.');
    confirmOrder(order);
  } catch (error) {
    // Authentication and transport/server errors do not resolve a previous uncertain request.
    if ([400, 404, 413, 415, 422].includes(error.status)) { clearPendingOrder(); rejected = true; }
    handleError(error);
    if (state.pendingOrder && error.status !== 401 && error.code !== 'ACCOUNT_CHANGED') elements.orderStatus.textContent += ' Your cart is saved and locked. Retry checkout to confirm this same order.';
  } finally {
    state.pending = false; elements.checkoutButton.disabled = false; elements.signOutButton.disabled = false; refreshCart();
  }
  if (rejected) await loadMenu(true);
}
