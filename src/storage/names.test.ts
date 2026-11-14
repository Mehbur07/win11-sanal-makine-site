import { describe, expect, it } from 'vitest';
import { extOf, isSameOrInside, nextFreeName, splitExt, validateName } from './names.ts';

describe('validateName', () => {
  it('normal adlara izin verir', () => {
    expect(validateName('Ödev notları.txt')).toBeNull();
    expect(validateName('Resim (2).png')).toBeNull();
  });

  it('geçersiz adları reddeder', () => {
    expect(validateName('   ')).toBe('files.err.empty');
    expect(validateName('a/b')).toBe('files.err.chars');
    expect(validateName('saat:12')).toBe('files.err.chars');
    expect(validateName('soru?')).toBe('files.err.chars');
    expect(validateName('.gizli')).toBe('files.err.dot');
    expect(validateName('noktayla.')).toBe('files.err.chars');
    expect(validateName('CON')).toBe('files.err.reserved');
    expect(validateName('nul.txt')).toBe('files.err.reserved');
    expect(validateName('a'.repeat(201))).toBe('files.err.long');
  });
});

describe('splitExt / extOf', () => {
  it('uzantıyı ayırır', () => {
    expect(splitExt('rapor.final.pdf')).toEqual(['rapor.final', '.pdf']);
    expect(splitExt('klasör')).toEqual(['klasör', '']);
    expect(extOf('FOTO.JPG')).toBe('jpg');
  });
});

describe('nextFreeName', () => {
  it('ad boşsa aynen verir, doluysa numara ekler', () => {
    expect(nextFreeName(['a.txt'], 'b.txt')).toBe('b.txt');
    expect(nextFreeName(['a.txt'], 'a.txt')).toBe('a (2).txt');
    expect(nextFreeName(['a.txt', 'a (2).txt'], 'a.txt')).toBe('a (3).txt');
    expect(nextFreeName(['Klasör'], 'klasör')).toBe('klasör (2)');
    expect(nextFreeName(['a.txt', 'a (2).txt'], 'a (2).txt')).toBe('a (3).txt');
  });
});

describe('isSameOrInside', () => {
  it('bir yolun diğerinin içinde olup olmadığını bilir', () => {
    expect(isSameOrInside(['a', 'b'], ['a'])).toBe(true);
    expect(isSameOrInside(['a'], ['a'])).toBe(true);
    expect(isSameOrInside(['ab'], ['a'])).toBe(false);
    expect(isSameOrInside(['a'], ['a', 'b'])).toBe(false);
  });
});
