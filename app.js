'use strict';
/* =========================================================
   Win11 Web — tarayıcıda çalışan Windows 11 simülasyonu
   Bu dosyada: ayarlar, depolama katmanı (cihaz klasörü / tarayıcı),
   sanal dosya sistemi, pencere yöneticisi, görev çubuğu,
   Başlat menüsü ve yerleşik uygulamalar var.
   "Windows" işlemleri (pencereler, uygulamalar) tamamen sitede çalışır;
   oluşturulan dosyalar ise cihazdaki gerçek bir klasöre yazılır.
   ========================================================= */

// ---------- Küçük yardımcılar ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isTouch = matchMedia('(pointer: coarse)').matches;
const last = a => a[a.length - 1];
// Dosya adlarında işletim sistemlerinin kabul etmediği karakterleri temizle
const cleanName = s => String(s).replace(/[\\/:*?"<>|]/g, '').trim();
const fmtSize = n => n < 1024 ? `${n} bayt` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;

// Bir Blob'u (dosya verisini) kullanıcının cihazına indir
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// localStorage sarmalayıcısı: gizli pencerede veya engelli depolamada hata vermesin
const store = {
  get(k, d) { try { const v = localStorage.getItem('w11:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('w11:' + k, JSON.stringify(v)); } catch { /* yoksay */ } },
  del(k) { try { localStorage.removeItem('w11:' + k); } catch { /* yoksay */ } },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith('w11:')).forEach(k => localStorage.removeItem(k)); } catch { /* yoksay */ } }
};

// ---------- Ayarlar ----------
const WALLPAPERS = [
  { name: 'Mavi Çiçek', css: 'radial-gradient(ellipse 60% 50% at 50% 62%, #bfe3ff 0%, rgba(96,165,250,.6) 30%, transparent 70%), radial-gradient(ellipse at 25% 110%, #0a3d91 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #2563eb 0%, transparent 45%), linear-gradient(160deg, #081a45, #1e3a8a 50%, #0a1d50)' },
  { name: 'Gün Batımı', css: 'radial-gradient(circle at 50% 72%, #ffe29a 0%, transparent 18%), radial-gradient(ellipse at 50% 100%, #ff7e5f 0%, transparent 60%), linear-gradient(180deg, #2b1055 0%, #7b2a7a 45%, #ff6a5f 80%, #feb47b 100%)' },
  { name: 'Orman', css: 'radial-gradient(ellipse at 20% 20%, #6ee7b7 0%, transparent 40%), radial-gradient(ellipse at 80% 80%, #065f46 0%, transparent 55%), linear-gradient(135deg, #064e3b, #10b981 60%, #022c22)' },
  { name: 'Gece', css: 'radial-gradient(circle at 75% 25%, #a78bfa 0%, transparent 22%), radial-gradient(ellipse at 20% 90%, #312e81 0%, transparent 60%), linear-gradient(180deg, #020617, #1e1b4b 60%, #0f172a)' },
  { name: 'Kum', css: 'radial-gradient(ellipse at 70% 30%, #fff7ed 0%, transparent 45%), linear-gradient(160deg, #fde68a, #f59e0b 55%, #b45309)' },
  { name: 'Pembe', css: 'radial-gradient(ellipse at 30% 30%, #fbcfe8 0%, transparent 45%), radial-gradient(ellipse at 80% 90%, #7c3aed 0%, transparent 50%), linear-gradient(135deg, #f472b6, #a855f7 60%, #4c1d95)' }
];
const ACCENTS = ['#4cc2ff', '#0078d4', '#8764b8', '#e3008c', '#e81123', '#ff8c00', '#10893e', '#00b7c3'];
const settings = Object.assign(
  { theme: 'dark', wallpaper: 0, accent: '#4cc2ff', brightness: 100, user: 'Kullanıcı', nightLight: false },
  store.get('settings', {})
);

// Vurgu rengi açıksa üstündeki yazı siyah, koyuysa beyaz olsun
function textOn(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#000' : '#fff';
}
function saveSettings() { store.set('settings', settings); applySettings(); }
function applySettings() {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.style.setProperty('--accent', settings.accent);
  root.style.setProperty('--accent-text', textOn(settings.accent));
  const wp = (WALLPAPERS[settings.wallpaper] || WALLPAPERS[0]).css;
  $('#desktop').style.background = wp;
  $('#lock').style.background = wp;
  $('#dim').style.opacity = String(((100 - settings.brightness) / 100) * 0.85);
  $('#night').classList.toggle('on', settings.nightLight);
  $$('.username').forEach(e => { e.textContent = settings.user; });
}

// =========================================================
// Depolama katmanı
// Üç "arka uç" (backend) aynı arayüzü sunar: load, read, write, mkdir, remove.
//  - device: kullanıcının seçtiği konumda oluşturulan gerçek "Win11 Web" klasörü
//            (File System Access API — Chrome, Edge, Android Chrome)
//  - opfs  : tarayıcının siteye ayırdığı özel dosya alanı (iPhone/iPad dahil)
//  - idb   : OPFS yazmayı desteklemeyen eski tarayıcılar için IndexedDB
// =========================================================
const ROOT_FOLDER = 'Win11 Web';
const TEXT_EXT = /\.(txt|md|json|csv|log|js|css|html?|xml|ini|bat|cfg|ya?ml)$/i;
const IMG_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
const isText = n => TEXT_EXT.test(n);
const canPickFolder = typeof window.showDirectoryPicker === 'function';
// "Yerel Disk (C:)" gibi adlardaki ":" diskte geçersiz; benzer görünen bir karakterle sakla
const toDisk = n => n.replace(/:/g, '\uA789');
const fromDisk = n => n.replace(/\uA789/g, ':');

const dir = (children = {}) => ({ type: 'dir', children });
const file = (content = '') => ({ type: 'file', content });
const bin = (size = 0, blob = null) => ({ type: 'file', bin: true, size, blob });

// Küçük IndexedDB yardımcısı (klasör bağlantısını ve yedek depolamayı tutar)
const idb = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('w11web', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('files'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => { dbp = null; rej(r.error); };
  }));
  const tx = async (name, mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(name, mode);
      const out = fn(t.objectStore(name));
      t.oncomplete = () => res(typeof out === 'function' ? out() : out?.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  };
  return {
    get: (s, k) => tx(s, 'readonly', st => st.get(k)),
    put: (s, k, v) => tx(s, 'readwrite', st => { st.put(v, k); }),
    del: (s, k) => tx(s, 'readwrite', st => { st.delete(k); }),
    delTree: (s, k) => tx(s, 'readwrite', st => { st.delete(k); st.delete(IDBKeyRange.bound(k + '/', k + '/\uffff')); }),
    all: s => tx(s, 'readonly', st => { const ks = st.getAllKeys(), vs = st.getAll(); return () => ks.result.map((k, i) => [k, vs.result[i]]); }),
    clear: s => tx(s, 'readwrite', st => { st.clear(); })
  };
})();

// Klasör tutamacı (handle) üzerinden çalışan arka uç: hem cihaz klasörü hem OPFS
class HandleBackend {
  constructor(root, kind, label) { this.root = root; this.kind = kind; this.label = label; }
  async dirOf(path, create = false) {
    let d = this.root;
    for (const p of path) d = await d.getDirectoryHandle(toDisk(p), { create });
    return d;
  }
  async load() {
    const walk = async dh => {
      const node = dir();
      for await (const [name, h] of dh.entries()) {
        const n = fromDisk(name);
        if (h.kind === 'directory') node.children[n] = await walk(h);
        else {
          const f = await h.getFile();
          node.children[n] = isText(n) && f.size < 2e6 ? file(await f.text()) : bin(f.size);
        }
      }
      return node;
    };
    return walk(this.root);
  }
  async read(path) {
    const d = await this.dirOf(path.slice(0, -1));
    return (await d.getFileHandle(toDisk(last(path)))).getFile();
  }
  async write(path, data) {
    const d = await this.dirOf(path.slice(0, -1), true);
    const h = await d.getFileHandle(toDisk(last(path)), { create: true });
    const w = await h.createWritable();
    await w.write(data);
    await w.close();
  }
  async mkdir(path) { await this.dirOf(path, true); }
  async remove(path) {
    const d = await this.dirOf(path.slice(0, -1));
    await d.removeEntry(toDisk(last(path)), { recursive: true });
  }
  // Sadece tarayıcı alanı (OPFS) için kullanılır; cihaz klasörü asla toplu silinmez
  async clearAll() {
    const names = [];
    for await (const [name] of this.root.entries()) names.push(name);
    for (const n of names) await this.root.removeEntry(n, { recursive: true });
  }
}

class IdbBackend {
  constructor() { this.kind = 'idb'; this.label = 'Tarayıcı depolaması'; }
  key(path) { return path.join('/'); }
  async load() {
    const root = dir();
    for (const [k, v] of await idb.all('files')) {
      const parts = k.split('/');
      let n = root;
      for (const p of parts.slice(0, -1)) n = n.children[p] || (n.children[p] = dir());
      const name = last(parts);
      if (v.type === 'dir') { if (!n.children[name]) n.children[name] = dir(); }
      else n.children[name] = typeof v.data === 'string' ? file(v.data) : bin(v.data.size);
    }
    return root;
  }
  async read(path) {
    const v = await idb.get('files', this.key(path));
    if (!v) return null;
    return typeof v.data === 'string' ? new Blob([v.data], { type: 'text/plain' }) : v.data;
  }
  async write(path, data) { await idb.put('files', this.key(path), { type: 'file', data }); }
  async mkdir(path) { await idb.put('files', this.key(path), { type: 'dir' }); }
  async remove(path) { await idb.delTree('files', this.key(path)); }
  async clearAll() { await idb.clear('files'); }
}

// Hiçbir depolama çalışmazsa (ör. bazı gizli pencereler): dosyalar sadece oturum boyunca durur
class MemoryBackend {
  constructor() { this.kind = 'memory'; this.label = 'Geçici bellek'; }
  async load() { return defaultFS(); }
  async read() { return null; }
  async write() {} async mkdir() {} async remove() {} async clearAll() {}
}

async function browserBackend() {
  const pref = store.get('browserKind', null);
  if (pref !== 'idb') {
    try {
      if (navigator.storage?.getDirectory && typeof FileSystemFileHandle !== 'undefined' && 'createWritable' in FileSystemFileHandle.prototype) {
        const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(ROOT_FOLDER, { create: true });
        store.set('browserKind', 'opfs');
        return new HandleBackend(root, 'opfs', 'Tarayıcı depolaması');
      }
    } catch (e) { console.warn('OPFS kullanılamadı:', e); }
  }
  try {
    await idb.all('files');
    store.set('browserKind', 'idb');
    return new IdbBackend();
  } catch (e) { console.warn('IndexedDB kullanılamadı:', e); }
  return new MemoryBackend();
}

let backend = null, pendingHandle = null, pendingOps = 0;
let opQueue = Promise.resolve();

// Disk işlemleri sırayla yapılsın diye bir kuyruğa eklenir; arayüz beklemez
function persist(fn) {
  const b = backend;
  if (!b) return;
  pendingOps++;
  opQueue = opQueue.then(() => fn(b)).catch(err => {
    console.error(err);
    toast('Kaydetme hatası', 'Dosya kaydedilemedi: ' + (err && err.message ? err.message : err));
  }).finally(() => { pendingOps--; });
}
window.addEventListener('beforeunload', e => { if (pendingOps > 0) { e.preventDefault(); e.returnValue = ''; } });

// Bir düğümü (dosya/klasör) bir arka uçtan diğerine kopyala
async function copyTo(src, dst, node, from, to) {
  if (node.type === 'dir') {
    await dst.mkdir(to);
    for (const [n, c] of Object.entries(node.children)) await copyTo(src, dst, c, [...from, n], [...to, n]);
  } else {
    const data = node.bin ? (node.blob || (src && await src.read(from))) : node.content;
    if (data != null) await dst.write(to, data);
  }
}
async function copyTree(src, dst, root) {
  for (const [n, c] of Object.entries(root.children)) await copyTo(src, dst, c, [n], [n]);
}

