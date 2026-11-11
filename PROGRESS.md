# PROGRESS

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
