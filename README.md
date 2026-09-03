# Atlas Öğrenim Ücreti İade Dilekçesi Oluşturucu

İstanbul Atlas Üniversitesi öğrencileri için hazırlanmış, tamamen statik ve tarayıcıda çalışan dilekçe doldurma aracıdır.

## Projenin amacı

Uygulama, 2026-2027 öğrenim ücretinde %25 tavan artış sınırının aşıldığını düşünen öğrencilerin mevcut dilekçe şablonunu kendi bilgileriyle hızlıca doldurmasını sağlar.

Kullanıcının girdiği 2025-2026 ve 2026-2027 fiilî ödeme tutarlarından:

- %25 artışla oluşan azami ücreti,
- fazla tahsil edilen tutarı,
- fiilî zam oranını

otomatik olarak hesaplar. Oluşturulan dilekçe tarayıcının yazdırma ekranından PDF olarak kaydedilebilir veya doğrudan yazdırılabilir.

## Kullanım

1. Bilgilerinizi girin.
2. Önceki ve güncel öğrenim ücretinizi yazın.
3. Dilekçeyi oluşturun.
4. PDF olarak kaydedin veya yazdırın.

Uygulama tarih ve tutar hesaplamalarını otomatik ekler. Üniversitenin baz aldığını söylediği indirimsiz liste fiyatı biliniyorsa isteğe bağlı alan açılarak girilebilir; bilinmiyorsa uygulama herhangi bir fiyat tahmin etmez.

## GitHub Pages

Bu proje yalnızca HTML, CSS ve Vanilla JavaScript kullanır. Build adımı, backend, API, veritabanı veya sunucu bağımlılığı yoktur. Relative asset yolları sayesinde bir repo alt yolundan doğrudan çalışır.

GitHub Pages üzerinde yayınlamak için:

1. Repoyu GitHub'a gönderin.
2. Repo sayfasında **Settings** bölümünü açın.
3. **Pages** sayfasına geçin.
4. Kaynak olarak **Deploy from a branch** seçin.
5. Branch için **main**, klasör için **/root** seçip kaydedin.

Site kısa süre sonra şu yapıda yayınlanır:

```text
https://USERNAME.github.io/REPO-NAME/
```

## Gizlilik

Bu uygulama kullanıcıların girdiği kişisel bilgileri herhangi bir sunucuya göndermez, kaydetmez veya tarafımızca saklamaz.

Ad soyad, T.C. Kimlik No, öğrenci numarası, telefon, adres ve ödeme bilgileri yalnızca kullanıcının kendi tarayıcısında işlenir ve dilekçenin oluşturulması amacıyla kullanılır.

Uygulamada kullanıcı hesabı veya veritabanı bulunmaz. Form verileri sunucuya gönderilmez. Kişisel bilgiler `localStorage`, `sessionStorage`, IndexedDB veya benzeri kalıcı tarayıcı depolama alanlarında saklanmaz. Kişisel veriler analytics servislerine gönderilmez.

GitHub Pages yalnızca uygulamanın statik HTML, CSS ve JavaScript dosyalarını barındırmak için kullanılır. Kullanıcının forma yazdığı bilgiler GitHub reposuna veya tarafımızca yönetilen herhangi bir veri tabanına kaydedilmez.

## Hukuki not

Bu proje hukuki danışmanlık hizmeti sunmaz ve yeni bir hukuki metin üretmez. Uygulamada kullanılan dilekçe metni, kullanıcı tarafından sağlanan mevcut bir şablondur. Uygulama yalnızca kişisel alanları ve matematiksel olarak hesaplanan tutarları bu şablona yerleştirir.

## Program verisi

Lisans ve önlisans programları İstanbul Atlas Üniversitesi'nin resmî [AKTS/Bilgi Paketi](https://ois.atlas.edu.tr/bilgipaketi/eobsakts/akademik/menu_id/1_5/ln/tr) esas alınarak `data/departments.js` içinde tutulur. Lisansüstü programlar listeye dahil edilmez.

## Yerel çalıştırma

Herhangi bir statik dosya sunucusu yeterlidir:

```bash
python3 -m http.server 4173
```

Ardından `http://127.0.0.1:4173/` adresini açın.

## Testler

Testler Node.js'in yerleşik test koşucusunu kullanır ve deployment için gerekli değildir:

```bash
node --test tests/app.test.js
```