function storageInfo() {
  if (!backend) return { icon: '⏳', text: 'Yükleniyor…' };
  if (backend.kind === 'device') return { icon: '💾', text: `Cihaz klasörü: ${backend.label}` };
  if (backend.kind === 'memory') return { icon: '⚠️', text: 'Geçici bellek (kaydedilmiyor)' };
  return { icon: '🌐', text: 'Bu cihazda, tarayıcı depolamasında' };
}

// ---------- Sanal dosya sistemi ----------
const BIN = 'Geri Dönüşüm Kutusu';
const BASE_FOLDERS = ['Masaüstü', 'Belgeler', 'İndirilenler', 'Resimler', 'Müzik', 'Videolar', BIN];
function defaultFS() {
  return dir({
    'Masaüstü': dir({
      'Beni oku.txt': file("Win11 Web'e hoş geldiniz! 👋\n\nBu, tarayıcıda çalışan bir Windows 11 simülasyonudur.\n\nDeneyebilecekleriniz:\n• Pencereleri başlık çubuğundan sürükleyin, ekranın üst kenarına bırakırsanız tam ekran olur.\n• Sağ alt köşeden pencereleri yeniden boyutlandırın.\n• Başlat menüsünden uygulama arayın.\n• Ayarlar'dan tema, duvar kâğıdı ve vurgu rengini değiştirin.\n• Terminal'de 'help' yazarak komutları görün.\n• Not Defteri'nde Ctrl+S ile kaydedin, Paint'te çizdiklerinizi kaydedin.\n\nDosyalarınız nerede saklanır?\nAyarlar > Depolama'da seçtiğiniz yerde: cihazınızda oluşturulan \"Win11 Web\" klasöründe ya da tarayıcının bu cihazdaki depolama alanında.\n\nBu proje eğitim amaçlıdır ve Microsoft ile bağlantılı değildir.")
    }),
    'Belgeler': dir({
      'Alışveriş listesi.txt': file('- Süt\n- Ekmek\n- Peynir\n- Domates\n- Zeytin'),
      'Projeler': dir({ 'fikirler.txt': file('1. Tarayıcıda işletim sistemi yap ✔\n2. Yeni uygulamalar ekle\n3. Arkadaşlarla paylaş') })
    }),
    'İndirilenler': dir({}),
    'Resimler': dir({}),
    'Müzik': dir({}),
    'Videolar': dir({}),
    'Yerel Disk (C:)': dir({
      'Program Files': dir({ 'Win11 Web': dir({ 'surum.txt': file('Win11 Web 1.1') }) }),
      'Windows': dir({ 'System32': dir({ 'drivers': dir({}) }), 'Fonts': dir({}) }),
      'Kullanıcılar': dir({ 'Ortak': dir({}) })
    }),
    [BIN]: dir({})
  });
}
let FS = dir();
function getNode(path) {
  let n = FS;
  for (const p of path) { if (!n || n.type !== 'dir') return null; n = n.children[p]; }
  return n || null;
}
// Aynı isim varsa "ad (2).txt" şeklinde benzersiz isim üret
function uniqueName(d, name) {
  if (!d.children[name]) return name;
  const m = name.match(/^(.*?)(\.[^.]*)?$/);
  let i = 2, n;
  do { n = `${m[1]} (${i++})${m[2] || ''}`; } while (d.children[n]);
  return n;
}
const fsize = n => n.type !== 'file' ? 0 : n.bin ? n.size : new Blob([n.content]).size;
const changed = () => document.dispatchEvent(new Event('fschange'));

// Dosya işlemleri: önce ekrandaki ağaç güncellenir, sonra diske yazılır
function fsWrite(path, data) {
  const parent = getNode(path.slice(0, -1));
  if (!parent || parent.type !== 'dir') return false;
  parent.children[last(path)] = typeof data === 'string' ? file(data) : bin(data.size, data);
  persist(b => b.write(path, data));
  changed();
  return true;
}
function fsMkdir(path, quiet) {
  const parent = getNode(path.slice(0, -1));
  if (!parent) return false;
  parent.children[last(path)] = dir();
  persist(b => b.mkdir(path));
  if (!quiet) changed();
  return true;
}
function fsRemove(path) {
  const parent = getNode(path.slice(0, -1));
  if (!parent || !parent.children[last(path)]) return;
  delete parent.children[last(path)];
  persist(b => b.remove(path));
  changed();
}
function fsMove(from, to) {
  const node = getNode(from), pFrom = getNode(from.slice(0, -1)), pTo = getNode(to.slice(0, -1));
  if (!node || !pTo) return;
  delete pFrom.children[last(from)];
  pTo.children[last(to)] = node;
  persist(async b => { await copyTo(b, b, node, from, to); await b.remove(from); });
  changed();
}
async function fsRead(path) {
  const n = getNode(path);
  if (!n || n.type !== 'file') return null;
  if (!n.bin) return new Blob([n.content], { type: 'text/plain;charset=utf-8' });
  if (n.blob) return n.blob;
  await opQueue;
  n.blob = await backend.read(path);
  return n.blob;
}
async function downloadPath(path) {
  try { const b = await fsRead(path); if (b) downloadBlob(b, last(path)); }
  catch (e) { toast('İndirilemedi', e.message || String(e)); }
}
function ensureFolders() {
  for (const f of BASE_FOLDERS) if (!FS.children[f] || FS.children[f].type !== 'dir') fsMkdir([f], true);
}

// Bir arka ucu etkinleştir ve dosyaları ondan oku
async function useBackend(b) {
  await opQueue;
  backend = b;
  FS = await b.load();
  if (!Object.keys(FS.children).length) {
    // İlk kullanım: eski sürümün localStorage verisi varsa onu, yoksa örnek dosyaları yaz
    const legacy = store.get('fs', null);
    FS = legacy && legacy.type === 'dir' ? legacy : defaultFS();
    await copyTree(null, b, FS);
    store.del('fs');
  }
  ensureFolders();
  changed();
}
async function initStorage() {
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  if (store.get('storage', null) === 'device') {
    const h = await idb.get('kv', 'dirHandle').catch(() => null);
    if (h) {
      const label = store.get('storageLabel', ROOT_FOLDER);
      const perm = await h.queryPermission({ mode: 'readwrite' }).catch(() => 'denied');
      if (perm === 'granted') return useBackend(new HandleBackend(h, 'device', label));
      // İzin yeniden istenmeli; bu yalnızca bir tıklamayla yapılabilir → "Oturum aç"ta istenir
      pendingHandle = { h, label };
      return;
    }
    store.set('storage', 'browser');
  }
  await useBackend(await browserBackend());
}
async function reloadFS() {
  if (!backend) return;
  await opQueue;
  FS = await backend.load();
  ensureFolders();
  changed();
}

// Cihazda klasör seç → içinde "Win11 Web" klasörü oluştur → dosyaları oraya taşı
async function connectDeviceFolder() {
  let picked;
  try { picked = await window.showDirectoryPicker({ id: 'win11web', mode: 'readwrite', startIn: 'documents' }); }
  catch (e) { if (e.name !== 'AbortError') toast('Klasör seçilemedi', e.message); return false; }
  try {
    const isRoot = picked.name === ROOT_FOLDER;
    const root = isRoot ? picked : await picked.getDirectoryHandle(ROOT_FOLDER, { create: true });
    const label = isRoot ? ROOT_FOLDER : `${picked.name} › ${ROOT_FOLDER}`;
    const nb = new HandleBackend(root, 'device', label);
    await opQueue;
    const existing = await nb.load();
    let useExisting = false;
    if (Object.keys(existing.children).length) {
      useExisting = await dialog({
        title: 'Klasörde dosyalar var',
        text: `"${esc(label)}" klasöründe daha önce kaydedilmiş dosyalar bulundu. Ne yapılsın?`,
        buttons: [
          { label: 'Klasördekileri kullan', value: true, primary: true },
          { label: 'Şu anki dosyalarımı da klasöre kopyala', value: false }
        ]
      });
    }
    if (!useExisting) await copyTree(backend, nb, FS);
    backend = nb;
    FS = await nb.load();
    store.set('storage', 'device');
    store.set('storageLabel', label);
    await idb.put('kv', 'dirHandle', root).catch(() => {});
    ensureFolders();
    changed();
    toast('Klasör bağlandı', `Dosyalarınız artık cihazınızdaki "${label}" klasörüne kaydediliyor.`);
    return true;
  } catch (e) {
    console.error(e);
    toast('Klasör bağlanamadı', e.message || String(e));
    return false;
  }
}
// Cihaz klasöründen tarayıcı depolamasına geç (cihazdaki dosyalar silinmez)
async function switchToBrowser() {
  await opQueue;
  const nb = await browserBackend();
  await nb.clearAll();
  await copyTree(backend, nb, FS);
  backend = nb;
  FS = await nb.load();
  store.set('storage', 'browser');
  await idb.del('kv', 'dirHandle').catch(() => {});
  ensureFolders();
  changed();
  toast('Depolama değişti', 'Dosyalarınız artık tarayıcı depolamasında. Cihazdaki klasöre dokunulmadı.');
}
// Sıfırlama: tarayıcıdaki verileri siler; bağlı cihaz klasörüne dokunmaz
async function clearBrowserData() {
  try { await (await navigator.storage.getDirectory()).removeEntry(ROOT_FOLDER, { recursive: true }); } catch { /* yoksay */ }
  try { await idb.clear('files'); await idb.clear('kv'); } catch { /* yoksay */ }
  store.clear();
}

const SPECIAL_ICONS = { 'Masaüstü': '🖥️', 'Belgeler': '📑', 'İndirilenler': '📥', 'Resimler': '🖼️', 'Müzik': '🎵', 'Videolar': '🎬', 'Yerel Disk (C:)': '💽', [BIN]: '🗑️' };
function iconFor(name, node) {
  if (!node || node.type === 'dir') return (name && SPECIAL_ICONS[name]) || '📁';
  if (IMG_EXT.test(name)) return '🖼️';
  if (!node.bin) return '📄';
  return '📦';
}
function openPath(path) {
  const n = getNode(path);
  if (!n) return;
  const name = last(path);
  if (n.type === 'dir') return openApp('explorer', { path });
  if (IMG_EXT.test(name)) return openApp('photos', { path });
  if (!n.bin) return openApp('notepad', { path });
  dialog({
    title: 'Dosya açılamıyor',
    text: `"${esc(name)}" türündeki dosyalar Win11 Web'de açılamıyor. Cihazınıza indirip başka bir uygulamayla açabilirsiniz.`,
    buttons: [{ label: '⬇️ Cihaza indir', value: true, primary: true }, { label: 'Kapat', value: false }]
  }).then(ok => { if (ok) downloadPath(path); });
}

// ---------- Uygulama kayıtları ----------
const APPS = {
  explorer: { name: 'Dosya Gezgini', icon: '📁', w: 860, h: 520, init: initExplorer },
  browser: { name: 'Web Tarayıcı', icon: '🌐', w: 960, h: 600, init: initBrowser },
  notepad: { name: 'Not Defteri', icon: '📝', w: 640, h: 440, init: initNotepad },
  calc: { name: 'Hesap Makinesi', icon: '🧮', w: 330, h: 520, init: initCalc, single: true },
  terminal: { name: 'Terminal', icon: '💻', w: 700, h: 430, init: initTerminal },
  paint: { name: 'Paint', icon: '🎨', w: 900, h: 580, init: initPaint },
  photos: { name: 'Fotoğraflar', icon: '🖼️', w: 760, h: 520, init: initPhotos, single: true },
  settings: { name: 'Ayarlar', icon: '⚙️', w: 860, h: 580, init: initSettings, single: true }
};
const PINNED = ['explorer', 'browser', 'notepad', 'calc', 'terminal', 'paint', 'photos', 'settings'];

