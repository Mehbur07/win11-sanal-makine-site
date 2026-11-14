// Arayüz metinleri. Yeni metin eklerken önce Türkçeye, sonra İngilizceye ekle;
// TypeScript iki dilde de aynı anahtarların olmasını zorunlu tutar.

export const tr = {
  'boot.loading': 'VirtualMOS başlatılıyor…',
  'desktop.label': 'Masaüstü',
  'desktop.notice': 'Masaüstü hazır — pencereler ve uygulamalar yakında geliyor.',
  'lang.switch': 'Switch to English',
  'lang.short': 'EN',
};

export type MessageKey = keyof typeof tr;
export type Messages = Record<MessageKey, string>;

export const en: Messages = {
  'boot.loading': 'Starting VirtualMOS…',
  'desktop.label': 'Desktop',
  'desktop.notice': 'Desktop ready — windows and apps are coming soon.',
  'lang.switch': 'Türkçeye geç',
  'lang.short': 'TR',
};

export const messages = { tr, en } as const;
