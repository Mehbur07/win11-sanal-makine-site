import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listTrash } from '../../storage/fileOps.ts';
import { MemoryRecordStore, RecordBackend } from '../../storage/recordBackend.ts';
import type { Path, StorageBackend } from '../../storage/types.ts';
import { complete, formatPath, resolvePath, runCommand, tokenize, type ShellIO } from './shell.ts';

let fs: StorageBackend;
let cwd: Path;
const openApp = vi.fn();
const setTheme = vi.fn();

function io(): ShellIO {
  return {
    backend: fs,
    cwd,
    lang: 'tr',
    history: [],
    storageLabel: 'test',
    startedAt: Date.now(),
    openApp,
    setTheme,
  };
}

/** Komutu çalıştırır, cd ile klasör değiştiyse uygular, çıktı metinlerini döndürür */
async function sh(line: string): Promise<string[]> {
  const result = await runCommand(line, io());
  if (result.cwd) cwd = result.cwd;
  return result.lines.map((l) => l.text);
}

beforeEach(async () => {
  fs = new RecordBackend(new MemoryRecordStore(), 'memory');
  await fs.mkdir(['Belgeler']);
  await fs.mkdir(['Resimler']);
  cwd = [];
  openApp.mockReset();
  setTheme.mockReset();
});

describe('yardımcılar', () => {
  it('tırnak içindeki boşlukları korur', () => {
    expect(tokenize('echo "merhaba dünya" > "not 1.txt"')).toEqual([
      'echo',
      'merhaba dünya',
      '>',
      'not 1.txt',
    ]);
  });

  it('göreli ve mutlak yolları çözer', () => {
    expect(resolvePath(['Belgeler'], '../Resimler')).toEqual(['Resimler']);
    expect(resolvePath(['Belgeler'], '~')).toEqual([]);
    expect(resolvePath(['Belgeler'], '/Resimler/./a')).toEqual(['Resimler', 'a']);
    expect(resolvePath([], '..')).toEqual([]);
    expect(formatPath(['Belgeler'])).toBe('~/Belgeler');
  });
});

describe('msh komutları', () => {
  it('ls, cd, pwd', async () => {
    expect(await sh('ls')).toEqual(['Belgeler/', 'Resimler/']);
    await sh('cd Belgeler');
    expect(await sh('pwd')).toEqual(['~/Belgeler']);
    await sh('cd ..');
    expect(cwd).toEqual([]);
    expect((await sh('cd yok'))[0]).toContain('böyle bir dosya ya da klasör yok');
  });

  it('echo ile dosyaya yazar, >> ile ekler, cat okur', async () => {
    await sh('echo merhaba > not.txt');
    await sh('echo dünya >> not.txt');
    expect(await sh('cat not.txt')).toEqual(['merhaba', 'dünya']);
  });

  it('mkdir, touch, cp, mv, rm', async () => {
    await sh('mkdir Proje');
    await sh('touch Proje/a.txt');
    await sh('cp Proje/a.txt Belgeler');
    expect(await fs.stat(['Belgeler', 'a.txt'])).toBe('file');
    await sh('mv Proje/a.txt Proje/b.txt');
    expect(await fs.stat(['Proje', 'b.txt'])).toBe('file');
    await sh('mv Proje/b.txt Resimler/c.txt');
    expect(await fs.stat(['Resimler', 'c.txt'])).toBe('file');
    expect(await sh('rm Proje')).toEqual(['Proje: çöp kutusuna taşındı']);
    expect(await fs.stat(['Proje'])).toBeNull();
    expect(await listTrash(fs)).toHaveLength(1);
  });

  it('geçersiz adlara ve kendi içine taşımaya izin vermez', async () => {
    expect((await sh('mkdir kötü:ad'))[0]).toContain('geçersiz ad');
    expect((await sh('mv Belgeler Belgeler'))[0]).toContain('kendi içine');
  });

  it('open: uygulamayı ya da dosyayı uygun uygulamayla açar', async () => {
    await sh('open paint');
    expect(openApp).toHaveBeenLastCalledWith('paint');
    await sh('echo x > Belgeler/not.txt');
    await sh('open Belgeler/not.txt');
    expect(openApp).toHaveBeenLastCalledWith('editor', { path: ['Belgeler', 'not.txt'] });
    expect((await sh('open yok'))[0]).toContain('bulunamadı');
  });

  it('theme, bilinmeyen komut, clear, neofetch', async () => {
    await sh('theme light');
    expect(setTheme).toHaveBeenCalledWith('light');
    expect(await sh('uçur')).toEqual(['uçur: komut bulunamadı']);
    expect((await runCommand('clear', io())).clear).toBe(true);
    expect((await sh('neofetch')).join('\n')).toContain('VirtualMOS');
  });

  it('Tab tamamlama', async () => {
    expect(await complete('cd Bel', io())).toBe('cd Belgeler/');
    expect(await complete('cat ', io())).toBeNull();
  });
});