// ---------- Bildirimler ve iletişim kutusu ----------
function toast(title, msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<b>${esc(title)}</b><span>${esc(msg)}</span>`;
  $('#toasts').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 4500);
}
// text alanı HTML kabul eder; çağıran taraf kullanıcı verisini esc() ile kaçırmalı
function dialog({ title, text, buttons }) {
  return new Promise(res => {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="dlg" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${text}</p>
      <div class="dlg-btns">${buttons.map((b, i) => `<button class="btn${b.primary ? ' accent' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div></div>`;
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b) { m.remove(); res(buttons[b.dataset.i].value); }
    });
    document.body.append(m);
    setTimeout(() => $('.btn.accent', m)?.focus(), 30);
  });
}

// =========================================================
// Pencere yöneticisi
// =========================================================
const wins = [];
let zTop = 100, winSeq = 0, activeWin = null;

function openApp(appId, arg) {
  const app = APPS[appId];
  if (!app) return null;
  closeFlyouts();
  if (app.single) {
    const ex = wins.find(w => w.app === appId);
    if (ex) { restore(ex); ex.onArg?.(arg); return ex; }
  }
  const node = document.createElement('div');
  node.className = 'window';
  node.innerHTML = `
    <div class="titlebar">
      <span class="t-icon">${app.icon}</span><span class="t-title">${esc(app.name)}</span>
      <div class="t-btns">
        <button data-act="min" title="Simge durumuna küçült">&#x2500;</button>
        <button data-act="max" title="Ekranı kapla">&#x25A2;</button>
        <button data-act="close" class="close" title="Kapat">&#x2715;</button>
      </div>
    </div>
    <div class="wbody"></div>
    <div class="resizer"></div>`;
  const areaH = innerHeight - 48;
  const W = Math.min(app.w, innerWidth - 20), H = Math.min(app.h, areaH - 20);
  const off = (wins.length % 6) * 26;
  node.style.width = W + 'px';
  node.style.height = H + 'px';
  node.style.left = Math.max(10, Math.min((innerWidth - W) / 2 - 60 + off, innerWidth - W - 10)) + 'px';
  node.style.top = Math.max(10, Math.min((areaH - H) / 2 - 40 + off, areaH - H - 10)) + 'px';

  const w = {
    id: 'w' + (++winSeq), app: appId, el: node, min: false, max: false,
    setTitle(t) { $('.t-title', node).textContent = t; w.title = t; }
  };
  w.title = app.name;
  wins.push(w);
  $('#windows').append(node);
  bindWindow(w);
  app.init(w, $('.wbody', node), arg);
  focusWin(w);
  if (innerWidth < 700) toggleMax(w, true);
  return w;
}

function bindWindow(w) {
  const node = w.el, bar = $('.titlebar', node);
  node.addEventListener('pointerdown', () => focusWin(w), true);
  $('.t-btns', node).addEventListener('click', e => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'min') minimize(w);
    else if (act === 'max') toggleMax(w);
    else if (act === 'close') closeWin(w);
  });
  bar.addEventListener('dblclick', e => { if (!e.target.closest('button')) toggleMax(w); });

  // Sürükleme
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || e.button !== 0) return;
    const r = node.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    let ox = r.left, oy = r.top, moved = false;
    bar.setPointerCapture(e.pointerId);
    document.body.classList.add('dragging');
    const move = ev => {
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 4) return;
      if (!moved && w.max) {
        // Tam ekrandayken sürüklenirse eski boyutuna dönsün, imleç başlıkta kalsın
        const ratio = (sx - r.left) / r.width;
        toggleMax(w, false);
        ox = sx - ratio * node.offsetWidth;
        oy = 0;
      }
      moved = true;
      const nx = ox + ev.clientX - sx;
      const ny = Math.max(0, Math.min(oy + ev.clientY - sy, innerHeight - 48 - 34));
      node.style.left = nx + 'px';
      node.style.top = ny + 'px';
      $('#snapHint').classList.toggle('on', ev.clientY <= 2);
    };
    const up = ev => {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('pointercancel', up);
      document.body.classList.remove('dragging');
      $('#snapHint').classList.remove('on');
      if (moved && ev.clientY <= 2) toggleMax(w, true);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
  });

  // Yeniden boyutlandırma
  const rz = $('.resizer', node);
  rz.addEventListener('pointerdown', e => {
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, sw = node.offsetWidth, sh = node.offsetHeight;
    rz.setPointerCapture(e.pointerId);
    document.body.classList.add('dragging');
    const move = ev => {
      node.style.width = Math.max(300, sw + ev.clientX - sx) + 'px';
      node.style.height = Math.max(200, sh + ev.clientY - sy) + 'px';
    };
    const up = () => {
      rz.removeEventListener('pointermove', move);
      rz.removeEventListener('pointerup', up);
      document.body.classList.remove('dragging');
    };
    rz.addEventListener('pointermove', move);
    rz.addEventListener('pointerup', up);
  });
}

function focusWin(w) {
  if (!w) { activeWin = null; wins.forEach(x => x.el.classList.remove('active')); renderTaskbar(); return; }
  if (activeWin === w && w.el.style.zIndex == zTop) return;
  w.el.style.zIndex = ++zTop;
  wins.forEach(x => x.el.classList.toggle('active', x === w));
  activeWin = w;
  renderTaskbar();
}
function topVisible() {
  return wins.filter(x => !x.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0] || null;
}
function minimize(w) {
  w.min = true;
  w.el.classList.add('min');
  if (activeWin === w) { activeWin = null; focusWin(topVisible()); }
  renderTaskbar();
}
function restore(w) {
  w.min = false;
  w.el.classList.remove('min');
  focusWin(w);
}
function toggleMax(w, val = !w.max) {
  w.max = val;
  w.el.classList.toggle('max', val);
  $('[data-act=max]', w.el).innerHTML = val ? '&#x2750;' : '&#x25A2;';
  $('[data-act=max]', w.el).title = val ? 'Önceki boyutuna getir' : 'Ekranı kapla';
}
function closeWin(w, force = false) {
  if (!force && w.beforeClose && !w.beforeClose()) return;
  w.onClose?.();
  w.el.classList.add('closing');
  setTimeout(() => w.el.remove(), 180);
  wins.splice(wins.indexOf(w), 1);
  if (activeWin === w) { activeWin = null; focusWin(topVisible()); }
  renderTaskbar();
}

// ---------- Görev çubuğu ----------
function renderTaskbar() {
  const ids = [...PINNED, ...wins.map(w => w.app).filter(a => !PINNED.includes(a))];
  $('#tbApps').innerHTML = [...new Set(ids)].map(id => {
    const running = wins.some(w => w.app === id);
    const active = activeWin && activeWin.app === id && !activeWin.min;
    return `<button class="tb-btn${running ? ' running' : ''}${active ? ' active' : ''}" data-app="${id}" title="${esc(APPS[id].name)}"><span>${APPS[id].icon}</span></button>`;
  }).join('');
}
$('#tbApps').addEventListener('click', e => {
  const id = e.target.closest('[data-app]')?.dataset.app;
  if (!id) return;
  closeFlyouts();
  const list = wins.filter(w => w.app === id);
  if (!list.length) return void openApp(id);
  if (activeWin && activeWin.app === id && !activeWin.min) {
    // Aynı uygulamanın birden fazla penceresi varsa sıradakine geç, yoksa küçült
    if (list.length > 1) { const i = list.indexOf(activeWin); restore(list[(i + 1) % list.length]); }
    else minimize(activeWin);
  } else {
    restore(list.sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]);
  }
});
$('#tbApps').addEventListener('contextmenu', e => {
  const id = e.target.closest('[data-app]')?.dataset.app;
  if (!id) return;
  e.preventDefault();
  const has = wins.some(w => w.app === id);
  showMenu(e.clientX, innerHeight - 56, [
    [`${APPS[id].icon} ${APPS[id].name}`, () => openApp(id)],
    ...(has ? [null, ['✕ Tüm pencereleri kapat', () => wins.filter(w => w.app === id).forEach(w => closeWin(w))]] : [])
  ], true);
});
$('#showDesktop').addEventListener('click', () => {
  const visible = wins.filter(w => !w.min);
  if (visible.length) visible.forEach(minimize);
  else wins.forEach(w => { w.min = false; w.el.classList.remove('min'); });
  renderTaskbar();
});

// ---------- Saat ----------
function tick() {
  const d = new Date();
  const hm = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  $('#tbTime').textContent = hm;
  $('#tbDate').textContent = d.toLocaleDateString('tr-TR');
  $('#lockTime').textContent = hm;
  $('#lockDate').textContent = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(tick, 1000);

// =========================================================
// Açılır paneller (Başlat, hızlı ayarlar, takvim, sağ tık menüsü)
// =========================================================
const FLYOUTS = ['#startmenu', '#quick', '#calendar'];
function closeFlyouts(except) {
  FLYOUTS.forEach(s => { if (s !== except) $(s).classList.add('hidden'); });
  $('#ctxmenu').classList.add('hidden');
  $('#powerMenu').classList.add('hidden');
}
function toggleFlyout(sel) {
  const el = $(sel), willOpen = el.classList.contains('hidden');
  closeFlyouts(sel);
  el.classList.toggle('hidden', !willOpen);
  return willOpen;
}
document.addEventListener('pointerdown', e => {
  if (e.target.closest('.flyout, .menu, #startBtn, #searchBtn, #trayBtn, #clockBtn')) return;
  closeFlyouts();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFlyouts(); });

// Başlat menüsü
function renderStart(q = '') {
  const s = q.trim().toLocaleLowerCase('tr');
  const ids = Object.keys(APPS).filter(id => APPS[id].name.toLocaleLowerCase('tr').includes(s));
  $('#smGrid').innerHTML = ids.length
    ? ids.map(id => `<button class="sm-app" data-app="${id}"><span class="ico">${APPS[id].icon}</span>${esc(APPS[id].name)}</button>`).join('')
    : '<div style="color:var(--muted);padding:12px">Sonuç bulunamadı.</div>';
  // Önerilenler: Masaüstü, Belgeler ve Resimler'deki dosyalar
  const recs = [];
  for (const folder of ['Masaüstü', 'Belgeler', 'Resimler']) {
    for (const [n, c] of Object.entries(getNode([folder])?.children || {})) {
      if (c.type === 'file' && n.toLocaleLowerCase('tr').includes(s)) recs.push({ path: [folder, n], n, folder, icon: iconFor(n, c) });
    }
  }
  $('#smRec').innerHTML = recs.slice(0, 6).map((r, i) =>
    `<button data-rec="${i}"><span class="ico">${r.icon}</span><span>${esc(r.n)}<small>${esc(r.folder)}</small></span></button>`).join('')
    || '<div style="color:var(--muted);padding:8px">Öneri yok.</div>';
  $('#smRec').onclick = e => { const b = e.target.closest('[data-rec]'); if (b) openPath(recs[b.dataset.rec].path); };
}
function openStart(focusSearch) {
  if (toggleFlyout('#startmenu')) {
    $('#smSearch').value = '';
    renderStart();
    if (focusSearch || !isTouch) setTimeout(() => $('#smSearch').focus(), 50);
  }
}
$('#startBtn').addEventListener('click', () => openStart(false));
$('#searchBtn').addEventListener('click', () => openStart(true));
$('#smSearch').addEventListener('input', e => renderStart(e.target.value));
$('#smSearch').addEventListener('keydown', e => {
  if (e.key === 'Enter') { const first = $('#smGrid [data-app]'); if (first) openApp(first.dataset.app); }
});
$('#smGrid').addEventListener('click', e => { const b = e.target.closest('[data-app]'); if (b) openApp(b.dataset.app); });
$('#powerBtn').addEventListener('click', () => $('#powerMenu').classList.toggle('hidden'));
$('#powerMenu').addEventListener('click', e => {
  const p = e.target.closest('[data-p]')?.dataset.p;
  if (!p) return;
  closeFlyouts();
  if (p === 'lock') showLock();
  else if (p === 'restart') shutdown(true);
  else if (p === 'off') shutdown(false);
});
$('.sm-user').addEventListener('click', () => openApp('settings', { page: 'accounts' }));

// Hızlı ayarlar
const quickState = { wifi: true, bt: true, plane: false, focus: false };
$('#trayBtn').addEventListener('click', () => {
  if (toggleFlyout('#quick')) {
    $('#qBright').value = settings.brightness;
    $('[data-q=night]').classList.toggle('on', settings.nightLight);
    $('[data-q=theme]').classList.toggle('on', settings.theme === 'light');
  }
});
$('.q-grid').addEventListener('click', e => {
  const t = e.target.closest('[data-q]');
  if (!t) return;
  const q = t.dataset.q;
  if (q === 'night') { settings.nightLight = !settings.nightLight; saveSettings(); t.classList.toggle('on', settings.nightLight); return; }
  if (q === 'theme') { settings.theme = settings.theme === 'dark' ? 'light' : 'dark'; saveSettings(); t.classList.toggle('on', settings.theme === 'light'); refreshSettingsWin(); return; }
  quickState[q] = !quickState[q];
  t.classList.toggle('on', quickState[q]);
  if (q === 'plane' && quickState.plane) {
    quickState.wifi = quickState.bt = false;
    $('[data-q=wifi]').classList.remove('on'); $('[data-q=bt]').classList.remove('on');
  }
  if (q === 'focus') toast('Odaklan', quickState.focus ? 'Odaklanma oturumu başladı. Bildirimler sessize alındı.' : 'Odaklanma oturumu bitti.');
});
$('#qBright').addEventListener('input', e => { settings.brightness = +e.target.value; saveSettings(); });
$('#qSettings').addEventListener('click', () => openApp('settings'));
if (navigator.getBattery) {
  navigator.getBattery().then(b => {
    const upd = () => { $('#qBattery').textContent = `${b.charging ? '⚡' : '🔋'} %${Math.round(b.level * 100)}`; };
    upd(); b.addEventListener('levelchange', upd); b.addEventListener('chargingchange', upd);
  }).catch(() => {});
}

// Takvim
let calMonth = new Date();
function renderCal() {
  const now = new Date(), y = calMonth.getFullYear(), m = calMonth.getMonth();
  const first = new Date(y, m, 1), start = (first.getDay() + 6) % 7; // Pazartesi ile başla
  const days = new Date(y, m + 1, 0).getDate(), prevDays = new Date(y, m, 0).getDate();
  let cells = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => `<span class="dow">${d}</span>`).join('');
  for (let i = start; i > 0; i--) cells += `<span class="other">${prevDays - i + 1}</span>`;
  for (let d = 1; d <= days; d++) {
    const today = d === now.getDate() && m === now.getMonth() && y === now.getFullYear();
    cells += `<span class="${today ? 'today' : ''}">${d}</span>`;
  }
  const rest = (7 - ((start + days) % 7)) % 7;
  for (let d = 1; d <= rest; d++) cells += `<span class="other">${d}</span>`;
  $('#calendar').innerHTML = `
    <div class="cal-today">${now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    <div class="cal-head"><b>${first.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</b>
      <span><button class="icon-btn" data-c="-1">▲</button><button class="icon-btn" data-c="1">▼</button></span></div>
    <div class="cal-grid">${cells}</div>`;
}
$('#clockBtn').addEventListener('click', () => { calMonth = new Date(); if (toggleFlyout('#calendar')) renderCal(); });
$('#calendar').addEventListener('click', e => {
  const c = e.target.closest('[data-c]');
  if (c) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +c.dataset.c, 1); renderCal(); }
});
$('#widgetBtn').addEventListener('click', () => toast('Hava durumu', 'Bugün parçalı bulutlu, 18°C. (Örnek veri)'));

