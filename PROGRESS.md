# PROGRESS

### [2026-11-16 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Faz 7 (`feature/phase-7-release`): sürüm 1.0.0. `package.json` sürümü `vite.config.ts` → `define` ile `__APP_VERSION__` olarak koda giriyor (tip: `src/env.d.ts`); "Hakkında"da "Sürüm 1.0.0" (`about.version`, eski `about.dev` kaldırıldı)
  - README: "yapım aşamasında" notu yerine sürüm, ekran görüntüsü (`docs/ekran-goruntusu.jpg`, 1280×760) ve Özellikler listesi; CHANGELOG'da birikenler `[1.0.0] - 2026-11-16` altına taşındı
  - m07-site (ayrı repo, henüz yüklenmedi): VirtualMOS kartı "Hazır Projeler"e taşındı (Siteye Git + Kaynak Kodu, logo `mehburos.jpg`, TR/EN), sayaç "9 hazır · 6 geliştiriliyor"
  - Google Safe Browsing (şeffaflık raporu API'si): virtualmos.github.io için hiçbir uyarı işareti yok, durum "veri yok" (yeni site); SmartScreen kullanıcı tarafından Edge'de denenecek
- **Son Commit:** 6bf4ad1 Merge pull request #11 from virtualmos/feature/phase-6-polish
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Faz 7 tamamlandı: `v1.0.0` etiketi + GitHub Release atıldı, m07-site kartı yayında (m07-site PR #31), Edge SmartScreen uyarı vermedi. Faz 6 gerçek cihaz testleri de kullanıcı tarafından yapıldı, hata yok; tüm fazlar tamam. Sırada yeni bir iş yok, kullanıcının yeni isteği beklenir
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - m07-site'ta `assets/img/win11web.svg` artık kullanılmıyor (silmek onay ister); kullanıcının `assets/img/projeler/` klasörüne dokunulmadı
  - Repo açıklamasındaki "(yeniden yazılıyor)" ifadesi sürüm 1.0.0 ile kaldırıldı

### [2026-11-16 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Faz 6 (`feature/phase-6-polish`): PWA — `public/manifest.webmanifest`, simgeler 192/512 + maskable (kaynak: `mehburos/assets/branding/mehburos-icon-512.png`). Ek kütüphane yok: `src/pwa/sw-template.js` + `vite-pwa-plugin.ts` derlemede `dist/sw.js` üretiyor (dosya listesi + içerikten hesaplanan sürüm); yalnızca aynı sitedeki ve listedeki dosyalar önbellekten, GitHub API ve dış siteler karışılmıyor
  - Güncelleme kendiliğinden uygulanmıyor: "Yeni sürüm hazır" bildirimi (yeni `sticky` + `action` seçenekleri) → Yenile → `skip-waiting` → sayfa yenilenir, eski önbellek silinir (elle doğrulandı)
  - Performans: uygulamalar `React.lazy` ile ihtiyaç anında yükleniyor (`registry.ts` → `load()`), pencere içi `AppBody.tsx` yükleniyor/yüklenemedi ekranı; ilk paket 398 → 293 KB (gzip 123 → 93 KB)
  - Erişilebilirlik: `@axe-core/playwright` (yalnızca test) ile WCAG 2.2 AA taraması `e2e/a11y.spec.ts`; düzeltilen bulgular: saat ve bildirim düğmesi adları (parantez kullanılmıyor, axe parantez içini yok sayıyor), CE tuşu adı, başlangıç sayfasında href'siz bağlantı → devre dışı düğme
  - Playwright'ta service worker varsayılan kapalı (`serviceWorkers: 'block'`), yalnızca `e2e/pwa.spec.ts` açıyor; testler: 108 birim, Playwright 97 geçti / 32 cihaza özel atlandı
- **Son Commit:** e6ff159 Merge pull request #10 from virtualmos/feature/phase-5-launcher
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Kullanıcı gerçek cihazlarda `docs/cihaz-testi.md` listesini dener; bulgular düzeltilince yol haritasındaki son Faz 6 kutusu işaretlenir. Faz 7, kullanıcı "başla" deyince
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - Gerçek cihaz testleri yapılmadı (özellikle iPad Safari'de ana ekrana ekleme ve internetsiz açılış)
  - Güncelleme akışının otomatik testi yok (iki ayrı derleme gerektiriyor); elle doğrulandı
  - Uygulama kodu yüklenemezse (internetsiz ve önbellek yokken) pencerede "Sayfayı yenile" çıkıyor; aynı pencerede tekrar deneme yok
  - `ComingSoon` bileşeni hâlâ kullanılmıyor; `pnpm audit` / Dependabot: minimatch (yalnızca ESLint içinde) orta seviye
  - Kullanıcı "başla" demeden bir sonraki faza geçilmeyecek

### [2026-11-16 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Faz 4 (`feature/phase-4-apps`, PR #9 merge edildi): Metin Düzenleyici, Hesap Makinesi, Çizim, Fotoğraflar, Terminal, Tarayıcı, Ayarlar (depolama konumu dahil). CI'da çıkan iki hata düzeltildi: Terminal artık meşgulken basılan Enter'ı düşürmüyor, komutlar sıraya giriyor; Dosyalar testindeki belirsiz seçici konum çubuğuna daraltıldı. Tablette Kapat düğmesi köşe tutamağının üstüne alındı
  - Faz 5 (`feature/phase-5-launcher`): MehburMC Launcher demosu `src/apps/launcher/`; gerçek launcher'ın menü sırası ve renkleri (`.mmc` altında, her zaman koyu, vurgu #00f0ff). Demo sayfaları: Ana sayfa, Profiller, Hesaplar, Launcher'ı edin, Yenilikler; diğerleri kilitli
  - Sürüm bilgisi `Mehbur07/MehburMC-Launcher` GitHub Releases API'sinden; localStorage önbelleği 10 dk (`vmos:mmc:releases`), hata olursa eski önbellek, o da yoksa releases sayfasına bağlantı. Windows `_x64-setup.exe` normal sürümde, Linux `_amd64.deb` ayrı `-linux` sürümünde; yalnızca `https://github.com/` bağlantıları kabul ediliyor
  - Profiller `vmos:mmc:profiles` içinde; sürüm notları HTML basılmadan kendi küçük okuyucumuzla (`notes.ts`) gösteriliyor
  - Testler: 108 birim test; Playwright 69 geçti / 18 cihaza özel atlandı (launcher testlerinde GitHub API taklit ediliyor)
- **Son Commit:** 05274c9 Merge pull request #9 from virtualmos/feature/phase-4-apps
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Kullanıcı "başla" deyince Faz 6 (PWA/çevrimdışı, performans ve erişilebilirlik denetimi, gerçek cihaz testleri)
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - GitHub API oturumsuz kullanımda saatte 60 istekle sınırlı; önbellek bunu karşılıyor, sınır aşılırsa launcher GitHub sayfasına bağlantı gösteriyor
  - `ComingSoon` bileşeni artık hiçbir uygulamada kullanılmıyor (ileride silinebilir)
  - Tablette pencerenin sağ üst köşesinden boyutlandırma alanı Kapat düğmesi yüzünden biraz küçüldü
  - `pnpm audit` / Dependabot: minimatch (yalnızca ESLint içinde) orta seviye bulgu devam ediyor
  - Kullanıcı "başla" demeden bir sonraki faza geçilmeyecek

### [2026-11-14 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Faz 3 (`feature/phase-3-storage-files`): depolama katmanı `src/storage/` — `StorageBackend` arayüzü; `HandleBackend` (cihaz klasörü + OPFS), `RecordBackend` (IndexedDB + bellek, içerik ArrayBuffer olarak); üst düzey işlemler `fileOps.ts`
  - Cihaz klasörü: seçilen yerde `VirtualMOS` klasörü (seçilen klasörün adı zaten VirtualMOS ise o kullanılır); tutamak `vmos-kv` IndexedDB'de; tercih `vmos:storage`
  - Çöp kutusu `.trash/<kimlik>/<öğe>` + `.meta.json` (eski yol); '.' ile başlayan adlar gizli ve yasak
  - Konum değişince `mergeInto` ile eksik dosyalar yeni yere kopyalanıyor (var olanların üzerine yazılmıyor)
  - Dosyalar uygulaması + önizleme + ortak diyaloglar (`src/shell/dialog/`); dar pencerede container query ile sade düzen
  - Yeni dev bağımlılık: `fake-indexeddb` (yalnızca testler); testler: 72 birim, Playwright 35 geçti / 13 cihaza özel atlandı
- **Son Commit:** 411568e Merge pull request #7 from virtualmos/feature/phase-2-desktop-shell
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Kullanıcı "başla" deyince Faz 4 (metin düzenleyici, hesap makinesi, çizim, fotoğraflar, terminal, tarayıcı, ayarlar — Ayarlar'a depolama konumu da taşınacak)
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - Gerçek klasör seçme penceresi otomatik testte açılamıyor; testte OPFS klasörüyle taklit ediliyor. Gerçek cihazda (Chrome PC, Android Chrome) elle denenmeli
  - Klasör indirme (zip) yok; yalnızca dosyalar indiriliyor
  - Taşıma/yeniden adlandırma kopyala+sil ile yapılıyor; çok büyük klasörlerde yavaş olabilir
  - `pnpm audit`: minimatch (yalnızca ESLint içinde) orta seviye bulgu devam ediyor
  - Kullanıcı "başla" demeden bir sonraki faza geçilmeyecek

### [2026-11-14 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Faz 2 (`feature/phase-2-desktop-shell`): pencere yöneticisi (reducer + saf geometri fonksiyonları, sürükle/boyutlandır/yasla/önizleme, çift tık/dokunuşla büyüt), alt panel, aramalı uygulama menüsü, bildirimler + köşe bildirimleri, saat/takvim, hızlı ayarlar, sağ tık/uzun basma menüsü, masaüstü simgeleri
  - Cihaz modu `device.ts`: kısa kenar < 600 px → telefon, dokunmatik → tablet, değilse bilgisayar; tablette "yan yana" düğmesi, telefonda tam ekran uygulamalar ve ana ekran ızgarası
  - Açık tema eklendi (`vmos:theme`); uygulama simgeleri iki temada da koyu neon kare
  - Henüz yazılmamış 9 uygulama `ComingSoon` penceresi açıyor (`registry.ts` → `comingInPhase`); gerçek uygulama: Hakkında
  - Yeni bağımlılık: `lucide-react` (simgeler); MehburMC logosu `public/brand/mehburmc-128.webp`
  - Testler: 40 birim test, 33 Playwright testi (6'sı cihaza özel olduğu için diğer cihazlarda atlanıyor)
- **Son Commit:** 10ec855 Merge pull request #6 from virtualmos/feature/phase-1-skeleton
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Kullanıcı "başla" deyince Faz 3 (depolama katmanı + Dosyalar uygulaması)
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - Gerçek dokunmatik cihazlarda (Android tablet, iPad) sürükleme ve uzun basma elle denenmeli; iPhone Safari tam ekranı desteklemediği için o düğme orada gizli
  - Klavye kısayolları Alt tabanlı; Mac'te Option tuşu
  - `pnpm audit`: minimatch (yalnızca ESLint içinde) orta seviye bulgu devam ediyor
  - Kullanıcı "başla" demeden bir sonraki faza geçilmeyecek

### [2026-11-14 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Faz 1 (`feature/phase-1-skeleton`): Vite 8 + React 19 + TypeScript 6.0 + pnpm 12 iskeleti; eski "yakında" sayfası yerini uygulamaya bıraktı, logo ve 404 `public/` altına taşındı
  - TypeScript 7 yerine 6.0 seçildi: typescript-eslint henüz `<6.1` destekliyor
  - Kalite: ESLint 10 + Prettier, Vitest (7 birim test), Playwright (3 senaryo × pc/tablet/telefon = 9 test)
  - GitHub Actions `ci.yml`: PR'da kontrol+test, main'de test geçince Pages'e yayın; Pages kaynağı "GitHub Actions" yapıldı
  - Açılış animasyonu (1,8 sn; hareket azaltma tercihinde 0,3 sn) → MehburOS duvar kâğıtlı masaüstü, TR/EN düğmesi (`vmos:lang`)
- **Son Commit:** 6f45b06 Merge pull request #5 from virtualmos/chore/virtualmos-coming-soon
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Kullanıcı "başla" deyince Faz 2 (pencere yöneticisi, alt panel, uygulama menüsü, tablet/telefon modları)
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - `pnpm audit`: 1 orta seviye bulgu (minimatch, yalnızca ESLint'in içinde, siteye girmiyor); düzeltmesi minimatch 11'de, ESLint güncellenince çözülecek
  - Masaüstündeki dil düğmesi ve "yakında" yazısı geçici; Faz 2'de panele/Ayarlar'a taşınacak
  - Kullanıcı "başla" demeden bir sonraki faza geçilmeyecek

### [2026-11-14 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Faz 0: eski kod `v0.1.0-win11` etiketiyle saklandı; kullanıcı onayıyla repo `virtualmos` organizasyonuna taşındı, adı `virtualmos.github.io` oldu; local origin yeni adrese çevrildi
  - Pages, branch koruması (ruleset) ve Dependabot taşımayla korundu; repo açıklaması ve konu etiketleri güncellendi
  - `chore/virtualmos-coming-soon`: eski site dosyaları silindi, MehburOS logolu TR/EN "yakında" sayfası ve sade 404 eklendi; CHANGELOG'da eski içerik `[0.1.0-win11]` başlığına taşındı
  - Kararlar: MehburMC Launcher = arayüz demosu; logo = MehburOS logosu; eski dosyalar cihaz klasörüyle elle aktarılacak
- **Son Commit:** bcadb71 Merge pull request #4 from Mehbur07/docs/virtualmos-roadmap
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Kullanıcı "başla" deyince Faz 1 (Vite + React + TypeScript + pnpm iskeleti, lint/test, GitHub Actions ile yayın)
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - Bilgisayardaki proje klasörünün adı hâlâ `win11-sanal-makine-site` (oturum/hafıza yolları bozulmasın diye değiştirilmedi)
  - Faz 1'de yayın GitHub Actions'a geçince Pages kaynağı "GitHub Actions" olarak değiştirilmeli
  - Kullanıcı "başla" demeden bir sonraki faza geçilmeyecek

### [2026-11-14 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Proje baştan yazılacak: ad **VirtualMOS**, MehburOS teması (neon camgöbeği + siyah), giriş ekranı yok, adres `virtualmos.github.io`
  - Teknik karar: Vite + React + TypeScript + pnpm; ESLint/Prettier, Vitest, Playwright, GitHub Actions
  - Cihaz önceliği %45 PC / %45 tablet / %10 telefon; TR + EN; cihaz klasörüne kaydetme kalıyor; yeni uygulama MehburMC Launcher
  - `docs/virtualmos-roadmap`: 8 fazlık yol haritası `docs/yol-haritasi.md`
- **Son Commit:** 22bb5f3 Merge pull request #3 from Mehbur07/fix/smartscreen-false-positive
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Kullanıcı "başla" deyince Faz 0: açık soruları sor, `virtualmos` organizasyonunun açılmasını iste, repoyu (onayla) taşı ve yeniden adlandır
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - Kullanıcı açıkça "başla" demeden yeniden yazıma başlanmayacak
  - Repo taşıma (transfer) onay gerektiren işlem

### [2026-11-14 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Microsoft Defender SmartScreen siteyi "kimlik avı (phishing)" diye işaretledi; sitede şifre alanı yok, büyük olasılıkla Windows logosuna ve oturum açma ekranına benzerlik yüzünden yanlış alarm
  - `fix/smartscreen-false-positive`: dört kareli logo (favicon, açılış, Başlat düğmesi, 404) kendi "pencere" simgemizle değiştirildi
  - Kilit ekranındaki "Oturum aç" düğmesi "Masaüstünü aç" oldu; 404 metninde "Windows" yerine "Win11 Web" yazıyor
- **Son Commit:** 848c0bc Merge pull request #2 from Mehbur07/feature/404-page
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** SmartScreen uyarı sayfasından "Bu sitenin tehdit içermediğini bildir" ile yanlış alarm bildirimi yapmak ve birkaç gün sonra uyarının kalkıp kalkmadığını kontrol etmek
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - Yeni özellik eklerken Microsoft logosu, Microsoft hesabı girişi veya şifre/PIN kutusu gibi gerçek giriş ekranını taklit eden öğeler eklenmemeli (yeniden işaretlenme riski)

### [2026-11-11 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - `feature/404-page`: kök dizine bağımsız `404.html` (GitHub Pages proje sitesi için kendi 404'ünü kullanır)
  - Yapı mehpix.github.io'nun 404'ünden alındı (parlayan büyük 404, başlık, açıklama, ana düğme, öneri düğmeleri, kenarda kaybolan ızgara); görünüm Win11 hata penceresi + görev çubuğu
  - Tema/vurgu/duvar kâğıdı `w11:settings` localStorage'dan okunuyor; bulunamayan yol `C:\Win11 Web\...` olarak textContent ile gösteriliyor
  - Sayfa her derinlikte açılabildiği için tüm bağlantılar tam yol (`/win11-sanal-makine-site/`)
- **Son Commit:** 69c1a6f Merge pull request #1 from Mehbur07/feature/device-folder-storage
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Gerçek cihazlarda (Android Chrome, iPhone Safari) klasör seçme ve kaydetmeyi elle denemek
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - 404.html'deki duvar kâğıdı listesi app.js'deki `WALLPAPERS` ile aynı sırada tutulmalı (yeni duvar kâğıdı eklenirse ikisine de ekle)

### [2026-11-11 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - `feature/device-folder-storage`: localStorage yerine depolama katmanı (`HandleBackend` / `IdbBackend` / `MemoryBackend`, hepsi load-read-write-mkdir-remove arayüzü)
  - Cihaz klasörü: File System Access API ile seçilen konumda `Win11 Web` klasörü; tutamaç (handle) IndexedDB'de, izin gerekirse "Oturum aç" tıklamasında isteniyor
  - Klasör seçilemeyen tarayıcılarda OPFS (yoksa IndexedDB); eski `w11:fs` localStorage verisi ilk açılışta otomatik taşınıyor
  - Paint Resimler'e PNG kaydediyor, yeni Fotoğraflar uygulaması; Dosya Gezgini'ne Cihazdan ekle / İndir / Yenile; Ayarlar > Depolama
  - `:` karakteri diskte geçersiz olduğu için "Yerel Disk (C:)" diskte U+A789 ile saklanıyor
- **Son Commit:** 4e604af feat: add browser-based Windows 11 desktop simulation
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Gerçek cihazlarda (Android Chrome, iPhone Safari) klasör seçme ve kaydetmeyi elle denemek; istenirse klasörü ZIP olarak indirme eklemek
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - Klasör seçme penceresi otomatik test edilemiyor (kullanıcı tıklaması gerekiyor); OPFS yolu headless Chrome'da CDP ile test edildi
  - Headless Chrome `--virtual-time-budget` ile disk işlemleri bitmeden ekran görüntüsü alıyor; test için `scratchpad/cdp.mjs` gibi gerçek zamanlı CDP sürücüsü kullanılmalı
  - Klasöre dışarıdan eklenen dosyalar ancak ⟳ Yenile veya sayfa yenilemesiyle görünür

### [2026-11-11 - Mehbur07]
- **Yapılanlar & Kararlar:**
  - Saf HTML/CSS/JS ile tarayıcıda çalışan Windows 11 simülasyonu yazıldı (framework/bağımlılık yok).
  - Pencere yöneticisi, görev çubuğu, Başlat menüsü ve 7 uygulama eklendi.
  - Veriler localStorage'da `w11:` önekiyle tutuluyor; sunucu yok.
  - Yayınlama GitHub Pages ile (main dalı, kök klasör).
- **Son Commit:** ilk yükleme, commit yok
- **Aktif Branch:** main
- **Sıradaki İlk İş (Next Action):** Yeni uygulamalar (ör. mayın tarlası tarzı oyun, müzik çalar) veya masaüstü simgelerini sürükleme özelliği eklemek.
- **Bilinen Sorunlar / Dikkat Edilmesi Gerekenler:**
  - Web Tarayıcı'da çoğu büyük site iframe içinde açılmayı engelliyor (X-Frame-Options); bu tarayıcı kaynaklı bir sınırlama.
  - Test dosyası ve lint aracı yok.
