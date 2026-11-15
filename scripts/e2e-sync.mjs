// Two "phones" (separate browsers) against the real Firebase project:
// A loads 3 test items and creates the shop, B joins by pasting the whole WhatsApp message,
// both sell, and both must agree. Cleans up its test shop at the end.
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const URL = 'http://localhost:8080/', t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const fail = m => { console.log('FAIL', m); process.exit(1); };
const items = [['T-100', 'صنف تجربة ١', 'سيف', 5, 100], ['T-200', 'صنف تجربة ٢', 'الجندي', 3, 40], ['T-300', 'صنف تجربة ٣', 'انزو', 10, 12]];
const data = { v: 2, items: items.map(([code, name, brand, qty, cost], i) => ({ id: 'it' + i + Date.now().toString(36), code, name, brand, qty, cost, markup: 25, price: Math.ceil(cost * 1.25), locked: false, archived: false, added: i })), moves: [], deliveries: [], settings: { shop: 'الطارق', markup: 25, rounding: 'smart', low: 2 } };
writeFileSync('/tmp/start.json', JSON.stringify({ app: 'shop-inventory', v: 2, at: Date.now(), data }));
const browser = await chromium.launch();
const phone = async name => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  p.on('pageerror', e => log(name, 'page error:', e.message));
  await p.goto(URL); await p.waitForTimeout(1500); return p;
};
const until = async (p, js, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await p.evaluate(js)) return true; await p.waitForTimeout(300); } return false; };
const A = await phone('A'), B = await phone('B');
await A.setInputFiles('#fileIn', '/tmp/start.json'); await A.waitForTimeout(800);
log('A items loaded:', await A.evaluate('live().length'));
await A.click('#tabs [data-v=set]'); await A.click('#sCreate'); await A.click('#mOk');
if (!await until(A, "Cloud.live && Cloud.status() === 'ok' && document.querySelector('.keybox')", 45000)) fail('A could not create/upload the shop: ' + await A.evaluate('Cloud.status() + " err=" + Cloud.err'));
const key = await A.evaluate('Cloud.key'); log('OK   A created shop, key length', key.length, '| uploaded, status', await A.evaluate('Cloud.status()'));
await B.click('#eJoin'); await B.fill('#mIn', 'مفتاح المحل (الصقه في «الانضمام لمحل مشترك»): ' + key); await B.click('#mOk');
if (!await until(B, 'Cloud.live && live().length === 3', 30000)) fail('B could not join: ' + await B.evaluate('live().length + " items, err=" + Cloud.err'));
log('OK   B joined with the pasted message and sees', await B.evaluate('live().length'), 'items');
const qty = p => p.evaluate("S.items.find(i => i.code === 'T-100').qty");
const sell = async (p, n) => { await p.click('#tabs [data-v=sell]'); await p.fill('#q', 'T-100'); await p.waitForTimeout(300); await p.click('.res >> nth=0'); for (let i = 1; i < n; i++) await p.click('#pPlus'); await p.click('#pSell'); await p.waitForTimeout(300); };
await sell(A, 2); await sell(B, 1);
if (!await until(A, "S.items.find(i => i.code === 'T-100').qty === 2", 20000) || !await until(B, "S.items.find(i => i.code === 'T-100').qty === 2", 20000))
  fail(`counts disagree: A=${await qty(A)} B=${await qty(B)} (expected 2)`);
log('OK   both phones sold the same item; both show', await qty(A), '(5 - 2 - 1)');
await B.context().setOffline(true); await sell(B, 1); log('     B sold 1 while offline; banner:', await B.evaluate("!!document.querySelector('.nag.off')"));
await B.context().setOffline(false);
if (!await until(A, "S.items.find(i => i.code === 'T-100').qty === 1", 30000)) fail('offline sale did not reach A: A=' + await qty(A));
log('OK   offline sale from B reached A after reconnecting; A shows', await qty(A));
await B.reload(); await B.waitForTimeout(2500);
if (!await until(B, "Cloud.live && live().length === 3", 20000)) fail('B did not reconnect after restart');
log('OK   B reconnected by itself after a restart');
// clean up the test shop
await A.evaluate(async () => { const F = Cloud.F, b = F.writeBatch(Cloud.db), d = (c, id) => F.doc(Cloud.db, 'shops', Cloud.key, c, id);
  S.items.forEach(i => b.delete(d('items', i.id))); S.moves.forEach(m => b.delete(d('moves', m.id))); S.deliveries.forEach(x => b.delete(d('deliveries', x.id)));
  b.delete(F.doc(Cloud.db, 'shops', Cloud.key, 'meta', 'settings')); await b.commit(); });
log('ALL GOOD'); await browser.close(); process.exit(0);