// Sağ tık menüsü
function showMenu(x, y, items, fromBottom = false) {
  const m = $('#ctxmenu');
  closeFlyouts();
  m.innerHTML = items.map((it, i) => it ? `<button data-i="${i}">${esc(it[0])}</button>` : '<hr>').join('');
  m.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { m.classList.add('hidden'); items[b.dataset.i][1](); } };
  m.classList.remove('hidden');
  const r = m.getBoundingClientRect();
  m.style.left = Math.min(x, innerWidth - r.width - 6) + 'px';
  m.style.top = (fromBottom ? y - r.height : Math.min(y, innerHeight - 48 - r.height - 6)) + 'px';
}

// =========================================================
// Masaüstü simgeleri
// =========================================================
const DESKTOP_APPS = [
  { label: 'Bu Bilgisayar', icon: '🖥️', run: () => openApp('explorer', { path: [] }) },
  { label: BIN, icon: '🗑️', run: () => openApp('explorer', { path: [BIN] }) },
  ...['browser', 'notepad', 'calc', 'terminal', 'paint', 'settings'].map(id => ({ label: APPS[id].name, icon: APPS[id].icon, run: () => openApp(id) }))
];
let deskItems = [];
function renderIcons() {
  const files = Object.entries(getNode(['Masaüstü'])?.children || {}).map(([n, c]) => ({
    label: n, icon: iconFor(n, c), run: () => openPath(['Masaüstü', n]), path: ['Masaüstü', n]
  }));
  deskItems = [...DESKTOP_APPS, ...files];
  $('#icons').innerHTML = deskItems.map((d, i) =>
    `<div class="d-icon" data-i="${i}" tabindex="0"><span class="ico">${d.icon}</span><span class="lbl">${esc(d.label)}</span></div>`).join('');
}
document.addEventListener('fschange', renderIcons);
$('#icons').addEventListener('click', e => {
  const ic = e.target.closest('.d-icon');
  $$('.d-icon').forEach(x => x.classList.toggle('sel', x === ic));
  if (ic && isTouch) deskItems[ic.dataset.i].run();
});
$('#icons').addEventListener('dblclick', e => {
  const ic = e.target.closest('.d-icon');
  if (ic && !isTouch) deskItems[ic.dataset.i].run();
});
$('#icons').addEventListener('keydown', e => {
  const ic = e.target.closest('.d-icon');
  if (ic && e.key === 'Enter') deskItems[ic.dataset.i].run();
});
$('#desktop').addEventListener('contextmenu', e => {
  if (e.target.closest('.window, #taskbar, .flyout')) return;
  e.preventDefault();
  const ic = e.target.closest('.d-icon');
  if (ic) {
    const item = deskItems[ic.dataset.i];
    const items = [['📂 Aç', item.run]];
    if (item.path) items.push(['⬇️ Cihaza indir', () => downloadPath(item.path)], ['🗑️ Sil', () => moveToBin(item.path)]);
    return showMenu(e.clientX, e.clientY, items);
  }
  showMenu(e.clientX, e.clientY, [
    ['🔄 Yenile', () => { reloadFS(); $('#icons').style.opacity = 0; setTimeout(() => { $('#icons').style.opacity = 1; }, 120); }],
    ['📄 Yeni metin belgesi', () => {
      const n = uniqueName(getNode(['Masaüstü']), 'Yeni metin belgesi.txt');
      fsWrite(['Masaüstü', n], '');
      openApp('notepad', { path: ['Masaüstü', n] });
    }],
    ['📁 Yeni klasör', () => fsMkdir(['Masaüstü', uniqueName(getNode(['Masaüstü']), 'Yeni klasör')])],
    null,
    ['💻 Terminalde aç', () => openApp('terminal')],
    ['🖼️ Kişiselleştir', () => openApp('settings', { page: 'personal' })],
    ['💾 Depolama ayarları', () => openApp('settings', { page: 'storage' })]
  ]);
});
$('#desktop').addEventListener('pointerdown', e => {
  if (!e.target.closest('.d-icon, .window, #taskbar, .flyout, .menu')) $$('.d-icon').forEach(x => x.classList.remove('sel'));
});

function moveToBin(path) {
  const parent = getNode(path.slice(0, -1)), name = last(path);
  if (!parent || !parent.children[name]) return;
  if (path[0] === BIN) fsRemove(path);
  else fsMove(path, [BIN, uniqueName(getNode([BIN]), name)]);
}

// =========================================================
// Uygulama: Dosya Gezgini
// =========================================================
function initExplorer(w, b, arg) {
  let path = arg?.path || [], sel = null;
  const hist = [], fwd = [];
  b.innerHTML = `<div class="ex">
    <div class="ex-bar">
      <button data-a="back" title="Geri">←</button><button data-a="fwd" title="İleri">→</button><button data-a="up" title="Üst klasör">↑</button><button data-a="refresh" title="Yenile (cihazdaki değişiklikleri oku)">⟳</button>
      <div class="ex-crumb"></div>
      <input class="ex-search" placeholder="🔍 Ara">
    </div>
    <div class="ex-tools">
      <button data-a="newdir">📁 Yeni klasör</button><button data-a="newfile">📄 Yeni metin belgesi</button>
      <button data-a="upload">⬆️ Cihazdan ekle</button><button data-a="open">📂 Aç</button>
      <button data-a="download">⬇️ İndir</button><button data-a="del">🗑️ Sil</button><button data-a="empty">🧹 Kutuyu boşalt</button>
    </div>
    <div class="ex-main"><nav class="ex-side"></nav><div class="ex-items" tabindex="0"></div></div>
    <div class="ex-status"><span class="ex-count"></span><span class="ex-where"></span></div></div>`;
  const side = $('.ex-side', b), items = $('.ex-items', b), crumb = $('.ex-crumb', b), search = $('.ex-search', b);
  const quick = [['Bu Bilgisayar', [], '🖥️'], ...['Masaüstü', 'Belgeler', 'İndirilenler', 'Resimler', 'Müzik', 'Videolar', 'Yerel Disk (C:)', BIN].map(n => [n, [n], SPECIAL_ICONS[n]])];
  side.innerHTML = quick.map(([n, , ic], i) => `<button data-i="${i}" title="${esc(n)}"><span class="i">${ic}</span> <span class="t">${esc(n)}</span></button>`).join('');
  side.onclick = e => { const bt = e.target.closest('button'); if (bt) go(quick[bt.dataset.i][1]); };

  // Cihazdan dosya seçme kutusu (telefonda galeri/dosyalar açılır)
  const picker = document.createElement('input');
  picker.type = 'file'; picker.multiple = true; picker.hidden = true;
  b.append(picker);
  picker.addEventListener('change', async () => {
    const d = getNode(path);
    if (!d || !path.length) return;
    let count = 0;
    for (const f of picker.files) {
      const name = uniqueName(d, cleanName(f.name) || 'dosya');
      fsWrite([...path, name], isText(name) && f.size < 2e6 ? await f.text() : f);
      count++;
    }
    picker.value = '';
    if (count) toast('Dosya Gezgini', `${count} dosya "${last(path)}" klasörüne eklendi.`);
  });

  function go(p, push = true) {
    if (!getNode(p)) p = [];
    if (push) { hist.push(path); fwd.length = 0; }
    path = [...p]; sel = null; search.value = '';
    render();
  }
  function render() {
    const node = getNode(path);
    if (!node || node.type !== 'dir') {
      if (path.length) { path = []; return render(); }
      items.innerHTML = '<div class="ex-empty">Dosyalar yükleniyor…</div>';
      return;
    }
    w.setTitle(last(path) || 'Bu Bilgisayar');
    crumb.innerHTML = ['🖥️ Bu Bilgisayar', ...path].map((p, i) => `<span data-i="${i}">${esc(p)}</span>`).join('<i>›</i>');
    const q = search.value.toLocaleLowerCase('tr');
    const entries = Object.entries(node.children)
      .filter(([n]) => n.toLocaleLowerCase('tr').includes(q))
      .sort(([a, x], [c, y]) => (x.type === y.type ? 0 : x.type === 'dir' ? -1 : 1) || a.localeCompare(c, 'tr'));
    if (sel && !node.children[sel]) sel = null;
    items.innerHTML = entries.length
      ? entries.map(([n, c]) => `<div class="ex-item${sel === n ? ' sel' : ''}" data-n="${esc(n)}" title="${esc(n)}${c.type === 'file' ? ' · ' + fmtSize(fsize(c)) : ''}"><span class="ico">${iconFor(n, c)}</span><span class="lbl">${esc(n)}</span></div>`).join('')
      : `<div class="ex-empty">${q ? 'Aramanızla eşleşen öğe yok.' : 'Bu klasör boş.'}</div>`;
    const selNode = sel && node.children[sel];
    $('.ex-count', b).textContent = `${entries.length} öğe${selNode ? ` · "${sel}" seçili${selNode.type === 'file' ? ' (' + fmtSize(fsize(selNode)) + ')' : ''}` : ''}`;
    const si = storageInfo();
    $('.ex-where', b).textContent = `${si.icon} ${si.text}`;
    const inBin = path.length === 1 && path[0] === BIN;
    $('[data-a=empty]', b).classList.toggle('hidden', !inBin);
    ['newdir', 'newfile', 'upload'].forEach(a => $(`[data-a=${a}]`, b).classList.toggle('hidden', !path.length || inBin));
    $('[data-a=del]', b).classList.toggle('hidden', !path.length);
    $('[data-a=download]', b).classList.toggle('hidden', !path.length);
    $('[data-a=back]', b).disabled = !hist.length;
    $('[data-a=fwd]', b).disabled = !fwd.length;
    $('[data-a=up]', b).disabled = !path.length;
  }
  function openSel(n) {
    const p = [...path, n], node = getNode(p);
    if (!node) return;
    if (node.type === 'dir') go(p); else openPath(p);
  }
  function create(isDir) {
    const node = getNode(path);
    const def = isDir ? 'Yeni klasör' : 'Yeni metin belgesi.txt';
    let name = prompt(isDir ? 'Klasör adı:' : 'Dosya adı:', def);
    if (name === null) return;
    name = cleanName(name) || def;
    if (!isDir && !/\.[^.]+$/.test(name)) name += '.txt';
    name = uniqueName(node, name);
    sel = name;
    if (isDir) fsMkdir([...path, name]); else fsWrite([...path, name], '');
  }
  b.querySelector('.ex-bar').addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'back' && hist.length) { fwd.push(path); go(hist.pop(), false); }
    else if (a === 'fwd' && fwd.length) { hist.push(path); go(fwd.pop(), false); }
    else if (a === 'up' && path.length) go(path.slice(0, -1));
    else if (a === 'refresh') reloadFS();
  });
  $('.ex-tools', b).addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'newdir') create(true);
    else if (a === 'newfile') create(false);
    else if (a === 'upload') picker.click();
    else if (a === 'open') { if (sel) openSel(sel); else toast('Dosya Gezgini', 'Önce bir öğe seçin.'); }
    else if (a === 'download') {
      const n = sel && getNode([...path, sel]);
      if (!n) return toast('Dosya Gezgini', 'Önce indirilecek dosyayı seçin.');
      if (n.type === 'dir') return toast('Dosya Gezgini', 'Klasörler indirilemez; içindeki dosyaları tek tek indirin.');
      downloadPath([...path, sel]);
    } else if (a === 'del') {
      if (!sel) return toast('Dosya Gezgini', 'Önce silinecek öğeyi seçin.');
      if (path[0] === BIN && !confirm(`"${sel}" kalıcı olarak silinsin mi?`)) return;
      moveToBin([...path, sel]);
    } else if (a === 'empty') {
      const names = Object.keys(getNode([BIN]).children);
      if (names.length && confirm('Geri Dönüşüm Kutusu boşaltılsın mı? Dosyalar kalıcı olarak silinir.')) names.forEach(n => fsRemove([BIN, n]));
    }
  });
  crumb.addEventListener('click', e => { const s = e.target.closest('[data-i]'); if (s) go(path.slice(0, +s.dataset.i)); });
  search.addEventListener('input', render);
  items.addEventListener('click', e => { const it = e.target.closest('.ex-item'); sel = it ? it.dataset.n : null; render(); if (it && isTouch) openSel(sel); });
  items.addEventListener('dblclick', e => { const it = e.target.closest('.ex-item'); if (it && !isTouch) openSel(it.dataset.n); });
  items.addEventListener('keydown', e => {
    if (e.key === 'Delete' && sel && path.length) moveToBin([...path, sel]);
    if (e.key === 'Enter' && sel) openSel(sel);
    if (e.key === 'Backspace' && path.length) go(path.slice(0, -1));
  });
  const onFs = () => render();
  document.addEventListener('fschange', onFs);
  w.onClose = () => document.removeEventListener('fschange', onFs);
  render();
}

