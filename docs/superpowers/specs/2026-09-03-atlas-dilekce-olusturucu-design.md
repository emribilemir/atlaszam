# Atlas Öğrenim Ücreti İade Dilekçesi Oluşturucu — Tasarım

## Amaç

İstanbul Atlas Üniversitesi lisans ve önlisans öğrencilerinin, 2026-2027 öğrenim ücretinde %25 tavan artışının aşıldığını düşündükleri durumda, kullanıcı tarafından sağlanan sabit dilekçe metnini yaklaşık 30 saniye içinde kişiselleştirip yazdırabilmesini veya tarayıcının yazdırma ekranından PDF olarak kaydedebilmesini sağlamak.

Uygulama hukuki metin üretmez veya yorumlamaz. Verilen ana metni korur; yalnızca kişisel alanları, seçilen fakülte/bölüm/sınıf bilgisini, tarihi ve matematiksel tutarları doldurur. Liste fiyatı bilinmediğinde gereksinimde verilen iki minimal metin varyantı kullanılır.

## Kapsam

- Tamamen statik, GitHub Pages alt dizinlerinde çalışabilen tek sayfa uygulaması.
- HTML, CSS ve Vanilla JavaScript dışında çalışma zamanı bağımlılığı yoktur.
- Backend, API, veritabanı, kullanıcı hesabı, analytics, çerez veya kalıcı tarayıcı depolaması yoktur.
- Yalnızca lisans ve önlisans programları listelenir; lisansüstü programlar eklenmez.
- Bilgisayar Mühendisliği varsayılan seçili ve listenin en üstündedir. İngilizce program hemen ardından gelir; diğer programlar fakülte/MYO altında mantıklı sırada sunulur.
- Program/fakülte eşlemeleri İstanbul Atlas Üniversitesi AKTS/Bilgi Paketi esas alınarak `data/departments.js` içinde kolay güncellenebilir biçimde tutulur.

## Dosya yapısı

```text
/
├── index.html
├── style.css
├── app.js
├── README.md
├── data/
│   └── departments.js
├── tests/
│   └── app.test.js
└── docs/superpowers/
    ├── specs/
    └── plans/
```

Test dosyası Node'un yerleşik test koşucusuyla çalışır; uygulamanın GitHub Pages üzerinde çalışması veya kullanılabilmesi için Node ya da build adımı gerekmez.

## Kullanıcı deneyimi

Sayfa tek akıştan oluşur:

1. Kullanıcı kısa açıklamayı ve gizlilik bildirimini görür.
2. Tek kolonlu formda kişisel bilgilerini, bölüm/sınıfını ve iki öğrenim ücretini girer.
3. İsteğe bağlı liste fiyatı checkbox'ı açılırsa yalnızca liste fiyatı alanı görünür.
4. “DİLEKÇEYİ OLUŞTUR” butonu doğrulamayı ve hesaplamayı çalıştırır.
5. Fazla tahsilat pozitifse aynı sayfada “Dilekçen hazır” sonucu ve A4 önizlemesi gösterilir.
6. Kullanıcı “PDF / Yazdır”, “Metni kopyala” veya “Bilgileri düzenle” işlemlerinden birini seçer.

Fazla tahsilat sıfır ya da negatifse dilekçe oluşturulmaz; ödeme tutarlarının kontrol edilmesini isteyen açık uyarı gösterilir ve kullanıcı formda kalır. İlk hatalı alana odaklanılır.

## Görsel tasarım

Araç ciddi, sade ve yüksek okunabilirlikli görünür. Açık nötr arka plan, koyu lacivert metin/aksiyon rengi ve güçlü kontrast kullanılır. Dekoratif illüstrasyon, dashboard, gereksiz animasyon veya haricî font yoktur.

Form masaüstünde dar ve odaklı bir kolon; mobilde tam genişliktedir. Dokunma hedefleri en az 44 piksel, focus durumları belirgin ve hata mesajları yalnızca renkle ifade edilmeyen metinli bildirimlerdir.

A4 önizlemesi ekranda kağıt görünümündedir. Yazdırmada yalnızca 210 × 297 mm dilekçe görünür; form, açıklamalar ve eylem butonları gizlenir. Çıktı siyah-beyaz, resmi ve okunabilir olur.

## Veri ve hesaplama modeli

