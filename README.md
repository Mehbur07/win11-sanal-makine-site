# Win11 Web — Tarayıcıda Windows 11 Simülasyonu

Tarayıcıda çalışan, Windows 11 görünümünde bir masaüstü simülasyonu. Kurulum gerektirmez; sayfayı açmanız yeterli.

🔗 **Canlı sürüm:** https://mehbur07.github.io/win11-sanal-makine-site/

> Bu proje eğitim amaçlı bir arayüz simülasyonudur, gerçek bir sanal makine değildir ve Microsoft ile bağlantılı değildir. Windows, Microsoft Corporation'ın ticari markasıdır.

## Özellikler

- **Açılış, kilit ve oturum açma ekranı**; Başlat menüsünden Kilitle / Yeniden başlat / Kapat
- **Pencere yöneticisi:** sürükleme, yeniden boyutlandırma, küçültme, tam ekran, üst kenara bırakınca tam ekran (snap)
- **Görev çubuğu:** ortalanmış simgeler, çalışan uygulama göstergeleri, saat, takvim, hızlı ayarlar
- **Başlat menüsü:** uygulama arama, sabitlenmiş uygulamalar, önerilen dosyalar
- **Uygulamalar:**
  - 📁 Dosya Gezgini — sanal dosya sistemi, klasör/dosya oluşturma, Geri Dönüşüm Kutusu
  - 📝 Not Defteri — Ctrl+S ile kaydetme
  - 🧮 Hesap Makinesi — klavye desteği
  - 🎨 Paint — kalem, silgi, çizgi, dikdörtgen, elips; çizimleri Resimler klasörüne PNG olarak kaydeder
  - 🖼️ Fotoğraflar — Resimler klasöründeki resimleri gösterir, Paint'te düzenlemeye açar
  - 🌐 Web Tarayıcı — sayfaları pencere içinde açar
  - 💻 Terminal — `help`, `dir`, `cd`, `type`, `mkdir`, `echo`, `start` gibi komutlar
  - ⚙️ Ayarlar — açık/koyu tema, duvar kâğıdı, vurgu rengi, parlaklık, gece ışığı
- Dosyalar **cihazda gerçek bir klasöre** kaydedilir (aşağıya bakın); ayarlar tarayıcıda saklanır
- Mobil uyumlu (dar ekranda pencereler tam ekran açılır)

## Dosyalar nerede saklanır?

Windows işlemleri (pencereler, uygulamalar, Dosya Gezgini) tamamen sitede çalışır; oluşturduğunuz dosyalar ise cihazınıza yazılır. İlk girişte nerede saklanacağı sorulur, sonradan **Ayarlar > Depolama**'dan değiştirilebilir.

| Seçenek | Nasıl çalışır | Desteklenen tarayıcılar |
|---|---|---|
| 📁 **Cihazımda klasör** | Seçtiğiniz konumda (ör. Belgeler) `Win11 Web` adlı gerçek bir klasör oluşturulur. Not Defteri, Paint ve Dosya Gezgini'ndeki her şey bu klasörde gerçek dosya/klasör olarak durur; telefonun veya bilgisayarın dosya yöneticisinden de görülebilir. | Chrome, Edge, Opera (bilgisayar) ve Android Chrome |
| 🌐 **Tarayıcıda** | Dosyalar yine bu cihazda, tarayıcının siteye ayırdığı özel alanda (OPFS, yoksa IndexedDB) saklanır. Dosya Gezgini'ndeki **⬇️ İndir** ile cihazın İndirilenler klasörüne alınabilir. | Tüm modern tarayıcılar (iPhone/iPad Safari ve Firefox dahil) |

- Klasör izni tarayıcı tarafından hatırlanmazsa, sonraki ziyarette **Oturum aç** düğmesine basınca tekrar sorulur.
- Dosya Gezgini'ndeki **⬆️ Cihazdan ekle** ile telefondaki/bilgisayardaki dosyalar (ör. galerideki resimler) klasöre kopyalanır.
- Klasöre dışarıdan (dosya yöneticisiyle) eklenen dosyaları görmek için Dosya Gezgini'nde **⟳ Yenile**'ye basın.
- **Sıfırla** yalnızca tarayıcıdaki verileri siler; cihazdaki `Win11 Web` klasörüne dokunmaz.

## Çalıştırma

Hiçbir kurulum veya bağımlılık yok.

```bash
git clone https://github.com/Mehbur07/win11-sanal-makine-site.git
cd win11-sanal-makine-site
# index.html dosyasını tarayıcıda açın
# veya yerel bir sunucu ile:
python -m http.server 8000   # ardından http://localhost:8000
```

## Kullanılan teknolojiler

- HTML, CSS (değişkenlerle tema, `backdrop-filter` ile buzlu cam efekti)
- Saf JavaScript (framework yok)
- File System Access API (cihaz klasörü), Origin Private File System ve IndexedDB (tarayıcı depolaması)
- GitHub Pages (yayınlama)

## Dosya yapısı

| Dosya | Açıklama |
|---|---|
| `index.html` | Sayfa iskeleti: açılış/kilit ekranı, masaüstü, görev çubuğu, paneller |
| `style.css` | Tüm görünüm ve açık/koyu tema |
| `404.html` | Bulunamayan adresler için özel hata sayfası (bağımsız, tüm stilleri kendi içinde) |
| `app.js` | Depolama katmanı, pencere yöneticisi, sanal dosya sistemi ve tüm uygulamalar |

## Bilinen sınırlamalar

- iPhone/iPad (Safari) ve Firefox, sitelerin cihazda istenen yere klasör oluşturmasına izin vermez; bu cihazlarda dosyalar tarayıcı depolamasında tutulur.
- Klasör yerel çalıştırmada da çalışır, ama `file://` ile açınca bazı tarayıcılar depolamayı kısıtlar; `python -m http.server` ile açmanız önerilir.
- Web Tarayıcı'da Google, YouTube gibi pek çok site güvenlik nedeniyle başka sayfa içinde açılmaya izin vermez; bu durumda ↗ düğmesiyle gerçek tarayıcıda açabilirsiniz.
