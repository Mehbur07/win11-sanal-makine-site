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
  - 🎨 Paint — kalem, silgi, çizgi, dikdörtgen, elips, PNG indirme
  - 🌐 Web Tarayıcı — sayfaları pencere içinde açar
  - 💻 Terminal — `help`, `dir`, `cd`, `type`, `mkdir`, `echo`, `start` gibi komutlar
  - ⚙️ Ayarlar — açık/koyu tema, duvar kâğıdı, vurgu rengi, parlaklık, gece ışığı
- Dosyalar ve ayarlar tarayıcının **localStorage** alanında saklanır (sayfa yenilense de kaybolmaz)
- Mobil uyumlu (dar ekranda pencereler tam ekran açılır)

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
- GitHub Pages (yayınlama)

## Dosya yapısı

| Dosya | Açıklama |
|---|---|
| `index.html` | Sayfa iskeleti: açılış/kilit ekranı, masaüstü, görev çubuğu, paneller |
| `style.css` | Tüm görünüm ve açık/koyu tema |
| `app.js` | Pencere yöneticisi, sanal dosya sistemi ve tüm uygulamalar |

## Bilinen sınırlamalar

- Web Tarayıcı'da Google, YouTube gibi pek çok site güvenlik nedeniyle başka sayfa içinde açılmaya izin vermez; bu durumda ↗ düğmesiyle gerçek tarayıcıda açabilirsiniz.
