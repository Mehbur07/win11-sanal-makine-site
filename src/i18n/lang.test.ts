import { describe, expect, it } from 'vitest';
import { detectLang, readSavedLang, saveLang } from './lang.ts';
import { en, tr } from './messages.ts';

describe('detectLang', () => {
  it('kayıtlı dil varsa onu kullanır', () => {
    expect(detectLang('en', 'tr-TR')).toBe('en');
    expect(detectLang('tr', 'en-US')).toBe('tr');
  });

  it('kayıt yoksa tarayıcı diline bakar', () => {
    expect(detectLang(null, 'tr-TR')).toBe('tr');
    expect(detectLang(null, 'en-GB')).toBe('en');
    expect(detectLang(null, 'de-DE')).toBe('en');
  });

  it('geçersiz kayıt ve bilinmeyen tarayıcı dilinde Türkçeye düşer', () => {
    expect(detectLang('fr', 'tr')).toBe('tr');
    expect(detectLang(null, undefined)).toBe('tr');
  });
});

describe('dil kaydı', () => {
  it('seçilen dili kaydedip geri okur', () => {
    saveLang('en');
    expect(readSavedLang()).toBe('en');
  });
});

describe('metinler', () => {
  it('Türkçe ve İngilizcede aynı anahtarlar var ve hiçbiri boş değil', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
    for (const text of [...Object.values(tr), ...Object.values(en)]) {
      expect(text.trim()).not.toBe('');
    }
  });
});
