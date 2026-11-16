# Gerçek cihaz testi kontrol listesi (Faz 6)

Otomatik testler siteyi bilgisayar, tablet ve telefon **boyutlarında** dener; ama gerçek dokunmatik ekran,
gerçek klasör seçme penceresi, ana ekrana ekleme ve internetsiz açılış ancak gerçek cihazda görülür.
Her cihazda aşağıdaki maddeleri dene, sorun çıkan maddenin yanına kısa bir not yaz.

Adres: https://virtualmos.github.io/

## Cihazlar

| Cihaz | Tarayıcı | Durum |
|---|---|---|
| Windows PC | Edge ve Chrome | ⬜ |
| Android tablet | Chrome | ⬜ |
| iPad | Safari | ⬜ |
| Telefon (Android veya iPhone) | Chrome / Safari | ⬜ |

## Her cihazda

1. **Açılış:** Açılış animasyonundan sonra masaüstü geliyor; yazılar ve simgeler net, taşma yok.
2. **Depolama sorusu:** "Dosyalar nerede saklansın?" çıkıyor.
   - PC ve Android'de **Cihazımda klasör** → bir klasör seç → içinde `VirtualMOS` klasörü oluşuyor.
   - iPad ve iPhone'da yalnızca **Tarayıcıda** seçeneği çalışır; bu normal.
3. **Pencereler:** Bir uygulama aç, başlığından sürükle, kenara yasla, köşesinden boyutlandır, küçült, kapat.
   - Tablette **yan yana** düğmesini ve iki uygulamayı yan yana açmayı dene.
   - Telefonda uygulamalar tam ekran açılıyor.
4. **Dosyalar:** Klasör oluştur, cihazdan bir fotoğraf ekle, yeniden adlandır, sil, Çöp Kutusu'ndan geri yükle.
   - Dokunmatikte uzun basınca menü açılıyor.
5. **Uygulamalar:** Metin Düzenleyici'de yaz ve kaydet, Çizim'de çiz ve kaydet, Fotoğraflar'da aç, Terminal'de
   `help` yaz, Tarayıcı'da bir site aç, Ayarlar'da tema ve duvar kâğıdını değiştir.
6. **MehburMC Launcher:** En güncel sürüm görünüyor; **Oyna** demo olduğunu söylüyor; indirme bağlantısı çalışıyor.
7. **Kalıcılık:** Sayfayı yenile ve tarayıcıyı kapatıp aç; dosyalar ve ayarlar yerinde.

## Ana ekrana ekleme ve internetsiz açılış (PWA)

1. Siteyi bir kez aç, birkaç saniye bekle → **"İnternetsiz kullanıma hazır"** bildirimi çıkıyor.
2. Ana ekrana / masaüstüne ekle:
   - **PC (Edge/Chrome):** adres çubuğundaki "Uygulamayı yükle" simgesi.
   - **Android Chrome:** ⋮ menü → "Ana ekrana ekle" ya da "Uygulamayı yükle".
   - **iPad/iPhone Safari:** Paylaş düğmesi → "Ana Ekrana Ekle".
3. Eklenen simge MehburOS logosu; açınca adres çubuğu olmadan tam ekran açılıyor.
4. **Uçak modunu aç** (ya da Wi-Fi'yi kapat) → simgeden aç → masaüstü açılıyor, daha önce hiç açmadığın
   bir uygulamayı (ör. Hesap Makinesi) bile açabiliyorsun.
   - İnternetsizken Tarayıcı'daki siteler ve Launcher'daki sürüm bilgisi gelmez; bu normal.
5. **Güncelleme:** Yeni bir sürüm yayınlandığında siteyi açınca **"Yeni sürüm hazır"** bildirimi ve **Yenile**
   düğmesi çıkıyor; basınca yeni sürüm açılıyor.

## Not alırken

Sorun gördüğünde şunları yazman yeterli: cihaz + tarayıcı, hangi madde, ne bekliyordun, ne oldu.
Ekran görüntüsü varsa çok işe yarar.