// =========================================================
// Uygulama: Not Defteri
// =========================================================
function initNotepad(w, b, arg) {
  let path = arg?.path || null, dirty = false, size = 15, wrap = true;
  b.innerHTML = `<div class="np">
    <div class="menubar">
      <button data-a="new">📄 Yeni</button><button data-a="save">💾 Kaydet</button><button data-a="saveas">Farklı kaydet</button>
      <button data-a="wrap">Sözcük kaydırma: Açık</button><button data-a="zin">A+</button><button data-a="zout">A−</button><button data-a="time">🕒 Saat/Tarih</button>
    </div>
    <textarea spellcheck="false" placeholder="Yazmaya başlayın..."></textarea>
    <div class="statusbar"><span class="pos">Sat 1, Süt 1</span><span class="cnt">0 karakter</span><span>UTF-8</span></div></div>`;
  const ta = $('textarea', b);
  const node = path && getNode(path);
  ta.value = node?.type === 'file' && !node.bin ? node.content : '';
  const title = () => w.setTitle(`${dirty ? '*' : ''}${path ? last(path) : 'Adsız'} - Not Defteri`);
  const pos = () => {
    const before = ta.value.slice(0, ta.selectionStart).split('\n');
    $('.pos', b).textContent = `Sat ${before.length}, Süt ${last(before).length + 1}`;
    $('.cnt', b).textContent = `${ta.value.length} karakter`;
  };
  function save(as) {
    if (!path || as || !getNode(path.slice(0, -1))) {
      let name = prompt('Dosya adı (Belgeler klasörüne kaydedilir):', path ? last(path) : 'Adsız.txt');
      if (name === null) return false;
      name = cleanName(name) || 'Adsız.txt';
      if (!/\.[^.]+$/.test(name)) name += '.txt';
      const docs = getNode(['Belgeler']);
      if (docs.children[name] && !confirm(`"${name}" zaten var. Üzerine yazılsın mı?`)) return false;
      path = ['Belgeler', name];
    }
    if (!fsWrite(path, ta.value)) { toast('Not Defteri', 'Dosya kaydedilemedi.'); return false; }
    dirty = false;
    title();
    toast('Not Defteri', `"${last(path)}" kaydedildi.`);
    return true;
  }
  ta.addEventListener('input', () => { if (!dirty) { dirty = true; title(); } pos(); });
  ['keyup', 'click', 'select'].forEach(ev => ta.addEventListener(ev, pos));
  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(e.shiftKey); }
    if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('\t', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
  });
  $('.menubar', b).addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'new') openApp('notepad');
    else if (a === 'save') save(false);
    else if (a === 'saveas') save(true);
    else if (a === 'wrap') { wrap = !wrap; ta.classList.toggle('nowrap', !wrap); e.target.textContent = `Sözcük kaydırma: ${wrap ? 'Açık' : 'Kapalı'}`; }
    else if (a === 'zin') ta.style.fontSize = (size = Math.min(40, size + 2)) + 'px';
    else if (a === 'zout') ta.style.fontSize = (size = Math.max(9, size - 2)) + 'px';
    else if (a === 'time') { ta.setRangeText(new Date().toLocaleString('tr-TR'), ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); ta.focus(); }
  });
  w.beforeClose = () => !dirty || confirm('Kaydedilmemiş değişiklikler var. Yine de kapatılsın mı?');
  title(); pos();
  if (!isTouch) setTimeout(() => ta.focus(), 60);
}

// =========================================================
// Uygulama: Hesap Makinesi
// =========================================================
function initCalc(w, b) {
  const keys = ['%', 'CE', 'C', '⌫', '¹⁄ₓ', 'x²', '√x', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '±', '0', ',', '='];
  b.innerHTML = `<div class="calc"><div class="c-expr"></div><div class="c-disp">0</div>
    <div class="c-keys">${keys.map(k => `<button data-k="${k}" class="${/^[0-9,±]$/.test(k) ? 'num' : k === '=' ? 'eq' : ''}">${k}</button>`).join('')}</div></div>`;
  let cur = '0', prev = null, op = null, fresh = true, expr = '';
  const fmt = n => {
    if (!isFinite(n)) return 'Tanımsız';
    return (+n.toPrecision(12)).toLocaleString('tr-TR', { maximumFractionDigits: 10 });
  };
  const calc = (a, c, o) => o === '+' ? a + c : o === '−' ? a - c : o === '×' ? a * c : c === 0 ? NaN : a / c;
  const show = () => {
    $('.c-disp', b).textContent = fresh ? fmt(+cur) : cur.replace('.', ',');
    $('.c-expr', b).textContent = expr;
  };
  function press(k) {
    if (cur === 'NaN' && k !== 'C') { cur = '0'; }
    if (/^[0-9]$/.test(k)) {
      if (fresh) { cur = k; fresh = false; } else if (cur.replace(/[-.]/g, '').length < 16) cur = cur === '0' ? k : cur + k;
    } else if (k === ',') {
      if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.';
    } else if ('+−×÷'.includes(k)) {
      if (op && !fresh) cur = String(calc(+prev, +cur, op));
      prev = cur; op = k; fresh = true; expr = `${fmt(+prev)} ${k}`;
    } else if (k === '=') {
      if (op) { expr = `${fmt(+prev)} ${op} ${fmt(+cur)} =`; cur = String(calc(+prev, +cur, op)); op = null; prev = null; }
      fresh = true;
    } else if (k === 'C') { cur = '0'; prev = null; op = null; expr = ''; fresh = true; }
    else if (k === 'CE') { cur = '0'; fresh = true; }
    else if (k === '⌫') { if (!fresh) { cur = cur.slice(0, -1); if (cur === '' || cur === '-') { cur = '0'; fresh = true; } } }
    else if (k === '±') { cur = String(-+cur); }
    else if (k === '%') { cur = String(prev !== null ? (+prev * +cur) / 100 : +cur / 100); fresh = true; }
    else if (k === '¹⁄ₓ') { expr = `1/(${fmt(+cur)})`; cur = String(+cur === 0 ? NaN : 1 / +cur); fresh = true; }
    else if (k === 'x²') { expr = `sqr(${fmt(+cur)})`; cur = String((+cur) ** 2); fresh = true; }
    else if (k === '√x') { expr = `√(${fmt(+cur)})`; cur = String(Math.sqrt(+cur)); fresh = true; }
    show();
  }
  $('.c-keys', b).addEventListener('click', e => { const k = e.target.closest('[data-k]'); if (k) press(k.dataset.k); });
  const map = { '+': '+', '-': '−', '*': '×', '/': '÷', 'Enter': '=', '=': '=', 'Backspace': '⌫', 'Escape': 'C', 'Delete': 'CE', ',': ',', '.': ',', '%': '%' };
  const onKey = e => {
    if (activeWin !== w || e.target.matches('input, textarea')) return;
    const k = /^[0-9]$/.test(e.key) ? e.key : map[e.key];
    if (k) { e.preventDefault(); press(k); }
  };
  document.addEventListener('keydown', onKey);
  w.onClose = () => document.removeEventListener('keydown', onKey);
}

