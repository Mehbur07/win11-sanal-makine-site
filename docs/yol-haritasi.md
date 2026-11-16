# VirtualMOS — Yol Haritası

**VirtualMOS** (Virtual MehburOS), MehburOS'un tarayıcıda çalışan sanal masaüstüdür.
Win11 Web projesi bu adla, Windows'a benzemeyen kendi kimliğiyle baştan yazılacak.

> Durum: **Faz 6 sürüyor.** PWA, performans ve erişilebilirlik tamam; gerçek cihaz testleri kullanıcıda ([kontrol listesi](cihaz-testi.md)). Faz 7, kullanıcı "başla" dediğinde başlar.
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
- [x] Vite + React + TypeScript projesi (pnpm), klasör yapısı: `src/shell`, `src/i18n`, `src/styles` (`src/apps`, `src/storage` ilgili fazlarda eklenecek)
- [x] ESLint + Prettier, Vitest, Playwright kurulumu (Playwright: bilgisayar, tablet, telefon boyutları)
- [x] GitHub Actions: her PR'da lint + test; main'e merge edilince GitHub Pages'e otomatik yayın
- [x] Tema değişkenleri (MehburOS renkleri, koyu tema varsayılan, açık tema hazır) ve TR/EN dil altyapısı
- [x] Açılış animasyonu → MehburOS duvar kâğıtlı masaüstü (16:9 ve 4:3 WebP; dik ekranda resmin tamamı sığar)

**Bitiş ölçütü:** Canlı sitede MehburOS renklerinde açılış ve masaüstü, testler otomatik çalışıyor.

### Faz 2 — Masaüstü kabuğu
- [x] Pencere yöneticisi: aç/kapat, sürükle, boyutlandır, küçült, tam ekran, kenara yapıştırma (snap) + önizleme
- [x] Alt panel (görev çubuğu), uygulama menüsü (arama dahil), sistem tepsisi, saat/takvim
- [x] Hızlı ayarlar (dil, açık/koyu tema, tam ekran, masaüstünü göster), bildirimler, sağ tık / uzun basma menüsü, masaüstü simgeleri
- [x] **Tablet modu:** dokunmatik sürükleme, büyük dokunma alanları, "yan yana" düğmesi ve kenara sürükleyerek bölme
- [x] **Telefon modu:** uygulamalar tam ekran, masaüstü tüm uygulamaları gösteren ana ekran
- [x] Klavye kısayolları (Alt + M/Q/D/oklar, Esc) ve erişilebilirlik temeli (odak, ekran okuyucu etiketleri)
- [x] Henüz yazılmamış uygulamalar "yakında" penceresi açar; "Hakkında" uygulaması kısayolları ve ipuçlarını gösterir

**Bitiş ölçütü:** Bilgisayar, tablet ve telefonda pencereler rahatça kullanılıyor.

### Faz 3 — Depolama ve Dosyalar
- [x] Depolama katmanı yeniden yazıldı: cihaz klasörü (`VirtualMOS` adlı) → OPFS → IndexedDB → (son çare) bellek
- [x] Eski "Win11 Web" klasörünü içe aktarma ("Win11 Web'den aktar" / "Klasör içe aktar")
- [x] İlk açılışta "Dosyalar nerede saklansın?" seçimi; izin düşerse "İzin ver" penceresi; konum Dosyalar'dan ve Ayarlar → Depolama'dan değiştirilir, değişince dosyalar yeni yere kopyalanır
- [x] Dosyalar uygulaması: klasörler, yeni klasör/metin dosyası, kopyala/kes/yapıştır, yeniden adlandır, çöp kutusu (geri yükle/kalıcı sil/boşalt), cihazdan ekle, sürükle-bırak, indir, resim/metin önizleme, ızgara/liste görünümü, klavye kısayolları, dokunmatikte seçim dairesi ve uzun basma
- [x] Depolama için birim testleri (aynı testler bellekte ve IndexedDB'de) + tarayıcı testleri (OPFS ve cihaz klasörü yolu)

**Bitiş ölçütü:** Dosyalar sayfa yenilenince ve tarayıcı kapanınca korunuyor.

### Faz 4 — Temel uygulamalar
- [x] Metin düzenleyici, Hesap makinesi, Çizim, Fotoğraflar
- [x] Terminal (MehburOS komutlarıyla), Web tarayıcı, Ayarlar (tema, duvar kâğıdı, dil, depolama)
- [x] Her uygulama için en az bir tarayıcı testi

**Bitiş ölçütü:** Win11 Web'deki tüm özellikler yeni tasarımla çalışıyor.

### Faz 5 — MehburMC Launcher uygulaması
- [x] Gerçek MehburMC Launcher'ın arayüzünü taklit eden demo (sürüm seçimi, profil, haberler; "Oyna" düğmesi demo olduğunu söyler)
- [x] Sürüm bilgisi GitHub Releases'ten; Windows/Linux için gerçek indirme bağlantıları
- [x] Not: Tarayıcı içinden Minecraft başlatılamaz

**Bitiş ölçütü:** Demo gerçek launcher gibi görünüyor; en güncel sürüm görülüp indirilebiliyor.

### Faz 6 — Cilalama
- [x] PWA: ana ekrana eklenebilir, internet olmadan da açılabilir (tablet için önemli); yeni sürümde "Yenile" bildirimi
- [x] Performans (hızlı açılış, küçük dosya boyutu) ve erişilebilirlik denetimi: uygulamalar ihtiyaç anında yükleniyor (ilk açılış paketi 398 KB → 293 KB); axe-core ile WCAG 2.2 AA taraması tarayıcı testlerine eklendi, bulgular düzeltildi
- [ ] Gerçek cihaz testleri: Windows PC, Android tablet, iPad, telefon ([kontrol listesi](cihaz-testi.md))

**Bitiş ölçütü:** Gerçek cihazlarda sorunsuz; denetimlerde ciddi bulgu yok.

### Faz 7 — Yayın (v1.0.0)
- [ ] README (TR), CHANGELOG, `v1.0.0` etiketi
- [ ] m07-site kartı "Hazır Projeler"e döner: **Siteye Git** + **Kaynak Kodu**
- [ ] Edge'de SmartScreen ve Google Safe Browsing kontrolü

## Açık sorular
Şu an açık soru yok (Faz 0 öncesi sorular cevaplandı, kararlar yukarıdaki tabloda).
