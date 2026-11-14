// Arayüz metinleri. Yeni metin eklerken önce Türkçeye, sonra İngilizceye ekle;
// TypeScript iki dilde de aynı anahtarların olmasını zorunlu tutar.
// {isim} biçimindeki yer tutucular t('anahtar', { isim: değer }) ile doldurulur.

export const tr = {
  'boot.loading': 'VirtualMOS başlatılıyor…',
  'desktop.label': 'Masaüstü',

  // Uygulama adları
  'app.about': 'Hakkında',
  'app.files': 'Dosyalar',
  'app.editor': 'Metin Düzenleyici',
  'app.calculator': 'Hesap Makinesi',
  'app.paint': 'Çizim',
  'app.photos': 'Fotoğraflar',
  'app.terminal': 'Terminal',
  'app.browser': 'Tarayıcı',
  'app.settings': 'Ayarlar',
  'app.mehburmc': 'MehburMC Launcher',

  // Panel
  'panel.label': 'Panel',
  'panel.running': 'açık',
  'panel.windows': '{count} pencere',
  'panel.notifications': 'Bildirimler',
  'panel.notificationsUnread': 'Bildirimler ({count} okunmamış)',
  'panel.quickSettings': 'Hızlı ayarlar',
  'panel.clock': 'Saat ve takvim',

  // Uygulama menüsü
  'menu.open': 'Uygulama menüsü',
  'menu.search': 'Uygulama ara',
  'menu.noResults': 'Sonuç bulunamadı',
  'menu.restart': 'Yeniden başlat',

  // Hızlı ayarlar
  'quick.language': 'Dil',
  'quick.languageValue': 'Türkçe',
  'quick.darkTheme': 'Koyu tema',
  'quick.on': 'Açık',
  'quick.off': 'Kapalı',
  'quick.fullscreen': 'Tam ekran',
  'quick.showDesktop': 'Masaüstünü göster',

  // Bildirimler
  'notif.title': 'Bildirimler',
  'notif.empty': 'Yeni bildirim yok',
  'notif.clear': 'Tümünü temizle',
  'notif.dismiss': 'Bildirimi kapat',
  'notif.welcome.title': "VirtualMOS'a hoş geldin",
  'notif.welcome.body':
    'Uygulamalar sol alttaki menüde. Klavye kısayolları ve dokunmatik ipuçları Hakkında uygulamasında.',

  // Takvim
  'calendar.prev': 'Önceki ay',
  'calendar.next': 'Sonraki ay',
  'calendar.today': 'Bugüne dön',

  // Pencere
  'window.minimize': 'Küçült',
  'window.maximize': 'Büyüt',
  'window.restore': 'Önceki boyut',
  'window.close': 'Kapat',
  'window.split': 'Yan yana yerleştir',

  // Masaüstü sağ tık menüsü
  'ctx.label': 'Masaüstü menüsü',
  'ctx.fullscreen': 'Tam ekran',
  'ctx.exitFullscreen': 'Tam ekrandan çık',
  'ctx.about': 'VirtualMOS hakkında',

  // Henüz eklenmemiş uygulamalar
  'comingSoon.title': '{app} yakında',
  'comingSoon.body': 'Bu uygulama yol haritasının {phase}. fazında eklenecek.',

  // Hakkında
  'about.desc': 'MehburOS temalı, tarayıcıda çalışan sanal masaüstü.',
  'about.dev': 'Geliştirme sürümü — uygulamalar fazlar hâlinde ekleniyor.',
  'about.keyboard': 'Klavye kısayolları',
  'about.touch': 'Dokunmatik ekranda',
  'about.links': 'Bağlantılar',
  'about.source': 'Kaynak kodu',
  'about.roadmap': 'Yol haritası',
  'about.site': 'Mehbur07',
  'shortcut.menu': 'Uygulama menüsünü aç / kapat',
  'shortcut.close': 'Etkin pencereyi kapat',
  'shortcut.max': 'Büyüt / önceki boyut',
  'shortcut.snap': 'Pencereyi sola / sağa yasla',
  'shortcut.min': 'Etkin pencereyi küçült',
  'shortcut.desktop': 'Masaüstünü göster',
  'shortcut.esc': 'Açık menüyü kapat',
  'touch.split':
    'Pencereyi başlığından ekranın sol ya da sağ kenarına sürükle: iki uygulama yan yana.',
  'touch.max': 'Başlığa iki kez dokun: büyüt ya da eski boyutuna döndür.',
  'touch.menu': 'Masaüstüne uzun bas: masaüstü menüsü.',
};