// =========================================================
// Uygulama: Paint
// Çizimler tarayıcıya "indirilmez"; sanal Resimler klasörüne,
// yani bağlı cihaz klasörüne PNG olarak kaydedilir.
// =========================================================
function loadImage(blob) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(blob), im = new Image();
    im.onload = () => { res(im); URL.revokeObjectURL(u); };
    im.onerror = () => { rej(new Error('Resim okunamadı')); URL.revokeObjectURL(u); };
    im.src = u;
  });
}
function initPaint(w, b, arg) {
  let path = arg?.path || null, dirty = false;
  const colors = ['#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'];
  b.innerHTML = `<div class="pt">
    <div class="pt-tools">
      <button data-t="pen" class="on">✏️ Kalem</button><button data-t="eraser">🧽 Silgi</button>
      <button data-t="line">📏 Çizgi</button><button data-t="rect">▭ Dikdörtgen</button><button data-t="ellipse">◯ Elips</button>
      <label>Boyut <input type="range" min="1" max="40" value="4" class="pt-size"></label>
      <div class="pt-colors">${colors.map((c, i) => `<button class="sw${i === 0 ? ' on' : ''}" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('')}
        <input type="color" class="pt-custom" value="#000000" title="Özel renk"></div>
      <button data-a="clear">🗑️ Temizle</button><button data-a="save">💾 Kaydet</button><button data-a="saveas">Farklı kaydet</button>
    </div>
    <div class="pt-canvas"><canvas></canvas></div></div>`;
  const wrap = $('.pt-canvas', b), cv = $('canvas', b), ctx = cv.getContext('2d');
  let tool = 'pen', color = '#000000', drawing = false, sx = 0, sy = 0, snap = null;
  const title = () => w.setTitle(`${dirty ? '*' : ''}${path ? last(path) : 'Adsız'} - Paint`);
  const fillWhite = (x, y, ww, hh) => { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, ww, hh); };
  // Tuvali büyüt, mevcut çizimi koru
  const grow = (W, H) => {
    W = Math.max(cv.width, Math.ceil(W)); H = Math.max(cv.height, Math.ceil(H));
    if (W === cv.width && H === cv.height) return;
    const old = cv.width ? ctx.getImageData(0, 0, cv.width, cv.height) : null;
    cv.width = W; cv.height = H;
    fillWhite(0, 0, W, H);
    if (old) ctx.putImageData(old, 0, 0);
  };
  const ro = new ResizeObserver(() => grow(wrap.clientWidth, wrap.clientHeight));
  ro.observe(wrap);
  w.onClose = () => ro.disconnect();
  w.beforeClose = () => !dirty || confirm('Kaydedilmemiş bir çizim var. Yine de kapatılsın mı?');

  // Bir resim dosyasıyla açıldıysa onu tuvale yükle
  if (path) {
    fsRead(path).then(loadImage).then(im => {
      grow(Math.max(wrap.clientWidth, im.width), Math.max(wrap.clientHeight, im.height));
      ctx.drawImage(im, 0, 0);
    }).catch(() => toast('Paint', 'Resim açılamadı.'));
  }
  title();

  async function save(as) {
    if (!path || as || !/\.png$/i.test(last(path)) || !getNode(path.slice(0, -1))) {
      const def = path ? last(path).replace(/\.[^.]+$/, '') + '.png' : 'Çizim.png';
      let name = prompt('Resim adı (Resimler klasörüne kaydedilir):', def);
      if (name === null) return;
      name = cleanName(name).replace(/\.[^.]+$/, '') || 'Çizim';
      name += '.png';
      const pics = getNode(['Resimler']);
      if (pics.children[name] && !confirm(`"${name}" zaten var. Üzerine yazılsın mı?`)) return;
      path = ['Resimler', name];
    }
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    if (!blob || !fsWrite(path, blob)) return toast('Paint', 'Resim kaydedilemedi.');
    dirty = false;
    title();
    toast('Paint', `"${last(path)}" ${path[0]} klasörüne kaydedildi.`);
  }

  const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => {
    drawing = true;
    if (!dirty) { dirty = true; title(); }
    cv.setPointerCapture(e.pointerId);
    [sx, sy] = pt(e);
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.lineWidth = +$('.pt-size', b).value * (tool === 'eraser' ? 3 : 1);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    snap = ctx.getImageData(0, 0, cv.width, cv.height);
    if (tool === 'pen' || tool === 'eraser') { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 0.01, sy); ctx.stroke(); }
  });
  cv.addEventListener('pointermove', e => {
    if (!drawing) return;
    const [x, y] = pt(e);
    if (tool === 'pen' || tool === 'eraser') { ctx.lineTo(x, y); ctx.stroke(); return; }
    ctx.putImageData(snap, 0, 0);
    ctx.beginPath();
    if (tool === 'line') { ctx.moveTo(sx, sy); ctx.lineTo(x, y); }
    else if (tool === 'rect') ctx.rect(sx, sy, x - sx, y - sy);
    else if (tool === 'ellipse') ctx.ellipse((sx + x) / 2, (sy + y) / 2, Math.abs(x - sx) / 2, Math.abs(y - sy) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  const end = () => { drawing = false; snap = null; };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);

  $('.pt-tools', b).addEventListener('click', e => {
    const t = e.target.closest('[data-t]'), c = e.target.closest('[data-c]'), a = e.target.closest('[data-a]')?.dataset.a;
    if (t) { tool = t.dataset.t; $$('[data-t]', b).forEach(x => x.classList.toggle('on', x === t)); }
    if (c) { color = c.dataset.c; $$('.sw', b).forEach(x => x.classList.toggle('on', x === c)); if (tool === 'eraser') $('[data-t=pen]', b).click(); }
    if (a === 'clear' && confirm('Tuval temizlensin mi?')) { fillWhite(0, 0, cv.width, cv.height); dirty = true; title(); }
    if (a === 'save') save(false);
    if (a === 'saveas') save(true);
  });
  $('.pt-custom', b).addEventListener('input', e => { color = e.target.value; $$('.sw', b).forEach(x => x.classList.remove('on')); });
}

// =========================================================
// Uygulama: Fotoğraflar (resim görüntüleyici)
// =========================================================
function initPhotos(w, b, arg) {
  let path = arg?.path || null, url = null;
  b.innerHTML = `<div class="ph">
    <div class="menubar">
      <button data-a="prev" title="Önceki">◀</button><button data-a="next" title="Sonraki">▶</button>
      <button data-a="edit">🎨 Paint'te düzenle</button><button data-a="dl">⬇️ Cihaza indir</button><button data-a="del">🗑️ Sil</button>
      <span class="ph-name"></span>
    </div>
    <div class="ph-view"><img alt=""><div class="ph-empty hidden">Gösterilecek resim yok.<br>Paint ile çizip kaydedin ya da Dosya Gezgini'nde Resimler klasörüne "Cihazdan ekle" ile resim ekleyin.</div></div></div>`;
  const img = $('img', b), empty = $('.ph-empty', b);
  const siblings = () => {
    const p = path ? path.slice(0, -1) : ['Resimler'];
    const d = getNode(p);
    return d && d.type === 'dir'
      ? Object.keys(d.children).filter(n => d.children[n].type === 'file' && IMG_EXT.test(n)).sort((a, c) => a.localeCompare(c, 'tr')).map(n => [...p, n])
      : [];
  };
  async function show() {
    if (!path || !getNode(path)) path = siblings()[0] || null;
    if (url) { URL.revokeObjectURL(url); url = null; }
    if (!path) {
      img.classList.add('hidden'); empty.classList.remove('hidden');
      $('.ph-name', b).textContent = ''; w.setTitle('Fotoğraflar');
      return;
    }
    const shown = path;
    try {
      const blob = await fsRead(shown);
      if (shown !== path) return; // bu arada başka resme geçildi
      url = URL.createObjectURL(blob);
      img.src = url;
      img.classList.remove('hidden'); empty.classList.add('hidden');
      $('.ph-name', b).textContent = `${last(shown)} · ${fmtSize(blob.size)}`;
      w.setTitle(`${last(shown)} - Fotoğraflar`);
    } catch { toast('Fotoğraflar', 'Resim açılamadı.'); }
  }
  const step = d => {
    const list = siblings();
    if (!list.length) return;
    const i = list.findIndex(p => p.join('/') === (path || []).join('/'));
    path = list[(i + d + list.length) % list.length];
    show();
  };
  $('.menubar', b).addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'prev') step(-1);
    else if (a === 'next') step(1);
    else if (a === 'edit' && path) openApp('paint', { path });
    else if (a === 'dl' && path) downloadPath(path);
    else if (a === 'del' && path && confirm(`"${last(path)}" Geri Dönüşüm Kutusu'na taşınsın mı?`)) { const p = path; step(1); moveToBin(p); if (path && path.join('/') === p.join('/')) path = null; show(); }
  });
  const onKey = e => { if (activeWin === w && !e.target.matches('input, textarea')) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); } };
  document.addEventListener('keydown', onKey);
  w.onArg = a => { if (a?.path) { path = a.path; show(); } };
  w.onClose = () => { document.removeEventListener('keydown', onKey); if (url) URL.revokeObjectURL(url); };
  show();
}

