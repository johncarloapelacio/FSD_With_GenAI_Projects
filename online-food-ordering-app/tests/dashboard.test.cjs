'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'dashboard.js'), 'utf8');
const meal = (id = '100') => ({ id, name: `Meal ${id}`, priceCents: 899, image: '' });
const plain = value => JSON.parse(JSON.stringify(value));
function makeStorage(map = new Map()) {
  return { map, getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) };
}
function fixture(options = {}) {
  const listeners = new Map();
  const created = [];
  function node(tag = 'div') {
    const value = { tagName: tag, children: [], dataset: {}, textContent: '', className: '', disabled: false, events: new Map(),
      append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); return child; },
      replaceChildren(...children) { this.children = [...children]; }, setAttribute(key, value) { this[key] = value; },
      addEventListener(event, callback) { this.events.set(event, callback); }, insertAdjacentElement(where, child) { return child; },
      querySelectorAll(selector) {
        const found = [];
        function visit(child) {
          if (selector === 'button[data-item-id]' && child.tagName === 'button' && child.dataset.itemId) found.push(child);
          for (const nested of child.children || []) visit(nested);
        }
        for (const child of this.children) visit(child);
        return found;
      }
    };
    created.push(value); return value;
  }
  const ids = ['emailDisplay', 'itemsInCart', 'menuDisplay', 'cartDisplay', 'cartItem', 'menuButton', 'cartButton', 'checkoutButton', 'signOutButton', 'orderStatus'];
  const elements = Object.fromEntries(ids.map(id => [id, node()]));
  const storage = options.storage || makeStorage();
  const user = options.user || { id: 'user-a', email: 'a@example.test' };
  let activeUser = user;
  const savedOrders = options.savedOrders || [];
  const posts = [];
  const apiCalls = [];
  let provider = options.menuProvider || (() => ({ meals: [meal()] }));
  const api = async (url, request = {}) => {
    apiCalls.push({ url, expectedAccountId: request.expectedAccountId });
    if (url === '/api/session') return { user: activeUser };
    if (request.expectedAccountId !== undefined && request.expectedAccountId !== activeUser.id) {
      const error = new Error('The signed-in account has changed.'); error.status = 409; error.code = 'ACCOUNT_CHANGED'; throw error;
    }
    if (url === '/api/menu') return provider();
    if (url === '/api/orders' && !request.method) return options.ordersProvider ? options.ordersProvider() : { orders: savedOrders };
    if (url === '/api/orders' && request.method === 'POST') {
      posts.push(plain(request.body));
      if (options.checkout) return options.checkout(request.body, { savedOrders, posts });
      let order = savedOrders.find(order => order.requestId === request.body.requestId);
      if (!order) {
        order = { id: randomUUID(), requestId: request.body.requestId, items: request.body.items.map(item => ({ ...item, name: `Meal ${item.id}`, priceCents: 899 })), totalCents: request.body.items.reduce((sum, item) => sum + item.quantity * 899, 0) };
        savedOrders.push(order);
      }
      return { order };
    }
    if (url === '/api/logout') return { ok: true };
    throw new Error(`Unexpected API call: ${url}`);
  };
  const context = vm.createContext({ Intl, console, crypto: { randomUUID }, sessionStorage: storage,
    document: { addEventListener: (name, callback) => listeners.set(name, callback), getElementById: id => elements[id], createElement: node, createDocumentFragment: () => node('fragment') },
    window: { foodApi: api, location: { href: '' } } });
  vm.runInContext(source, context);
  return { evaluate: code => vm.runInContext(code, context), async boot() { await listeners.get('DOMContentLoaded')(); },
    elements, created, storage, savedOrders, posts, apiCalls, context, setMenuProvider(value) { provider = value; }, setActiveUser(value) { activeUser = value; } };
}
function savedOrder(body) {
  return { id: randomUUID(), requestId: body.requestId, items: body.items.map(item => ({ ...item, name: `Meal ${item.id}`, priceCents: 899 })), totalCents: body.items.reduce((sum, item) => sum + item.quantity * 899, 0) };
}

