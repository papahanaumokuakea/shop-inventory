// Quick end-to-end check: anonymous sign-in, write, increment, read, delete.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, increment } from 'firebase/firestore';
import { readFileSync } from 'fs';
const html = readFileSync('web/index.html', 'utf8');
const cfg = JSON.parse(html.match(/const FIREBASE = (\{.*?\});/)[1]);
const app = initializeApp(cfg);
const step = async (name, fn) => { try { const r = await fn(); console.log('OK  ', name); return r; } catch (e) { console.log('FAIL', name, '->', e.code || e.message); process.exit(1); } };
await step('anonymous sign-in', () => signInAnonymously(getAuth(app)));
const db = getFirestore(app), key = 'check' + Math.random().toString(36).slice(2).padEnd(20, 'x');
const ref = doc(db, 'shops', key, 'items', 'test');
await step('write item', () => setDoc(ref, { name: 'test', qty: 3 }));
await step('sell 2 (increment -2)', () => setDoc(ref, { qty: increment(-2) }, { merge: true }));
const snap = await step('read back', () => getDoc(ref));
console.log(snap.data().qty === 1 ? 'OK   qty is 1 as expected' : 'FAIL qty is ' + snap.data().qty);
await step('blocked short shop key (rules)', async () => { try { await setDoc(doc(db, 'shops', 'short', 'items', 'x'), { a: 1 }); throw new Error('rules did NOT block a short key'); } catch (e) { if (e.code !== 'permission-denied') throw e; } });
await step('clean up', () => deleteDoc(ref));
console.log('ALL GOOD'); process.exit(0);