// =========================================================
// Uygulama: Web Tarayıcı
// =========================================================
const HOME_LINKS = [
  ['📚', 'Vikipedi', 'https://tr.wikipedia.org/wiki/Ana_Sayfa'],
  ['🗺️', 'Harita', 'https://www.openstreetmap.org/export/embed.html?bbox=28.85,40.95,29.15,41.12&layer=mapnik'],
  ['🧪', 'Örnek site', 'https://example.com'],
  ['🪐', 'Windows 11 (Vikipedi)', 'https://tr.wikipedia.org/wiki/Windows_11']
];
function homeDoc() {
  const links = HOME_LINKS.map(([i, n, u]) => `<a href="#" data-u="${esc(u)}"><span>${i}</span>${esc(n)}</a>`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
    body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#e0f2fe,#ede9fe);color:#1a1a1a;padding:20px;box-sizing:border-box}
    h1{font-weight:600;margin:0 0 20px}form{display:flex;width:min(560px,90vw)}
    input{flex:1;padding:12px 20px;border-radius:24px;border:1px solid #ccc;font-size:16px;outline:none;box-shadow:0 2px 10px rgba(0,0,0,.06)}
    input:focus{border-color:#0078d4}.links{display:flex;gap:14px;margin-top:28px;flex-wrap:wrap;justify-content:center}
    a{display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;color:#1a1a1a;background:#ffffffaa;padding:14px 16px;border-radius:12px;width:110px;font-size:13px;text-align:center}
    a:hover{background:#fff}a span{font-size:30px}small{margin-top:30px;color:#555;max-width:540px;text-align:center;line-height:1.5}
  </style></head><body><h1>🌐 Yeni sekme</h1>
  <form id="f"><input name="q" placeholder="Vikipedi'de arayın veya bir adres yazın" autocomplete="off"></form>
  <div class="links">${links}</div>
  <small>Not: Google, YouTube gibi pek çok site güvenlik nedeniyle başka sayfaların içinde açılmaya izin vermez. Sayfa boş kalırsa adres çubuğundaki ↗ düğmesiyle siteyi gerçek tarayıcınızda yeni sekmede açın.</small>
  <script>
    document.getElementById('f').onsubmit=function(e){e.preventDefault();parent.postMessage({w11nav:this.q.value},'*')};
    document.querySelectorAll('a[data-u]').forEach(function(a){a.onclick=function(e){e.preventDefault();parent.postMessage({w11nav:a.dataset.u},'*')}});
  <\/script></body></html>`;
}
function initBrowser(w, b, arg) {
  b.innerHTML = `<div class="br">
    <div class="br-bar">
      <button data-a="back" title="Geri">←</button><button data-a="fwd" title="İleri">→</button><button data-a="reload" title="Yenile">⟳</button><button data-a="home" title="Giriş sayfası">⌂</button>
      <input class="br-addr" placeholder="Arama yapın veya web adresi yazın" spellcheck="false">
      <button data-a="ext" title="Gerçek tarayıcıda yeni sekmede aç">↗</button>
    </div>
    <iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerpolicy="no-referrer" title="Web içeriği"></iframe></div>`;
  const fr = $('iframe', b), addr = $('.br-addr', b);
  const hist = [], fwd = [];
  let cur = 'home';
  w.iframe = fr;
  function load(u) {
    cur = u;
    if (u === 'home') { fr.removeAttribute('src'); fr.srcdoc = homeDoc(); addr.value = ''; w.setTitle('Yeni sekme - Web Tarayıcı'); }
    else { fr.removeAttribute('srcdoc'); fr.src = u; addr.value = u; w.setTitle(`${u.replace(/^https?:\/\//, '').split('/')[0]} - Web Tarayıcı`); }
    $('[data-a=back]', b).disabled = !hist.length;
    $('[data-a=fwd]', b).disabled = !fwd.length;
  }
  w.navigate = input => {
    let u = String(input || '').trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) {
      u = /^[^\s]+\.[a-z]{2,}(\/\S*)?$/i.test(u) ? 'https://' + u : 'https://tr.wikipedia.org/w/index.php?search=' + encodeURIComponent(u);
    }
    hist.push(cur); fwd.length = 0;
    load(u);
  };
  addr.addEventListener('keydown', e => { if (e.key === 'Enter') { w.navigate(addr.value); addr.blur(); } });
  addr.addEventListener('focus', () => addr.select());
  $('.br-bar', b).addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'back' && hist.length) { fwd.push(cur); load(hist.pop()); }
    else if (a === 'fwd' && fwd.length) { hist.push(cur); load(fwd.pop()); }
    else if (a === 'reload') load(cur);
    else if (a === 'home') { if (cur !== 'home') { hist.push(cur); fwd.length = 0; } load('home'); }
    else if (a === 'ext') window.open(cur === 'home' ? 'https://tr.wikipedia.org' : cur, '_blank', 'noopener');
  });
  load('home');
  if (arg?.url) w.navigate(arg.url);
}
// Giriş sayfasından gelen gezinme isteklerini doğru pencereye yönlendir
window.addEventListener('message', e => {
  if (!e.data || typeof e.data.w11nav !== 'string') return;
  const w = wins.find(x => x.iframe && x.iframe.contentWindow === e.source);
  if (w) w.navigate(e.data.w11nav);
});

// =========================================================
// Uygulama: Terminal
// =========================================================
function initTerminal(w, b) {
  b.innerHTML = `<div class="term"><div class="term-out"></div><div class="term-line"><span class="term-prompt"></span><input class="term-in" spellcheck="false" autocomplete="off" autocapitalize="off"></div></div>`;
  const term = $('.term', b), out = $('.term-out', b), inp = $('.term-in', b), prm = $('.term-prompt', b);
  let cwd = [];
  const hist = []; let hi = 0;
  const pathStr = () => 'C:\\' + cwd.join('\\');
  const setPrompt = () => { prm.textContent = pathStr() + '> '; };
  const print = (t = '') => { out.textContent += t + '\n'; term.scrollTop = term.scrollHeight; };
  w.setTitle('Terminal');
  print('Win11 Web Terminal [Sürüm 1.1]\n(c) Win11 Web. Eğitim amaçlı simülasyon.\n\nKomutları görmek için "help" yazın.\n');
  setPrompt();
  const resolve = arg => {
    if (!arg) return cwd;
    const p = arg.startsWith('\\') ? [] : [...cwd];
    for (const part of arg.replace(/\//g, '\\').split('\\').filter(Boolean)) {
      if (part === '..') p.pop();
      else if (part !== '.') {
        const node = getNode(p);
        const real = node && node.type === 'dir' && Object.keys(node.children).find(k => k.toLocaleLowerCase('tr') === part.toLocaleLowerCase('tr'));
        p.push(real || part);
      }
    }
    return p;
  };
  const needFolder = () => { if (!cwd.length) { print('Erişim engellendi. Bir klasörün içine geçin (örn. cd Belgeler).'); return true; } return false; };
  const appAlias = { notepad: 'notepad', calc: 'calc', explorer: 'explorer', paint: 'paint', mspaint: 'paint', browser: 'browser', settings: 'settings', terminal: 'terminal', cmd: 'terminal', photos: 'photos' };
  const cmds = {
    help: () => print(`Kullanılabilir komutlar:
  help              Bu yardımı gösterir
  dir [yol]         Klasör içeriğini listeler
  cd <yol>          Klasör değiştirir (cd .. üst klasöre çıkar)
  type <dosya>      Dosya içeriğini yazdırır
  mkdir <ad>        Yeni klasör oluşturur
  echo <metin>      Metni yazdırır  (echo metin > dosya.txt ile dosyaya yazar)
  del <dosya>       Dosyayı Geri Dönüşüm Kutusu'na taşır
  start <uygulama>  Uygulama açar: notepad, calc, explorer, paint, photos, browser, settings
  storage           Dosyaların nerede saklandığını gösterir
  date / time       Tarih ve saati gösterir
  whoami, hostname, ver, ipconfig, systeminfo
  color             Yazı rengini değiştirir
  cls               Ekranı temizler
  exit              Terminali kapatır`),
    cls: () => { out.textContent = ''; },
    dir: a => {
      const p = resolve(a), node = getNode(p);
      if (!node || node.type !== 'dir') return print('Sistem belirtilen yolu bulamıyor.');
      print(` ${'C:\\' + p.join('\\')} dizini\n`);
      const ents = Object.entries(node.children);
      ents.forEach(([n, c]) => print(`${new Date().toLocaleDateString('tr-TR')}  ${c.type === 'dir' ? '<DIR>         ' : String(fsize(c)).padStart(9) + ' bayt'}  ${n}`));
      print(`\n${ents.filter(e => e[1].type === 'file').length} dosya, ${ents.filter(e => e[1].type === 'dir').length} klasör`);
    },
    cd: a => {
      if (!a) return print(pathStr());
      const p = resolve(a), node = getNode(p);
      if (!node || node.type !== 'dir') return print('Sistem belirtilen yolu bulamıyor.');
      cwd = p;
    },
    type: a => {
      const node = getNode(resolve(a));
      if (!node || node.type !== 'file') return print('Sistem belirtilen dosyayı bulamıyor.');
      print(node.bin ? 'Bu bir ikili (metin olmayan) dosya; içeriği yazdırılamaz.' : node.content);
    },
    mkdir: a => {
      const name = cleanName(a || '');
      if (!name) return print('Kullanım: mkdir <ad>');
      if (needFolder()) return;
      if (getNode(cwd).children[name]) return print('Bu adda bir öğe zaten var.');
      fsMkdir([...cwd, name]);
    },
    md: a => cmds.mkdir(a),
    del: a => {
      const p = resolve(a);
      if (!a || !getNode(p) || getNode(p).type !== 'file') return print('Dosya bulunamadı.');
      moveToBin(p); print('Dosya Geri Dönüşüm Kutusu\'na taşındı.');
    },
    echo: a => {
      const m = a.match(/^(.*?)\s*>\s*(.+)$/);
      if (!m) return print(a);
      if (needFolder()) return;
      const name = cleanName(m[2]);
      if (!name) return print('Geçersiz dosya adı.');
      fsWrite([...cwd, name], m[1]);
    },
    start: a => {
      const id = appAlias[(a || '').toLowerCase().replace(/\.exe$/, '')];
      if (!id) return print(`'${a}' bulunamadı. Örnek: start notepad`);
      openApp(id);
    },
    storage: () => { const si = storageInfo(); print(`${si.icon} ${si.text}`); },
    date: () => print('Bugünün tarihi: ' + new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })),
    time: () => print('Geçerli saat: ' + new Date().toLocaleTimeString('tr-TR')),
    whoami: () => print('win11web\\' + settings.user.toLocaleLowerCase('tr').replace(/\s+/g, '')),
    hostname: () => print('WIN11WEB-PC'),
    ver: () => print('\nWin11 Web [Sürüm 10.0.22631.web]\n'),
    ipconfig: () => print('\nWindows IP Yapılandırması\n\nKablosuz LAN bağdaştırıcısı Wi-Fi:\n   IPv4 Adresi . . . . . . : 192.168.1.42\n   Alt Ağ Maskesi  . . . . : 255.255.255.0\n   Varsayılan Ağ Geçidi  . : 192.168.1.1\n\n(Bu veriler örnektir.)'),
    systeminfo: () => print(`\nAna Bilgisayar Adı:  WIN11WEB-PC\nİşletim Sistemi:     Win11 Web (simülasyon)\nİşlemci çekirdeği:   ${navigator.hardwareConcurrency || '?'}\nDil:                 ${navigator.language}\nEkran:               ${screen.width}x${screen.height}\nDepolama:            ${storageInfo().text}\nÇalışma süresi:      ${Math.round(performance.now() / 1000)} sn`),
    color: () => { term.classList.toggle('green'); },
    exit: () => closeWin(w)
  };
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) inp.value = hist[--hi]; return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; return; }
    if (e.key !== 'Enter') return;
    const line = inp.value; inp.value = '';
    print(pathStr() + '> ' + line);
    if (line.trim()) hist.push(line);
    hi = hist.length;
    const c = line.trim().split(/\s+/)[0];
    const arg = line.trim().slice((c || '').length).trim();
    if (c) {
      const fn = cmds[c.toLowerCase()];
      if (fn) fn(arg); else print(`'${c}' iç ya da dış komut, çalıştırılabilir program veya toplu iş dosyası olarak tanınmıyor.`);
    }
    if (!c || c.toLowerCase() !== 'exit') { print(); setPrompt(); }
    term.scrollTop = term.scrollHeight;
  });
  term.addEventListener('click', () => { if (!getSelection().toString()) inp.focus(); });
  if (!isTouch) setTimeout(() => inp.focus(), 60);
}