Para değerleri `parseMoney` ile kuruşa çevrilmiş integer olarak tutulur. Türkçe giriş biçimleri (`282750`, `282.750`, `282750,00`) desteklenir. Çıktı `Intl.NumberFormat('tr-TR')` ile iki ondalık basamak ve `TL` son ekiyle gösterilir.

- `maxAllowed = round(previousPaidKurus * 125 / 100)`
- `overpayment = currentPaidKurus - maxAllowed`
- `actualIncreasePercentage = ((currentPaidKurus / previousPaidKurus) - 1) * 100`

Yüzde iki ondalık basamakla Türkçe biçimde gösterilir. Tarih, dilekçe oluşturulduğu anda yerel takvimden `GG.AA.YYYY` biçiminde üretilir.

## Doğrulama ve erişilebilirlik

- Ad soyad, öğrenci numarası, telefon, adres, bölüm, sınıf ve iki ödeme tutarı zorunludur.
- T.C. Kimlik No yalnızca 11 rakam kabul eder; standart checksum doğrulaması uygulanır.
- Para tutarları pozitif olmalı; önceki yıl tutarı sıfır olamaz.
- Checkbox açıksa liste fiyatı pozitif bir para değeri olmalıdır.
- Gerçek `<label>` elemanları, anlamlı heading sırası, klavye erişimi ve görünür focus kullanılır.
- Hata özeti `role="alert"`/`aria-live` ile duyurulur; alanlarda `aria-invalid` ve alana bağlı hata metni kullanılır.
- Sonuç oluşturulduğunda sonuç başlığına programatik olarak odaklanılır.
- `prefers-reduced-motion` tercihine uyulur.

## Dilekçe üretimi ve güvenlik

Dilekçe, hukuki metnin bilinen ve bilinmeyen liste fiyatı için iki açık varyantını seçen `generatePetition` fonksiyonuyla yapılandırılmış içerik olarak hazırlanır. `renderPetition` yalnızca güvenli DOM API'leri ve `textContent` kullanır. Kullanıcı girdisi doğrudan `innerHTML` içine yerleştirilmez.

Kullanıcı verileri yalnızca sayfanın belleğinde tutulur. Form hiçbir yere gönderilmez; `localStorage`, `sessionStorage`, IndexedDB veya üçüncü taraf servis kullanılmaz. Haricî CDN ve ağ isteği yoktur.

## Fonksiyon sınırları

- `parseMoney`: Türkçe tutar girdisini kuruş integer'a dönüştürür.
- `formatMoney`: Kuruş integer'ı Türkçe para biçimine dönüştürür.
- `calculateMaxAllowed`: %25 tavanlı azami ücreti hesaplar.
- `calculateOverpayment`: fiilî tahsilat ile azami tutar farkını hesaplar.
- `calculateIncreasePercentage`: fiilî zam yüzdesini hesaplar.
- `validateForm`: alan ve iş kuralı doğrulamalarını üretir.
- `generatePetition`: sabit metin ile güvenli görüntü modelini üretir.
- `renderPetition`: görüntü modelini A4 DOM'una aktarır.
- `printPetition`: tarayıcının native yazdırma ekranını açar.

Hesaplama ve doğrulama yardımcıları tarayıcı başlangıcından bağımsız tanımlanır ve Node testlerine açılır.

## Test ve kabul

Otomatik testler para ayrıştırma/biçimlendirme, kuruş bazlı %25 hesabı, fazla tahsilat, yüzde hesabı, T.C. kimlik checksum'u ve iki liste fiyatı dilekçe varyantını kapsar. Ayrıca statik dosyalar yerel HTTP sunucusunda açılarak masaüstü ve mobil viewport'larda form akışı, checkbox, hata odağı, A4 önizleme, kopyalama ve print CSS kontrol edilir.

Tamamlanma öncesinde gereksinim kontrol listesi tek tek karşılaştırılır; kişisel veri depolama/ağ gönderimi ve `innerHTML` kullanımı kaynak kod taramasıyla ayrıca doğrulanır.

## Kaynak

Program listesi için resmî İstanbul Atlas Üniversitesi AKTS/Bilgi Paketi kullanılır:

<https://ois.atlas.edu.tr/bilgipaketi/eobsakts/akademik/menu_id/1_5/ln/tr>