test('lost checkout response locks edits and retry uses the immutable original ID and items without duplicating an order', async () => {
  const app = fixture({ checkout(body, { savedOrders, posts }) {
    let order = savedOrders.find(order => order.requestId === body.requestId);
    if (!order) { order = savedOrder(body); savedOrders.push(order); }
    if (posts.length === 1) throw new Error('Response lost after server saved the order');
    return { order };
  } });
  await app.boot();
  app.evaluate("addItem('100'); setView(true)");
  await app.evaluate('checkOut()');
  const key = 'food.pendingCheckout.user-a';
  assert.ok(app.storage.getItem(key));
  assert.equal(app.evaluate('state.pendingOrder.items[0].quantity'), 1);
  assert.throws(() => app.evaluate("'use strict'; state.pendingOrder.items[0].quantity = 9"), /read only|readonly|Cannot assign/i);
  app.evaluate("changeQty('100', 1); addItem('100')");
  assert.equal(app.evaluate('state.cart[0].quantity'), 1);
  await app.evaluate('loadMenu(true)');
  assert.equal(app.evaluate('state.cart[0].quantity'), 1);
  await app.evaluate('checkOut()');
  assert.equal(app.posts.length, 2);
  assert.deepEqual(app.posts[0], app.posts[1]);
  assert.equal(app.savedOrders.length, 1);
  assert.equal(app.evaluate('state.cart.length'), 0);
  assert.equal(app.storage.getItem(key), null);
  assert.match(app.elements.orderStatus.textContent, /Demo order confirmed/);
});

test('definite validation rejection unlocks edits, refreshes stale menu and uses a new ID only for the revised cart', async () => {
  let current = [meal()];
  const app = fixture({ menuProvider: () => ({ meals: current }), checkout(body, { posts, savedOrders }) {
    if (posts.length === 1) { current = [meal('101')]; const error = new Error('Item is no longer on the menu'); error.status = 400; throw error; }
    const order = savedOrder(body); savedOrders.push(order); return { order };
  } });
  await app.boot(); app.evaluate("addItem('100'); setView(true)");
  await app.evaluate('checkOut()');
  assert.equal(app.evaluate('state.pendingOrder'), null);
  assert.equal(app.storage.getItem('food.pendingCheckout.user-a'), null);
  assert.equal(app.evaluate('state.cart.length'), 0);
  assert.match(app.elements.orderStatus.textContent, /Unavailable items were removed/);
  app.evaluate("addItem('101')"); await app.evaluate('checkOut()');
  assert.notEqual(app.posts[0].requestId, app.posts[1].requestId);
  assert.deepEqual(app.posts[1].items, [{ id: '101', quantity: 1 }]);
  assert.equal(app.savedOrders.length, 1);
});

test('reload reconciles an already saved checkout before processing a stale or unavailable menu', async () => {
  const storage = makeStorage(); const orders = [];
  const first = fixture({ storage, savedOrders: orders, checkout(body) { orders.push(savedOrder(body)); throw new Error('Connection interrupted'); } });
  await first.boot(); first.evaluate("addItem('100'); setView(true)"); await first.evaluate('checkOut()');
  const reloaded = fixture({ storage, savedOrders: orders, menuProvider: () => ({ meals: [meal('101')] }) });
  await reloaded.boot();
  assert.equal(reloaded.posts.length, 0);
  assert.equal(orders.length, 1);
  assert.equal(reloaded.evaluate('state.pendingOrder'), null);
  assert.equal(reloaded.evaluate('state.cart.length'), 0);
  assert.equal(storage.getItem('food.pendingCheckout.user-a'), null);
  assert.match(reloaded.elements.orderStatus.textContent, /Demo order confirmed/);
});

test('unresolved reload keeps original missing-menu items locked until exact retry establishes rejection', async () => {
  const storage = makeStorage();
  const first = fixture({ storage, checkout() { throw new Error('Connection interrupted before outcome was known'); } });
  await first.boot(); first.evaluate("addItem('100'); setView(true)"); await first.evaluate('checkOut()');
  const original = plain(first.posts[0]);
  const reloaded = fixture({ storage, menuProvider: () => ({ meals: [meal('101')] }), checkout() { const error = new Error('Unavailable item'); error.status = 400; throw error; } });
  await reloaded.boot();
  assert.equal(reloaded.posts.length, 0);
  assert.equal(reloaded.evaluate('state.cart[0].id'), '100');
  assert.equal(reloaded.evaluate('state.cartInView'), true);
  reloaded.evaluate("changeQty('100',1); addItem('101')");
  assert.equal(reloaded.evaluate('state.cart.length'), 1);
  await reloaded.evaluate('checkOut()');
  assert.deepEqual(reloaded.posts[0], original);
  assert.equal(reloaded.evaluate('state.pendingOrder'), null);
  assert.equal(reloaded.evaluate('state.cart.length'), 0);
});

