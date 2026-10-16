const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const { createApp, cleanMenu } = require('../server');

const rawMenu = { meals: [
  { idMeal: '100', strMeal: 'First meal', strMealThumb: 'https://www.themealdb.com/images/media/meals/demo.jpg' },
  { idMeal: '101', strMeal: 'Second meal', strMealThumb: 'https://www.themealdb.com/images/media/meals/another.jpg' },
] };
async function setup(t, options = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'food-api-test-'));
  const app = createApp({ dataDir, secureCookies: false, menuProvider: async () => rawMenu, ...options });
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    assert.equal(path.dirname(dataDir), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dataDir).startsWith('food-api-test-'));
    fs.rmSync(dataDir, { recursive: true, force: true });
  });
  async function request(route, { method = 'GET', body, cookie, origin = base, headers = {} } = {}) {
    const res = await fetch(base + route, { method, redirect: 'manual', headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), Origin: origin, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = null; }
    return { status: res.status, data, text, headers: res.headers, cookie: res.headers.get('set-cookie')?.split(';')[0] };
  }
  async function signup(email = 'person@example.test', password = 'Password with spaces!') {
    assert.equal((await request('/api/register', { method: 'POST', body: { email, password } })).status, 201);
    const result = await request('/api/login', { method: 'POST', body: { email, password } });
    assert.equal(result.status, 200); assert.ok(result.cookie); return result;
  }
  return { request, signup, dataDir };
}

test('accounts normalize email, preserve password spaces, hash credentials and enforce cookie sessions', async t => {
  const { request, signup, dataDir } = await setup(t);
  const session = await signup(' Person+tag@Example.Test ', ' A long password! ');
  assert.equal(session.data.user.email, 'person+tag@example.test');
  assert.match(session.headers.get('set-cookie'), /HttpOnly/);
  assert.match(session.headers.get('set-cookie'), /SameSite=Strict/);
  const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'store.json'))).users[0];
  assert.match(stored.passwordHash, /^scrypt:/); assert.ok(!('password' in stored));
  assert.ok(!JSON.stringify(stored).includes(' A long password! '));
  assert.equal((await request('/api/login', { method:'POST',body:{email:'person+tag@example.test',password:'A long password!'} })).status,401);
  const me = await request('/api/session', {cookie:session.cookie});
  assert.equal(me.status,200); assert.ok(!('passwordHash' in me.data.user));
  assert.equal((await request('/api/session', {cookie:'food_session=forged'})).status,401);
  assert.equal((await request('/dashboard.html')).status,302);
  assert.equal((await request('/dashboard.html',{cookie:session.cookie})).status,200);
});

test('duplicate and parallel signup cannot create case-variant duplicate identities', async t => {
  const { request, dataDir } = await setup(t);
  const body={email:'duplicate@example.test',password:'Password2026!'};
  const results=await Promise.all([request('/api/register',{method:'POST',body}),request('/api/register',{method:'POST',body:{...body,email:'DUPLICATE@example.test'}})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir,'store.json'))).users.length,1);
});

test('invalid credentials and cross-site or non-JSON mutations are rejected', async t => {
  const { request } = await setup(t);
  for (const body of [{email:'bad',password:'Password2026!'},{email:'ok@example.test',password:12345678},{email:'ok@example.test',password:'short'},null]) {
    assert.equal((await request('/api/register',{method:'POST',body})).status,400);
  }
  assert.equal((await request('/api/register',{method:'POST',origin:'https://other.example',body:{email:'ok@example.test',password:'Password2026!'}})).status,403);
  assert.equal((await request('/api/register',{method:'POST',headers:{'Content-Type':'text/plain'},body:{}})).status,415);
});

test('orders use server prices and authenticated ownership and are isolated between users', async t => {
  const { request, signup } = await setup(t);
  const first=await signup('first@example.test'); const second=await signup('second@example.test');
  assert.equal((await request('/api/menu')).status,401);
  const ordered=await request('/api/orders',{method:'POST',cookie:first.cookie,body:{requestId:randomUUID(),userId:second.data.user.id,totalCents:-1,items:[{id:'100',quantity:2,priceCents:-100}]}});
  assert.equal(ordered.status,201); assert.equal(ordered.data.order.userId,first.data.user.id); assert.equal(ordered.data.order.totalCents,1798);
  assert.deepEqual((await request('/api/orders',{cookie:second.cookie})).data.orders,[]);
  const own=await request('/api/orders',{cookie:first.cookie}); assert.equal(own.data.orders.length,1);
});

