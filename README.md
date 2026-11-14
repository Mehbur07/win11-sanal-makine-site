# VirtualMOS

<img src="assets/brand/mehburos-icon-256.png" alt="MehburOS logosu" width="96">

MehburOS temalı, tarayıcıda çalışan sanal masaüstü. Kurulum gerektirmeden bilgisayarda, tablette ve telefonda açılır.

🔗 **Adres:** https://virtualmos.github.io/

> 🚧 **Durum:** Yeniden yazılıyor. Şu an sitede geçici bir "yakında" sayfası var.
> Plan, kararlar ve fazlar için: [yol haritası](docs/yol-haritasi.md).

## Neler olacak?

- MehburOS'un neon camgöbeği–siyah temasında masaüstü: pencereler, alt panel, uygulama menüsü, bildirimler
- Dokunmatik dostu arayüz: tablet modu (iki uygulama yan yana) ve telefon modu
- Dosyaların cihazda gerçek bir klasöre kaydedilmesi (desteklemeyen tarayıcılarda tarayıcı depolaması)
- Uygulamalar: Dosyalar, metin düzenleyici, hesap makinesi, çizim, fotoğraflar, terminal, tarayıcı, ayarlar ve MehburMC Launcher demosu
- Türkçe ve İngilizce

## Eski sürüm (Win11 Web)

Bu proje önce **Win11 Web** adıyla, Windows 11 görünümlü bir simülasyon olarak yayınlanmıştı. Son hali git etiketinde saklanıyor:

```bash
git clone https://github.com/virtualmos/virtualmos.github.io.git
cd virtualmos.github.io
git checkout v0.1.0-win11
python -m http.server 8000   # ardından http://localhost:8000
```

## Dosya yapısı (şu an)

| Dosya | Açıklama |
|---|---|
| `index.html` | Geçici "yakında" sayfası (TR/EN) |
| `404.html` | Geçici hata sayfası |
| `assets/brand/` | MehburOS logosu |
| `docs/yol-haritasi.md` | Kararlar ve fazlar |

## Teknolojiler (planlanan)

Vite + React + TypeScript, pnpm, ESLint + Prettier, Vitest, Playwright, GitHub Actions ile GitHub Pages yayını.
