# VirtualMOS

<img src="public/brand/mehburos-icon-256.png" alt="MehburOS logosu" width="96">

MehburOS temalı, tarayıcıda çalışan sanal masaüstü. Kurulum gerektirmeden bilgisayarda, tablette ve telefonda açılır.

🔗 **Adres:** https://virtualmos.github.io/

> 🚧 **Durum:** Faz 3 tamamlandı: masaüstü kabuğu + Dosyalar uygulaması ve cihaza kaydetme.
> Diğer uygulamalar sonraki fazlarda geliyor. Plan için: [yol haritası](docs/yol-haritasi.md).

## Dosyalar nerede saklanır?

Pencereler ve uygulamalar tamamen sitede çalışır; oluşturduğun dosyalar ise cihazına yazılır. İlk açılışta sorulur, sonradan **Dosyalar → Konumu değiştir** ile değiştirilebilir (eski yerdeki dosyalar yeni yere kopyalanır).

| Seçenek | Nasıl çalışır | Tarayıcılar |
|---|---|---|
| 📁 **Cihazımda klasör** | Seçtiğin yerde (ör. Belgeler) `VirtualMOS` adlı gerçek bir klasör oluşturulur; dosyalar cihazın dosya yöneticisinde de görünür | Chrome, Edge, Opera (bilgisayar), Android Chrome |
| 🌐 **Tarayıcıda** | Dosyalar bu cihazda, tarayıcının siteye ayırdığı alanda (OPFS, yoksa IndexedDB) durur; **İndir** ile cihaza alınır | Tüm modern tarayıcılar (iPhone/iPad ve Firefox dahil) |

- Tarayıcı klasör iznini unutursa açılışta **İzin ver** penceresi çıkar.
- Silinen öğeler `.trash` adlı gizli klasöre (Çöp Kutusu) gider; oradan geri yüklenebilir.
- Eski **Win11 Web** dosyaların için: Dosyalar → **Win11 Web'den aktar** → eski `Win11 Web` klasörünü seç.

## Kullanım ipuçları

| Nerede | Ne yapılır |
|---|---|
| Bilgisayar | Pencereyi başlığından ekranın sol/sağ kenarına sürükle → yarım ekran; üst kenara → tam ekran. Masaüstüne sağ tık → menü |
| Tablet | Aynı sürükleme dokunmatikle de çalışır; pencere başlığındaki **yan yana** düğmesi sola/sağa yaslar |
| Telefon | Uygulamalar tam ekran açılır; masaüstü ana ekran gibi tüm uygulamaları gösterir |
| Klavye | `Alt+M` menü, `Alt+Q` kapat, `Alt+↑` büyüt, `Alt+←/→` yasla, `Alt+↓` küçült, `Alt+D` masaüstü, `Esc` menüyü kapat |

## Neler olacak?

- MehburOS'un neon camgöbeği–siyah temasında masaüstü: pencereler, alt panel, uygulama menüsü, bildirimler
- Dokunmatik dostu arayüz: tablet modu (iki uygulama yan yana) ve telefon modu
- Dosyaların cihazda gerçek bir klasöre kaydedilmesi (desteklemeyen tarayıcılarda tarayıcı depolaması)
- Uygulamalar: Dosyalar, metin düzenleyici, hesap makinesi, çizim, fotoğraflar, terminal, tarayıcı, ayarlar ve MehburMC Launcher demosu
- Türkçe ve İngilizce

## Geliştirme

Gerekenler: [Node.js](https://nodejs.org/) 22 veya üstü ve [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/virtualmos/virtualmos.github.io.git
cd virtualmos.github.io
pnpm install
pnpm dev          # geliştirme sunucusu: http://localhost:5173
```

| Komut | Ne yapar |
|---|---|
| `pnpm dev` | Geliştirme sunucusunu açar; dosya kaydedince sayfa kendiliğinden yenilenir |
| `pnpm build` | Tip kontrolü yapar ve yayınlanacak dosyaları `dist/` klasörüne üretir |
| `pnpm preview` | `dist/` klasöründeki derlenmiş siteyi yerelde açar |
| `pnpm lint` | Kod hatalarını ve kötü alışkanlıkları ESLint ile arar |
| `pnpm format` | Kodu Prettier ile düzenli biçime sokar |
| `pnpm test` | Birim testleri çalıştırır (Vitest) |
| `pnpm test:e2e` | Siteyi gerçek tarayıcıda bilgisayar, tablet ve telefon boyutlarında test eder (Playwright). İlk seferde `pnpm exec playwright install chromium` gerekir |
| `pnpm check` | Lint + biçim + tip + birim test, hepsi bir arada |

## Yayınlama

Elle bir şey yapmaya gerek yok. GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)):

- **Her PR'da:** lint, biçim, birim test, derleme ve tarayıcı testlerini çalıştırır.
- **main'e merge edilince:** aynı kontrollerden geçerse siteyi GitHub Pages'e yayınlar.

## Dosya yapısı

| Yol | Açıklama |
|---|---|
| `index.html` | Sayfanın giriş noktası |
| `src/main.tsx` | Uygulamayı başlatır |
| `src/App.tsx` | Açılış ekranı → masaüstü geçişi, yeniden başlatma |
| `src/shell/` | Masaüstü kabuğu: açılış ekranı, masaüstü, simgeler, sağ tık menüsü, cihaz modu (`device.ts`) |
| `src/shell/wm/` | Pencere yöneticisi: durum (`reducer.ts`), konum hesapları (`geometry.ts`), pencere bileşeni |
| `src/shell/panel/` | Alt panel, uygulama menüsü, hızlı ayarlar, takvim |
| `src/shell/notifications/` | Bildirimler ve köşede beliren bildirim kutuları |
| `src/apps/` | Uygulamalar ve uygulama listesi (`registry.ts`) |
| `src/apps/files/` | Dosyalar uygulaması |
| `src/storage/` | Depolama katmanı: cihaz klasörü/OPFS (`handleBackend.ts`), IndexedDB/bellek (`recordBackend.ts`), dosya işlemleri (`fileOps.ts`), yer seçimi (`manager.ts`) |
| `src/shell/dialog/` | Soru ve onay pencereleri |
| `src/settings/` | Tema (açık/koyu) seçimi |
| `src/i18n/` | Türkçe/İngilizce metinler ve dil seçimi |
| `src/styles/tokens.css` | Tema renkleri ve ölçüleri (MehburOS renkleri) |
| `src/assets/wallpapers/` | Duvar kâğıtları (16:9 ve 4:3, WebP) |
| `public/` | Olduğu gibi kopyalanan dosyalar: logo, 404 sayfası |
| `e2e/` | Tarayıcı testleri (Playwright) |
| `docs/yol-haritasi.md` | Kararlar ve fazlar |

## Kullanılan teknolojiler

- [Vite](https://vite.dev/): geliştirme sunucusu ve derleme
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Lucide](https://lucide.dev/) simgeleri
- ESLint + Prettier, Vitest + Testing Library, Playwright
- GitHub Actions + GitHub Pages

## Eski sürüm (Win11 Web)

Bu proje önce **Win11 Web** adıyla, Windows 11 görünümlü bir simülasyon olarak yayınlanmıştı. Son hali `v0.1.0-win11` etiketinde duruyor:

```bash
git checkout v0.1.0-win11
python -m http.server 8000   # ardından http://localhost:8000
```