export type MessageKey = keyof typeof tr;
export type Messages = Record<MessageKey, string>;

export const en: Messages = {
  'boot.loading': 'Starting VirtualMOS…',
  'desktop.label': 'Desktop',

  'app.about': 'About',
  'app.files': 'Files',
  'app.editor': 'Text Editor',
  'app.calculator': 'Calculator',
  'app.paint': 'Paint',
  'app.photos': 'Photos',
  'app.terminal': 'Terminal',
  'app.browser': 'Browser',
  'app.settings': 'Settings',
  'app.mehburmc': 'MehburMC Launcher',

  'panel.label': 'Panel',
  'panel.running': 'open',
  'panel.windows': '{count} windows',
  'panel.notifications': 'Notifications',
  'panel.notificationsUnread': 'Notifications ({count} unread)',
  'panel.quickSettings': 'Quick settings',
  'panel.clock': 'Clock and calendar',

  'menu.open': 'App menu',
  'menu.search': 'Search apps',
  'menu.noResults': 'No results',
  'menu.restart': 'Restart',

  'quick.language': 'Language',
  'quick.languageValue': 'English',
  'quick.darkTheme': 'Dark theme',
  'quick.on': 'On',
  'quick.off': 'Off',
  'quick.fullscreen': 'Full screen',
  'quick.showDesktop': 'Show desktop',

  'notif.title': 'Notifications',
  'notif.empty': 'No new notifications',
  'notif.clear': 'Clear all',
  'notif.dismiss': 'Dismiss notification',
  'notif.welcome.title': 'Welcome to VirtualMOS',
  'notif.welcome.body':
    'Apps are in the menu at the bottom left. Keyboard shortcuts and touch tips are in the About app.',

  'calendar.prev': 'Previous month',
  'calendar.next': 'Next month',
  'calendar.today': 'Back to today',

  'window.minimize': 'Minimize',
  'window.maximize': 'Maximize',
  'window.restore': 'Restore',
  'window.close': 'Close',
  'window.split': 'Place side by side',

  'ctx.label': 'Desktop menu',
  'ctx.fullscreen': 'Full screen',
  'ctx.exitFullscreen': 'Exit full screen',
  'ctx.about': 'About VirtualMOS',

  'comingSoon.title': '{app} is coming soon',
  'comingSoon.body': 'This app arrives in phase {phase} of the roadmap.',

  'about.desc': 'A MehburOS-themed virtual desktop that runs in your browser.',
  'about.dev': 'Development build — apps are being added phase by phase.',
  'about.keyboard': 'Keyboard shortcuts',
  'about.touch': 'On a touch screen',
  'about.links': 'Links',
  'about.source': 'Source code',
  'about.roadmap': 'Roadmap',
  'about.site': 'Mehbur07',
  'shortcut.menu': 'Open / close the app menu',
  'shortcut.close': 'Close the active window',
  'shortcut.max': 'Maximize / restore',
  'shortcut.snap': 'Snap the window left / right',
  'shortcut.min': 'Minimize the active window',
  'shortcut.desktop': 'Show desktop',
  'shortcut.esc': 'Close the open menu',
  'touch.split': 'Drag a window by its title to the left or right edge: two apps side by side.',
  'touch.max': 'Double-tap the title: maximize or restore.',
  'touch.menu': 'Long-press the desktop: desktop menu.',
};

export const messages = { tr, en } as const;