// =========================================================
// Uygulama: Ayarlar
// =========================================================
let settingsWin = null;
function refreshSettingsWin() { settingsWin?.render?.(); }
document.addEventListener('fschange', refreshSettingsWin);
function initSettings(w, b, arg) {
  settingsWin = w;
  let page = arg?.page || 'personal', busy = false;
  const PAGES = [['system', '🖥️', 'Sistem'], ['personal', '🎨', 'Kişiselleştirme'], ['storage', '💾', 'Depolama'], ['accounts', '👤', 'Hesaplar'], ['time', '🕒', 'Saat ve dil'], ['about', 'ℹ️', 'Hakkında']];
  b.innerHTML = `<div class="st"><nav class="st-nav"></nav><div class="st-body"></div></div>`;
  const nav = $('.st-nav', b), body = $('.st-body', b);
  w.onArg = a => { if (a?.page) { page = a.page; render(); } };
  w.onClose = () => { settingsWin = null; };
  w.render = render;
  function render() {
    // Kullanıcı yazı kutusundayken ekranı yeniden çizme (yazdığı kaybolmasın)
    if (body.contains(document.activeElement) && document.activeElement.matches('input[type=text]')) return;
    nav.innerHTML = `<div class="st-user"><span class="avatar">👤</span><div><b>${esc(settings.user)}</b><small style="display:block;color:var(--muted);font-size:12px">Yerel hesap</small></div></div>` +
      PAGES.map(([id, ic, n]) => `<button data-p="${id}" class="${page === id ? 'on' : ''}" title="${n}"><span class="i">${ic}</span> <span class="t">${n}</span></button>`).join('');
    const wp = WALLPAPERS[settings.wallpaper] || WALLPAPERS[0];
    const si = storageInfo();
    const onDevice = backend?.kind === 'device';
    const views = {
      system: `<h2>Sistem</h2>
        <div class="st-card"><div>☀️ Parlaklık<small>Ekranın parlaklığını ayarlayın</small></div><input type="range" min="30" max="100" value="${settings.brightness}" data-s="brightness"></div>
        <div class="st-card"><div>🌙 Gece ışığı<small>Mavi ışığı azaltan sıcak renkler</small></div><div class="seg"><button data-night="0" class="${settings.nightLight ? '' : 'on'}">Kapalı</button><button data-night="1" class="${settings.nightLight ? 'on' : ''}">Açık</button></div></div>
        <div class="st-card"><div>🖥️ Ekran çözünürlüğü<small>Tarayıcı penceresinin boyutu</small></div><span>${innerWidth} × ${innerHeight}</span></div>
        <div class="st-card"><div>🔔 Bildirim dene<small>Örnek bir bildirim gösterir</small></div><button class="btn" data-act="toast">Gönder</button></div>`,
      personal: `<h2>Kişiselleştirme</h2>
        <div class="st-preview" style="background:${wp.css}"></div>
        <div class="st-card"><div>🌓 Tema<small>Uygulamaların ve sistemin rengi</small></div><div class="seg"><button data-theme="light" class="${settings.theme === 'light' ? 'on' : ''}">Açık</button><button data-theme="dark" class="${settings.theme === 'dark' ? 'on' : ''}">Koyu</button></div></div>
        <div class="st-card"><div>🖼️ Arka plan<small>${esc(wp.name)}</small></div><div class="wp-list">${WALLPAPERS.map((x, i) => `<button data-wp="${i}" class="${i === settings.wallpaper ? 'on' : ''}" style="background:${x.css}" title="${esc(x.name)}"></button>`).join('')}</div></div>
        <div class="st-card"><div>🎨 Vurgu rengi<small>Düğmeler ve vurgular</small></div><div class="ac-list">${ACCENTS.map(c => `<button data-ac="${c}" class="${c === settings.accent ? 'on' : ''}" style="background:${c}" title="${c}"></button>`).join('')}</div></div>`,
      storage: `<h2>Depolama</h2>
        <div class="st-card"><div>${si.icon} Dosyalarınızın saklandığı yer<small>${esc(si.text)}</small></div></div>
        ${canPickFolder
          ? `<div class="st-card"><div>📁 Cihazda klasör<small>Seçtiğiniz konumda (ör. Belgeler) "${ROOT_FOLDER}" adlı gerçek bir klasör oluşturulur. Not Defteri, Paint ve Dosya Gezgini'nde oluşturduğunuz her şey bu klasöre gerçek dosya olarak kaydedilir; telefonunuzun veya bilgisayarınızın dosya yöneticisinden de görebilirsiniz.</small></div><button class="btn accent" data-act="pick" ${busy ? 'disabled' : ''}>${onDevice ? 'Farklı klasör seç' : 'Klasör seç'}</button></div>`
          : `<div class="st-card"><div>📱 Bu tarayıcı klasör seçmeyi desteklemiyor<small>iPhone/iPad (Safari) ve Firefox, sitelerin cihazınızda istediğiniz yere klasör oluşturmasına izin vermez. Dosyalarınız yine bu cihazda, tarayıcının bu siteye ayırdığı alanda saklanır. Bir dosyayı cihazınıza almak için Dosya Gezgini'nde seçip "⬇️ İndir"e dokunun. Klasör seçmek için Chrome veya Edge kullanabilirsiniz.</small></div></div>`}
        ${onDevice ? `<div class="st-card"><div>🌐 Tarayıcı depolamasına geç<small>Dosyalarınız tarayıcıya kopyalanır. Cihazdaki klasör ve içindekiler silinmez.</small></div><button class="btn" data-act="tobrowser" ${busy ? 'disabled' : ''}>Geç</button></div>` : ''}
        <div class="st-card"><div>📊 Tarayıcı alanı kullanımı<small class="st-usage">Hesaplanıyor…</small></div></div>`,
      accounts: `<h2>Hesaplar</h2>
        <div class="st-card"><div>👤 Kullanıcı adı<small>Kilit ekranında ve Başlat menüsünde görünür</small></div><input type="text" maxlength="24" value="${esc(settings.user)}" data-s="user"></div>
        <div class="st-card"><div>🔑 Oturum açma seçenekleri<small>Bu simülasyonda şifre kullanılmaz</small></div><span style="color:var(--muted)">Şifresiz</span></div>`,
      time: `<h2>Saat ve dil</h2>
        <div class="st-card"><div>🕒 Geçerli saat<small>Cihazınızın saatinden alınır</small></div><span>${new Date().toLocaleString('tr-TR')}</span></div>
        <div class="st-card"><div>🌍 Saat dilimi</div><span>${esc(Intl.DateTimeFormat().resolvedOptions().timeZone || '-')}</span></div>
        <div class="st-card"><div>🔤 Dil<small>Win11 Web arayüz dili</small></div><span>Türkçe</span></div>`,
      about: `<h2>Hakkında</h2>
        <div class="st-card" style="display:block"><div class="st-spec">
          <span>Cihaz adı</span><span>WIN11WEB-PC</span>
          <span>İşletim sistemi</span><span>Win11 Web 1.1 (tarayıcı simülasyonu)</span>
          <span>İşlemci çekirdeği</span><span>${navigator.hardwareConcurrency || 'Bilinmiyor'}</span>
          <span>Bellek</span><span>${navigator.deviceMemory ? '≈ ' + navigator.deviceMemory + ' GB' : 'Bilinmiyor'}</span>
          <span>Ekran</span><span>${screen.width} × ${screen.height}</span>
          <span>Tarayıcı dili</span><span>${esc(navigator.language)}</span>
          <span>Depolama</span><span>${esc(si.text)}</span>
        </div></div>
        <div class="st-card"><div>ℹ️ Not<small>Bu proje eğitim amaçlı bir arayüz simülasyonudur ve Microsoft ile bağlantılı değildir. Windows, Microsoft Corporation'ın ticari markasıdır.</small></div></div>
        <div class="st-card"><div>♻️ Sıfırla<small>Tarayıcıdaki dosyaları ve ayarları siler. Cihazınızdaki "${ROOT_FOLDER}" klasörüne dokunulmaz, sadece bağlantısı kaldırılır.</small></div><button class="btn" data-act="reset">Sıfırla</button></div>`
    };
    body.innerHTML = views[page] || views.personal;
    const usage = $('.st-usage', body);
    if (usage && navigator.storage?.estimate) {
      navigator.storage.estimate().then(e => { usage.textContent = `${fmtSize(e.usage || 0)} kullanılıyor (kota ≈ ${fmtSize(e.quota || 0)})`; }).catch(() => { usage.textContent = 'Bilinmiyor'; });
    } else if (usage) usage.textContent = 'Bilinmiyor';
  }
  nav.addEventListener('click', e => { const p = e.target.closest('[data-p]'); if (p) { page = p.dataset.p; render(); } });
  body.addEventListener('click', async e => {
    const t = e.target.closest('button');
    if (!t || t.disabled) return;
    const d = t.dataset;
    if (d.theme) settings.theme = d.theme;
    else if (d.wp) settings.wallpaper = +d.wp;
    else if (d.ac) settings.accent = d.ac;
    else if (d.night) settings.nightLight = d.night === '1';
    else if (d.act === 'toast') return toast('Ayarlar', 'Bu bir örnek bildirimdir. 🎉');
    else if (d.act === 'pick' || d.act === 'tobrowser') {
      busy = true; render();
      try { if (d.act === 'pick') await connectDeviceFolder(); else await switchToBrowser(); }
      catch (err) { toast('Depolama', err.message || String(err)); }
      busy = false; render();
      return;
    } else if (d.act === 'reset') {
      if (confirm(`Tarayıcıdaki tüm dosyalar ve ayarlar silinecek. Cihazınızdaki "${ROOT_FOLDER}" klasörü silinmez. Emin misiniz?`)) {
        await opQueue; await clearBrowserData(); location.reload();
      }
      return;
    } else return;
    saveSettings(); render();
  });
  body.addEventListener('input', e => {
    if (e.target.dataset.s === 'brightness') { settings.brightness = +e.target.value; saveSettings(); }
  });
  body.addEventListener('change', e => {
    if (e.target.dataset.s === 'user') { settings.user = e.target.value.trim() || 'Kullanıcı'; saveSettings(); e.target.blur(); render(); }
  });
  render();
}

// =========================================================
// Açılış, kilit ekranı ve kapatma
// =========================================================
function show(id) {
  ['#boot', '#lock', '#desktop', '#off'].forEach(s => $(s).classList.toggle('hidden', s !== id));
}
async function boot() {
  show('#boot');
  await Promise.all([
    sleep(1500),
    initStorage().catch(async err => {
      console.error(err);
      await useBackend(new MemoryBackend());
      setTimeout(() => toast('Depolama kullanılamıyor', 'Bu tarayıcıda dosyalar kaydedilemiyor; değişiklikler sayfa kapanınca kaybolur.'), 2500);
    })
  ]);
  showLock();
}
function showLock() {
  closeFlyouts();
  $('#lock').classList.remove('auth');
  $('.login').classList.add('hidden');
  show('#lock');
}
function unlockStep() {
  const lock = $('#lock');
  if (lock.classList.contains('hidden')) return;
  if (!lock.classList.contains('auth')) {
    lock.classList.add('auth');
    $('.login').classList.remove('hidden');
    setTimeout(() => $('#signIn').focus(), 50);
  }
}
let firstLogin = true, signingIn = false;
async function signIn() {
  if (signingIn) return;
  signingIn = true;
  const btn = $('#signIn');
  try {
    // Cihaz klasörüne erişim izni yeniden gerekiyorsa, tıklama anında iste
    if (pendingHandle) {
      const { h, label } = pendingHandle;
      pendingHandle = null;
      let perm = 'denied';
      try { perm = await h.requestPermission({ mode: 'readwrite' }); } catch { /* yoksay */ }
      btn.textContent = 'Hazırlanıyor…';
      if (perm === 'granted') await useBackend(new HandleBackend(h, 'device', label));
      else {
        store.set('storage', 'browser');
        await useBackend(await browserBackend());
        setTimeout(() => toast('Klasör izni verilmedi', 'Dosyalar şimdilik tarayıcı depolamasına kaydedilecek. Ayarlar > Depolama\'dan klasörü yeniden bağlayabilirsiniz.'), 600);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    btn.textContent = 'Oturum aç';
    signingIn = false;
  }
  show('#desktop');
  if (firstLogin) {
    firstLogin = false;
    setTimeout(() => toast(`Hoş geldiniz, ${settings.user}!`, 'Başlat düğmesine tıklayarak uygulamaları keşfedin.'), 400);
  }
  if (store.get('storage', null) === null) setTimeout(firstRunStorage, 700);
}
// İlk kullanımda dosyaların nerede saklanacağını sor
async function firstRunStorage() {
  if (!canPickFolder) {
    store.set('storage', 'browser');
    toast('Dosyalarınız bu cihazda', 'Notlarınız ve çizimleriniz bu cihazda, tarayıcının depolama alanında saklanır. Dosya Gezgini\'ndeki "İndir" ile cihazınıza alabilirsiniz.');
    return;
  }
  const choice = await dialog({
    title: 'Dosyalarınız nerede saklansın?',
    text: `Win11 Web'de oluşturduğunuz notlar, çizimler ve klasörler cihazınızda saklanır.<br><br>
      <b>📁 Cihazımda klasör:</b> Seçtiğiniz konumda (ör. Belgeler) <b>${ROOT_FOLDER}</b> adlı gerçek bir klasör oluşturulur. Dosyalarınızı telefonunuzun veya bilgisayarınızın dosya yöneticisinden de görebilirsiniz.<br><br>
      <b>🌐 Tarayıcıda:</b> Dosyalar bu cihazda, tarayıcının bu siteye ayırdığı alanda saklanır.<br><br>
      <small>Bunu daha sonra Ayarlar &gt; Depolama'dan değiştirebilirsiniz.</small>`,
    buttons: [
      { label: '📁 Cihazımda klasör oluştur', value: 'device', primary: true },
      { label: '🌐 Tarayıcıda sakla', value: 'browser' }
    ]
  });
  if (choice === 'device' && await connectDeviceFolder()) return;
  store.set('storage', 'browser');
  if (choice === 'device') toast('Klasör seçilmedi', 'Dosyalar tarayıcıda saklanacak. Ayarlar > Depolama\'dan istediğiniz zaman klasör seçebilirsiniz.');
}
async function shutdown(restart) {
  closeFlyouts();
  // Kaydedilmemiş dosya varsa kullanıcıya sor
  if (wins.some(w => w.beforeClose && !w.beforeClose())) return;
  [...wins].forEach(w => closeWin(w, true));
  show('#boot');
  await Promise.all([sleep(1200), opQueue]);
  if (restart) { firstLogin = true; return boot(); }
  show('#off');
}
$('#lock').addEventListener('click', e => { if (!e.target.closest('.login')) unlockStep(); });
document.addEventListener('keydown', e => {
  if ($('#lock').classList.contains('hidden')) return;
  if (!$('#lock').classList.contains('auth')) { unlockStep(); e.preventDefault(); }
  else if (e.key === 'Enter' && document.activeElement !== $('#signIn')) signIn();
});
$('#signIn').addEventListener('click', signIn);
$('#powerOn').addEventListener('click', () => { firstLogin = true; boot(); });

// ---------- Başlangıç ----------
applySettings();
tick();
renderIcons();
renderTaskbar();
boot();