test('session expiry preserves the unresolved snapshot for the same authenticated account', async () => {
  const app = fixture({ checkout() { const error = new Error('Please sign in'); error.status = 401; throw error; } });
  await app.boot(); app.evaluate("addItem('100'); setView(true)"); await app.evaluate('checkOut()');
  assert.equal(app.context.window.location.href, 'signin.html');
  assert.ok(app.storage.getItem('food.pendingCheckout.user-a'));
  assert.ok(app.evaluate('state.pendingOrder'));
});

test('pending snapshots are isolated by authenticated user ID and contain no credentials', async () => {
  const storage = makeStorage();
  const first = fixture({ storage, checkout() { throw new Error('Lost response'); } });
  await first.boot(); first.evaluate("addItem('100'); setView(true)"); await first.evaluate('checkOut()');
  const saved = storage.getItem('food.pendingCheckout.user-a');
  assert.ok(!/password|token|email|cookie/i.test(saved));
  const other = fixture({ storage, user: { id: 'user-b', email: 'b@example.test' } });
  await other.boot();
  assert.equal(other.evaluate('state.pendingOrder'), null);
  assert.equal(other.evaluate('state.cart.length'), 0);
  assert.equal(storage.getItem('food.pendingCheckout.user-a'), saved);
});

test('unavailable storage prevents submitting a new order without recovery information', async () => {
  const storage = makeStorage(); storage.setItem = () => { throw new Error('Quota exceeded'); };
  const app = fixture({ storage }); await app.boot(); app.evaluate("addItem('100'); setView(true)"); await app.evaluate('checkOut()');
  assert.equal(app.posts.length, 0);
  assert.equal(app.evaluate('state.cart[0].quantity'), 1);
  assert.match(app.elements.orderStatus.textContent, /no order was submitted/);
});

test('invalid stored recovery data is preserved and blocks automatic new submissions', async () => {
  const storage = makeStorage(new Map([['food.pendingCheckout.user-a', '{"version":1,"items":[]}']]));
  const app = fixture({ storage }); await app.boot(); await app.evaluate('checkOut()');
  assert.equal(app.posts.length, 0);
  assert.equal(app.evaluate('state.recoveryError'), true);
  assert.equal(storage.getItem('food.pendingCheckout.user-a'), '{"version":1,"items":[]}');
});

test('a visible refresh control reconciles unavailable items when no checkout is uncertain', async () => {
  const app = fixture(); await app.boot(); app.evaluate("addItem('100')");
  const refresh = app.created.find(node => node.id === 'refreshMenuButton');
  assert.ok(refresh); assert.equal(refresh.textContent, 'Refresh menu'); assert.equal(refresh.disabled, false);
  app.setMenuProvider(() => ({ meals: [meal('101')] }));
  await refresh.events.get('click')();
  // The event invokes the async loader without a returned promise, as it does in the browser.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.evaluate('state.cart.length'), 0);
  assert.equal(app.evaluate("state.menu.has('101')"), true);
});

test('older menu responses cannot overwrite the latest refresh result', async () => {
  const app = fixture(); await app.boot();
  const resolvers = []; app.setMenuProvider(() => new Promise(resolve => resolvers.push(resolve)));
  const first = app.evaluate('loadMenu(true)'); const second = app.evaluate('loadMenu(true)');
  resolvers[1]({ meals: [meal('102')] }); await second;
  resolvers[0]({ meals: [meal('101')] }); await first;
  assert.equal(app.evaluate("state.menu.has('102')"), true);
  assert.equal(app.evaluate("state.menu.has('101')"), false);
});


