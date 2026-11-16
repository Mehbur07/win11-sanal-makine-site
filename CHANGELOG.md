# Changelog

Bu projedeki önemli değişiklikler bu dosyada tutulur.
Format [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) yapısına uyar.

## [Unreleased]

### Eklendi
- Site artık ana ekrana / masaüstüne eklenebiliyor ve bir kez açıldıktan sonra internet olmadan da çalışıyor. Yeni sürüm çıkınca "Yeni sürüm hazır" bildirimi ve Yenile düğmesi görünüyor.
- Uygulamalar ihtiyaç anında yükleniyor; site daha hızlı açılıyor. Ekran okuyucu ve sesli komut kullanıcıları için düğme adları düzeltildi (saat, bildirimler, hesap makinesi), erişilebilirlik taraması otomatik testlere eklendi.
- MehburMC Launcher demosu: gerçek launcher'ın görünümünde profiller, haberler ve yenilikler sayfaları. En güncel sürüm GitHub'dan okunuyor ve Windows/Linux için gerçek indirme bağlantıları veriliyor; "Oyna" düğmesi bunun bir demo olduğunu söylüyor.
- Temel uygulamalar eklendi: Metin Düzenleyici, Hesap Makinesi, Çizim, Fotoğraflar, MehburOS komutlu Terminal, Tarayıcı ve Ayarlar (tema, vurgu rengi, duvar kâğıdı, dil, dosyaların saklandığı yer). Dosyalar'da çift tıklanan dosya uygun uygulamada açılıyor.
- Dosyalar uygulaması: klasörler arasında gezinme, yeni klasör ve metin dosyası, kopyala/kes/yapıştır, yeniden adlandırma, Çöp Kutusu'ndan geri yükleme, cihazdan dosya/klasör ekleme (sürükle-bırak dahil), indirme ve resim/metin önizleme.
- İlk açılışta dosyaların nerede saklanacağı soruluyor: cihazda gerçek bir "VirtualMOS" klasörü ya da tarayıcının bu cihazdaki alanı. Eski Win11 Web klasörü içe aktarılabiliyor.
- Masaüstü kabuğu: sürüklenip boyutlandırılabilen, kenara yaslanabilen pencereler; alt panel, aramalı uygulama menüsü, bildirimler, saat/takvim, hızlı ayarlar (dil, açık/koyu tema, tam ekran) ve sağ tık / uzun basma menüsü.
- Tablette büyük dokunma alanları ve iki uygulamayı yan yana açma; telefonda uygulamalar tam ekran açılıyor ve masaüstü ana ekran gibi davranıyor. Klavye kısayolları ve "Hakkında" uygulaması eklendi.
- VirtualMOS'un ilk hali: MehburOS logolu açılış animasyonu ve ardından MehburOS duvar kâğıtlı masaüstü; Türkçe/İngilizce dil düğmesi (seçim hatırlanır).
- Her değişiklikte kodu ve siteyi bilgisayar, tablet ve telefon boyutlarında otomatik test eden ve testler geçince siteyi kendiliğinden yayınlayan altyapı.

### Değiştirildi
- Proje VirtualMOS adını aldı ve yeni adresine taşındı: https://virtualmos.github.io/ (repo: `virtualmos/virtualmos.github.io`).
- Eski Win11 Web sitesi kaldırıldı; yeniden yazım bitene kadar MehburOS logolu, Türkçe/İngilizce geçici bir "yakında" sayfası ve sade bir 404 sayfası gösteriliyor.

## [0.1.0-win11] - 2026-11-14

Win11 Web'in son hali. Kod `v0.1.0-win11` etiketinde saklanıyor.

### Düzeltildi
- Tarayıcı güvenlik filtresinin siteyi yanlışlıkla sahte giriş sayfası sanmaması için Windows logosu yerine kendi logomuz kullanılıyor ve kilit ekranındaki düğme "Masaüstünü aç" oldu.

### Eklendi
- Projenin VirtualMOS adıyla, MehburOS temasında baştan yazılması için fazlara bölünmüş yol haritası eklendi.
- Dosyalar artık cihazda kaydediliyor: ilk girişte sorulup seçilen konumda "Win11 Web" adlı gerçek bir klasör oluşturuluyor; klasör seçmeyi desteklemeyen cihazlarda (iPhone/iPad, Firefox) dosyalar tarayıcının bu cihazdaki depolama alanında tutuluyor.
- Ayarlar'a Depolama sayfası, Dosya Gezgini'ne "Cihazdan ekle", "İndir" ve "Yenile" düğmeleri, resimleri gösteren Fotoğraflar uygulaması eklendi; Paint çizimleri indirmek yerine Resimler klasörüne kaydediyor.
- Olmayan bir adrese gidildiğinde Windows hata penceresi görünümünde, kullanıcının tema ve duvar kâğıdını kullanan özel bir 404 sayfası gösteriliyor.
- Tarayıcıda çalışan Windows 11 görünümlü masaüstü: açılış, kilit ekranı, görev çubuğu, Başlat menüsü, hızlı ayarlar ve takvim.
- Sürüklenip boyutlandırılabilen pencereler ve yedi uygulama: Dosya Gezgini, Not Defteri, Hesap Makinesi, Paint, Web Tarayıcı, Terminal, Ayarlar.
- Dosyaların ve ayarların tarayıcıda saklanması; GitHub Pages ile yayınlama.

[Unreleased]: https://github.com/virtualmos/virtualmos.github.io/compare/v0.1.0-win11...HEAD
[0.1.0-win11]: https://github.com/virtualmos/virtualmos.github.io/releases/tag/v0.1.0-win11
