# VirtualMOS — Yol Haritası

**VirtualMOS** (Virtual MehburOS), MehburOS'un tarayıcıda çalışan sanal masaüstüdür.
Win11 Web projesi bu adla, Windows'a benzemeyen kendi kimliğiyle baştan yazılacak.

> Durum: **Faz 0 tamamlandı.** Faz 1, kullanıcı "başla" dediğinde başlar.
> Her faz ayrı branch + PR ile ilerler; her fazın sonunda canlı sitede kontrol edilip onay alınır.

## Alınan kararlar

| Konu | Karar |
|---|---|
| Kimlik | MehburOS teması: neon camgöbeği (`#2DE2F5`) + siyah (`#05090C`), KDE Plasma'dan esinlenen masaüstü. Windows logosu, adı veya giriş ekranı kullanılmaz |
| Giriş ekranı | Yok. Kısa açılış animasyonundan sonra doğrudan masaüstü |
| Adres | `virtualmos.github.io` (GitHub'da `virtualmos` adlı bir organizasyon gerekir) |
| Repo | Mevcut repo `virtualmos` organizasyonuna taşındı, adı `virtualmos.github.io` (geçmiş korundu) |
| Cihaz önceliği | %45 bilgisayar, %45 tablet, %10 telefon. Arayüz dokunmatik dostu tasarlanır |
| Cihaza kaydetme | Kalır (cihazda klasör; desteklemeyen tarayıcılarda tarayıcı depolaması) |
| Dil | Türkçe + İngilizce |
| Teknik yapı | Vite + React + TypeScript, paket yöneticisi pnpm |
| Kalite | ESLint + Prettier (lint/format), Vitest (birim test), Playwright (tarayıcı testi), GitHub Actions ile otomatik kontrol ve yayın |
| Yeni uygulama | MehburMC Launcher — gerçek launcher'ın arayüzünü taklit eden demo |
| Logo | MehburOS logosu (`assets/brand/mehburos-icon-*.png`) |
| Eski dosyalar | Win11 Web'deki dosyalar cihaz klasörü üzerinden elle aktarılacak (Faz 3) |

## Fazlar

### Faz 0 — Hazırlık ve taşınma
- [x] Kullanıcı GitHub'da ücretsiz `virtualmos` organizasyonunu oluşturur (bu adım API ile yapılamaz)
- [x] Mevcut kodun son hali `v0.1.0-win11` etiketiyle saklanır (istenirse geri dönülebilsin)
- [x] Repo, onay alınarak `virtualmos` organizasyonuna taşınır ve adı `virtualmos.github.io` yapılır
- [x] Repo açıklaması, konu etiketleri, Dependabot ve branch koruması yeniden ayarlanır (koruma ve Dependabot taşımayla birlikte geldi)
- [x] Eski adres (`mehbur07.github.io/win11-sanal-makine-site/`) artık kullanılmıyor; SmartScreen uyarısı yalnızca o adresteydi
- [x] Eski site dosyaları kaldırıldı, yerine MehburOS logolu geçici "yakında" ve 404 sayfaları kondu

**Bitiş ölçütü:** `virtualmos.github.io` açılıyor (geçici "yakında" sayfası).

### Faz 1 — Temel iskelet
- [ ] Vite + React + TypeScript projesi (pnpm), klasör yapısı: `src/shell`, `src/apps/<uygulama>`, `src/storage`, `src/i18n`
- [ ] ESLint + Prettier, Vitest, Playwright kurulumu
- [ ] GitHub Actions: her PR'da lint + test; main'e merge edilince GitHub Pages'e otomatik yayın
- [ ] Tema değişkenleri (MehburOS renkleri, koyu tema varsayılan) ve TR/EN dil altyapısı
- [ ] Açılış animasyonu → boş masaüstü ve duvar kâğıdı

**Bitiş ölçütü:** Canlı sitede MehburOS renklerinde açılış ve masaüstü, testler otomatik çalışıyor.

### Faz 2 — Masaüstü kabuğu
- [ ] Pencere yöneticisi: aç/kapat, sürükle, boyutlandır, küçült, tam ekran, kenara yapıştırma (snap)
- [ ] Alt panel (görev çubuğu), uygulama menüsü (arama dahil), sistem tepsisi, saat/takvim
- [ ] Hızlı ayarlar, bildirimler, sağ tık menüsü, masaüstü simgeleri
- [ ] **Tablet modu:** dokunmatik sürükleme, büyük dokunma alanları, iki uygulamayı yan yana bölme
- [ ] **Telefon modu:** uygulamalar tam ekran, uygulama çekmecesi
- [ ] Klavye kısayolları ve erişilebilirlik temeli (odak, ekran okuyucu etiketleri)

**Bitiş ölçütü:** Bilgisayar, tablet ve telefonda pencereler rahatça kullanılıyor.

### Faz 3 — Depolama ve Dosyalar
- [ ] Depolama katmanı Win11 Web'den taşınır: cihaz klasörü (`VirtualMOS` adlı) → OPFS → IndexedDB
- [ ] Eski "Win11 Web" klasörünü içe aktarma seçeneği (kullanıcının eski dosyaları için)
- [ ] İlk açılışta "Dosyalar nerede saklansın?" seçimi, Ayarlar'da değiştirme
- [ ] Dosyalar uygulaması: klasörler, kopyala/taşı/yeniden adlandır, çöp kutusu, cihazdan ekle, indir
- [ ] Depolama için birim testleri

**Bitiş ölçütü:** Dosyalar sayfa yenilenince ve tarayıcı kapanınca korunuyor.

### Faz 4 — Temel uygulamalar
- [ ] Metin düzenleyici, Hesap makinesi, Çizim, Fotoğraflar
- [ ] Terminal (MehburOS komutlarıyla), Web tarayıcı, Ayarlar (tema, duvar kâğıdı, dil, depolama)
- [ ] Her uygulama için en az bir tarayıcı testi

**Bitiş ölçütü:** Win11 Web'deki tüm özellikler yeni tasarımla çalışıyor.

### Faz 5 — MehburMC Launcher uygulaması
- [ ] Gerçek MehburMC Launcher'ın arayüzünü taklit eden demo (sürüm seçimi, profil, haberler; "Oyna" düğmesi demo olduğunu söyler)
- [ ] Sürüm bilgisi GitHub Releases'ten; Windows/Linux için gerçek indirme bağlantıları
- [ ] Not: Tarayıcı içinden Minecraft başlatılamaz

**Bitiş ölçütü:** Demo gerçek launcher gibi görünüyor; en güncel sürüm görülüp indirilebiliyor.

### Faz 6 — Cilalama
- [ ] PWA: ana ekrana eklenebilir, internet olmadan da açılabilir (tablet için önemli)
- [ ] Performans (hızlı açılış, küçük dosya boyutu) ve erişilebilirlik denetimi
- [ ] Gerçek cihaz testleri: Windows PC, Android tablet, iPad, telefon

**Bitiş ölçütü:** Gerçek cihazlarda sorunsuz; denetimlerde ciddi bulgu yok.

### Faz 7 — Yayın (v1.0.0)
- [ ] README (TR), CHANGELOG, `v1.0.0` etiketi
- [ ] m07-site kartı "Hazır Projeler"e döner: **Siteye Git** + **Kaynak Kodu**
- [ ] Edge'de SmartScreen ve Google Safe Browsing kontrolü

## Açık sorular
Şu an açık soru yok (Faz 0 öncesi sorular cevaplandı, kararlar yukarıdaki tabloda).