test('a slow restoration lookup cannot overwrite a successful concurrent retry', async () => {
  const storage = makeStorage();
  const first = fixture({ storage, checkout() { throw new Error('Lost response'); } });
  await first.boot(); first.evaluate("addItem('100'); setView(true)"); await first.evaluate('checkOut()');
  let resolveLookup;
  const reloaded = fixture({ storage, ordersProvider: () => new Promise(resolve => { resolveLookup = resolve; }) });
  const boot = reloaded.boot();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(resolveLookup);
  await reloaded.evaluate('checkOut()');
  assert.match(reloaded.elements.orderStatus.textContent, /Demo order confirmed/);
  resolveLookup({ orders: reloaded.savedOrders }); await boot;
  assert.match(reloaded.elements.orderStatus.textContent, /Demo order confirmed/);
  assert.equal(reloaded.evaluate('state.pendingOrder'), null);
  assert.equal(reloaded.savedOrders.length, 1);
});

test('a cross-tab account change cannot submit or duplicate the first account\'s uncertain checkout', async () => {
  const app = fixture({ checkout(body, { savedOrders }) {
    savedOrders.push(savedOrder(body)); throw new Error('Response lost after the order was saved');
  } });
  await app.boot(); app.evaluate("addItem('100'); setView(true)"); await app.evaluate('checkOut()');
  const snapshot = app.storage.getItem('food.pendingCheckout.user-a');
  app.setActiveUser({ id: 'user-b', email: 'b@example.test' });
  await app.evaluate('checkOut()');
  assert.equal(app.context.window.location.href, 'signin.html');
  assert.equal(app.evaluate('state.authInvalid'), true);
  assert.equal(app.savedOrders.length, 1);
  assert.equal(app.posts.length, 1);
  assert.equal(app.storage.getItem('food.pendingCheckout.user-a'), snapshot);
  assert.ok(app.apiCalls.filter(call => call.url !== '/api/session').every(call => call.expectedAccountId === 'user-a'));
  await app.evaluate('checkOut()'); assert.equal(app.posts.length, 1);
});

test('a pending checkout history lookup is account-bound and preserves recovery after an account change', async () => {
  const app = fixture({ checkout() { throw new Error('Lost response'); } });
  await app.boot(); app.evaluate("addItem('100'); setView(true)"); await app.evaluate('checkOut()');
  const snapshot = app.storage.getItem('food.pendingCheckout.user-a');
  app.setActiveUser({ id: 'user-b', email: 'b@example.test' });
  await app.evaluate('reconcilePendingOrder()');
  assert.equal(app.context.window.location.href, 'signin.html');
  assert.equal(app.apiCalls.at(-1).expectedAccountId, 'user-a');
  assert.equal(app.storage.getItem('food.pendingCheckout.user-a'), snapshot);
  assert.ok(app.evaluate('state.pendingOrder'));
});

test('menu refresh and logout detect an account switch instead of acting as the replacement account', async () => {
  for (const action of ['loadMenu(true)', 'signOut()']) {
    const app = fixture(); await app.boot();
    app.setActiveUser({ id: 'user-b', email: 'b@example.test' });
    await app.evaluate(action);
    assert.equal(app.context.window.location.href, 'signin.html');
    assert.equal(app.apiCalls.at(-1).expectedAccountId, 'user-a');
    assert.equal(app.evaluate('state.authInvalid'), true);
  }
});

test('JSON transport sends account assertions as a header and preserves structured mismatch errors', async () => {
  let sent;
  const context = vm.createContext({ window: {}, fetch: async (url, settings) => {
    sent = { url, settings };
    return { ok: false, status: 409, json: async () => ({ code: 'ACCOUNT_CHANGED', error: 'Please sign in again.' }) };
  } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8'), context);
  await assert.rejects(context.window.foodApi('/api/orders', { method: 'POST', expectedAccountId: 'user-a', body: { requestId: 'test-request-12345', items: [] } }), error => error.status === 409 && error.code === 'ACCOUNT_CHANGED');
  assert.equal(sent.settings.headers['X-Food-Account-Id'], 'user-a');
  assert.equal(sent.settings.credentials, 'same-origin');
  assert.equal(sent.settings.headers['Content-Type'], 'application/json');
  assert.ok(!('expectedAccountId' in sent.settings));
});
