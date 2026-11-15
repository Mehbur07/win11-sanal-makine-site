import { describe, expect, it } from 'vitest';
import { HOME, toUrl } from './url.ts';

describe('toUrl', () => {
  it('adresleri tamamlar', () => {
    expect(toUrl('mehbur07.github.io')).toBe('https://mehbur07.github.io/');
    expect(toUrl('https://ornek.com/a?b=1')).toBe('https://ornek.com/a?b=1');
    expect(toUrl('http://localhost:4173/x')).toBe('http://localhost:4173/x');
  });

  it('adres gibi görünmeyen yazıyı Google araması yapar', () => {
    expect(toUrl('hava durumu')).toBe('https://www.google.com/search?igu=1&q=hava%20durumu');
  });

  it('tehlikeli adresleri asla açmaz', () => {
    expect(toUrl('javascript:alert(1)')).toMatch(/^https:\/\/www\.google\.com\/search/);
    expect(toUrl('data:text/html,<b>x</b>')).toMatch(/^https:\/\/www\.google\.com\/search/);
    expect(toUrl('file:///C:/')).toMatch(/^https:\/\/www\.google\.com\/search/);
  });

  it('boş yazı başlangıç sayfasıdır', () => {
    expect(toUrl('  ')).toBe(HOME);
  });
});
