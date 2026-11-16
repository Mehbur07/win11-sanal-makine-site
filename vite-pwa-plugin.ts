import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

// public/ içinden önbelleğe alınmayacak dosyalar
const SKIP_PUBLIC = new Set(['404.html']);

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * Derleme sonunda dist/sw.js üretir: src/pwa/sw-template.js içine önbelleğe alınacak dosyaların
 * listesini ve sürüm numarasını yazar. Sürüm, dosyaların içeriğinden hesaplanır; site değişmedikçe
 * aynı kalır, değişince tarayıcı yeni sürümü fark eder. Ek bir kütüphane gerekmez.
 */
export function pwaPlugin(): Plugin {
  let root = '';
  let publicDir = '';
  return {
    name: 'vmos-pwa',
    apply: 'build',
    // En son çalışsın: index.html, Vite'ın kendi eklentileri tarafından üretildikten sonra listeye girsin
    enforce: 'post',
    configResolved(config) {
      root = config.root;
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      const urls: string[] = [];

      for (const [fileName, item] of Object.entries(bundle).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        urls.push(`/${fileName}`);
        hash.update(fileName);
        hash.update(item.type === 'chunk' ? item.code : item.source);
      }

      if (publicDir) {
        for (const file of listFiles(publicDir).sort()) {
          const path = relative(publicDir, file).split(sep).join('/');
          if (SKIP_PUBLIC.has(path)) continue;
          urls.push(`/${path}`);
          hash.update(path);
          hash.update(readFileSync(file));
        }
      }

      if (!urls.includes('/index.html')) {
        this.error('vmos-pwa: index.html derleme çıktısında yok, service worker üretilemedi');
      }

      const version = hash.digest('hex').slice(0, 12);
      const template = readFileSync(join(root, 'src/pwa/sw-template.js'), 'utf8');
      const source = template
        .replace('const VERSION = __VERSION__;', `const VERSION = ${JSON.stringify(version)};`)
        .replace(
          'const PRECACHE = __PRECACHE__;',
          `const PRECACHE = ${JSON.stringify(urls.sort(), null, 2)};`,
        );
      if (source.includes('__VERSION__') || source.includes('__PRECACHE__')) {
        this.error('vmos-pwa: sw-template.js içindeki yer tutucular bulunamadı');
      }
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