test('checkout retry and concurrent requests are idempotent, changed content conflicts', async t => {
  const { request, signup } = await setup(t); const {cookie}=await signup();
  const body={requestId:randomUUID(),items:[{id:'100',quantity:1},{id:'101',quantity:2}]};
  const results=await Promise.all([request('/api/orders',{method:'POST',cookie,body}),request('/api/orders',{method:'POST',cookie,body})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,201]);
  assert.equal(results[0].data.order.id,results[1].data.order.id);
  assert.equal((await request('/api/orders',{method:'POST',cookie,body:{...body,items:[...body.items].reverse()}})).status,200);
  assert.equal((await request('/api/orders',{method:'POST',cookie,body:{...body,items:[{id:'100',quantity:9}]}})).status,409);
  assert.equal((await request('/api/orders',{cookie})).data.orders.length,1);
});

test('invalid cart quantities, duplicates and unavailable meal IDs are rejected', async t => {
  const { request, signup }=await setup(t); const {cookie}=await signup();
  const samples=[[],[{id:'100',quantity:0}],[{id:'100',quantity:100}],[{id:'100',quantity:1.5}],[{id:'100',quantity:'2'}],[{id:'100',quantity:1},{id:'100',quantity:1}],[{id:'9999',quantity:1}]];
  for(const items of samples) assert.equal((await request('/api/orders',{method:'POST',cookie,body:{requestId:randomUUID(),items}})).status,400);
  assert.deepEqual((await request('/api/orders',{cookie})).data.orders,[]);
});

test('expiry and logout invalidate old cookies on the server', async t => {
  let clock=Date.now(); const {request,signup}=await setup(t,{now:()=>clock,sessionTtlMs:1000});
  let session=await signup(); clock+=1001;
  assert.equal((await request('/api/session',{cookie:session.cookie})).status,401);
  session=await request('/api/login',{method:'POST',body:{email:'person@example.test',password:'Password with spaces!'}});
  assert.equal((await request('/api/logout',{method:'POST',cookie:session.cookie,body:{}})).status,200);
  assert.equal((await request('/api/session',{cookie:session.cookie})).status,401);
});

test('corrupt persistence fails closed and is not replaced with an empty dataset', async t => {
  const {request,signup,dataDir}=await setup(t); const {cookie}=await signup();
  const file=path.join(dataDir,'store.json'); fs.writeFileSync(file,'{"users":');
  assert.equal((await request('/api/session',{cookie})).status,503);
  assert.equal((await request('/api/register',{method:'POST',body:{email:'other@example.test',password:'Password2026!'}})).status,503);
  assert.equal(fs.readFileSync(file,'utf8'),'{"users":');
});

test('menu responses are normalized, bounded, deduplicated and images cannot use unsafe hosts', () => {
  const meals=cleanMenu({meals:[...rawMenu.meals,rawMenu.meals[0],{idMeal:'102',strMeal:'Unsafe image',strMealThumb:'javascript:alert(1)'},{idMeal:'x',strMeal:'invalid'}]});
  assert.equal(meals.length,3); assert.equal(meals[2].image,'');
  assert.equal(meals[0].priceCents,899);
  assert.throws(()=>cleanMenu({wrong:[]}),/invalid response/);
});

test('syntactically valid but corrupt order records fail closed without being rewritten', async t => {
  const {request,signup,dataDir}=await setup(t); const {cookie}=await signup();
  const file=path.join(dataDir,'store.json'); const good=fs.readFileSync(file,'utf8');
  const broken=JSON.parse(good); broken.orders=[null];
  const bytes=JSON.stringify(broken); fs.writeFileSync(file,bytes);
  assert.equal((await request('/api/orders',{cookie})).status,503);
  assert.equal((await request('/api/register',{method:'POST',body:{email:'new@example.test',password:'Password2026!'}})).status,503);
  assert.equal(fs.readFileSync(file,'utf8'),bytes);
});

test('order storage rejects inconsistent totals, ownership and request fingerprints', async t => {
  const {request,signup,dataDir}=await setup(t); const {cookie}=await signup();
  await request('/api/orders',{method:'POST',cookie,body:{requestId:randomUUID(),items:[{id:'100',quantity:1}]}});
  const file=path.join(dataDir,'store.json'); const good=fs.readFileSync(file,'utf8');
  for (const change of [order=>{order.totalCents=1;},order=>{order.userId='missing';},order=>{order.fingerprint='forged';}]) {
    const data=JSON.parse(good); change(data.orders[0]); const bytes=JSON.stringify(data); fs.writeFileSync(file,bytes);
    assert.equal((await request('/api/orders',{cookie})).status,503);
    assert.equal(fs.readFileSync(file,'utf8'),bytes);
  }
});

test('failed menu service can be retried and does not create an order', async t => {
  let broken=true; const {request,signup}=await setup(t,{menuProvider:async()=>{if(broken)throw new Error('network failed');return rawMenu;}});
  const {cookie}=await signup();
  assert.equal((await request('/api/menu',{cookie})).status,503);
  assert.deepEqual((await request('/api/orders',{cookie})).data.orders,[]);
  broken=false; assert.equal((await request('/api/menu',{cookie})).status,200);
});

test('source code, persisted users and secrets are not served as static files', async t => {
  const {request}=await setup(t);
  for(const route of ['/server.js','/package.json','/data/store.json','/lib/store.js','/.env']) assert.equal((await request(route)).status,404);
  assert.match((await request('/signin.html')).headers.get('content-security-policy'),/script-src 'self'/);
});

test('repeated authentication attempts are limited', async t => {
  const {request}=await setup(t); let result;
  for(let i=0;i<31;i++) result=await request('/api/login',{method:'POST',body:{email:'person@example.test',password:'short'}});
  assert.equal(result.status,429); assert.equal(result.headers.get('retry-after'),'60');
});

test('expected account headers reject cross-tab reads, retries and logout without selecting an owner', async t => {
  const {request,signup,dataDir}=await setup(t);
  const first=await signup('first@example.test');
  const second=await signup('second@example.test');
  const firstHeader={'X-Food-Account-Id':first.data.user.id};
  const body={requestId:randomUUID(),items:[{id:'100',quantity:1}]};
  const original=await request('/api/orders',{method:'POST',cookie:first.cookie,headers:firstHeader,body});
  assert.equal(original.status,201);
  for(const route of ['/api/session','/api/menu','/api/orders']) {
    const result=await request(route,{cookie:second.cookie,headers:firstHeader});
    assert.equal(result.status,409);
    assert.equal(result.data.code,'ACCOUNT_CHANGED');
    assert.ok(!('orders' in result.data));
  }
  const retry=await request('/api/orders',{method:'POST',cookie:second.cookie,headers:firstHeader,body});
  assert.equal(retry.status,409);assert.equal(retry.data.code,'ACCOUNT_CHANGED');
  const logout=await request('/api/logout',{method:'POST',cookie:second.cookie,headers:firstHeader,body:{}});
  assert.equal(logout.status,409);assert.equal(logout.data.code,'ACCOUNT_CHANGED');
  assert.equal((await request('/api/session',{cookie:second.cookie})).status,200);
  const records=JSON.parse(fs.readFileSync(path.join(dataDir,'store.json'),'utf8'));
  assert.equal(records.orders.length,1);assert.equal(records.orders[0].userId,first.data.user.id);
  const secondOrder=await request('/api/orders',{method:'POST',cookie:second.cookie,headers:{'X-Food-Account-Id':second.data.user.id},body:{...body,userId:first.data.user.id,requestId:randomUUID()}});
  assert.equal(secondOrder.status,201);assert.equal(secondOrder.data.order.userId,second.data.user.id);
  assert.equal((await request('/api/orders',{headers:firstHeader})).status,401);
});
