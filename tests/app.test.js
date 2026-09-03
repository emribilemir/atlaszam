const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  parseMoney,
  formatMoney,
  calculateMaxAllowed,
  calculateOverpayment,
  calculateIncreasePercentage,
  formatPercentage,
  formatDate,
  isValidTurkishId,
  validateForm,
  generatePetition,
  petitionToPlainText,
} = require('../app.js');

function validForm(overrides = {}) {
  return {
    fullName: 'Emir Bilici',
    nationalId: '10000000146',
    studentNumber: '202612345',
    faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi',
    department: 'Bilgisayar Mühendisliği',
    classLevel: '4. Sınıf',
    phone: '0555 555 55 55',
    address: 'Kağıthane / İstanbul',
    previousPaid: 28_275_000,
    currentPaid: 42_498_000,
    listPriceKnown: false,
    listPrice: null,
    ...overrides,
  };
}

test('desteklenen Türkçe para girişlerini kuruş integer değerine dönüştürür', () => {
  assert.equal(parseMoney('282750'), 28_275_000);
  assert.equal(parseMoney('282.750'), 28_275_000);
  assert.equal(parseMoney('282750,00'), 28_275_000);
  assert.equal(parseMoney('282.750,50 TL'), 28_275_050);
  assert.equal(parseMoney(''), null);
  assert.equal(parseMoney('abc'), null);
});

test('kuruş integer değerini Türkçe para formatında gösterir', () => {
  assert.equal(formatMoney(28_275_000), '282.750,00 TL');
  assert.equal(formatMoney(35_343_750), '353.437,50 TL');
});

test('yüzde 25 tavanını ve fazla tahsilatı kuruş hatası olmadan hesaplar', () => {
  const maxAllowed = calculateMaxAllowed(28_275_000);
  assert.equal(maxAllowed, 35_343_750);
  assert.equal(calculateOverpayment(42_498_000, maxAllowed), 7_154_250);
});

test('fiili zam yüzdesini hesaplar ve iki ondalıkla gösterir', () => {
  const increase = calculateIncreasePercentage(28_275_000, 42_498_000);
  assert.equal(formatPercentage(increase), '50,30');
});

test('dilekçe tarihini gg.aa.yyyy biçiminde gösterir', () => {
  assert.equal(formatDate(new Date(2026, 8, 3)), '03.09.2026');
});

test('T.C. Kimlik No checksum değerini doğrular', () => {
  assert.equal(isValidTurkishId('10000000146'), true);
  assert.equal(isValidTurkishId('10000000145'), false);
  assert.equal(isValidTurkishId('00000000000'), false);
});

test('zorunlu alanları ve pozitif ödeme tutarlarını doğrular', () => {
  const errors = validateForm({
    fullName: '',
    nationalId: '123',
    studentNumber: '',
    faculty: '',
    department: '',
    classLevel: '',
    phone: '',
    address: '',
    previousPaid: null,
    currentPaid: 0,
    listPriceKnown: false,
    listPrice: null,
  });

  assert.equal(errors.fullName, 'Ad soyad alanı zorunludur.');
  assert.equal(errors.nationalId, 'Geçerli bir T.C. Kimlik No girin.');
  assert.equal(errors.previousPaid, 'Geçerli ve sıfırdan büyük bir tutar girin.');
  assert.equal(errors.currentPaid, 'Geçerli ve sıfırdan büyük bir tutar girin.');
});

test('bilinen liste fiyatını sabit hukuki metne yerleştirir', () => {
  const petition = generatePetition(
    validForm({ listPriceKnown: true, listPrice: 35_757_000 }),
    new Date(2026, 8, 3),
  );
  const text = petitionToPlainText(petition);

  assert.match(text, /357\.570,00 TL/);
  assert.match(text, /YÖK’ün emredici nitelikteki tavan kararının açık ihlalidir\./);
  assert.match(text, /Bir önceki yıl fiilen ödenen nihai ücret yerine fiktif liste fiyatlarının baz alınması kanuna karşı hile teşkil etmekte olup YÖK düzenlemelerinde bu yönde bir istisna yer almamaktadır\./);
  assert.match(text, /Emir Bilici\n\nİmza/);
});

test('liste fiyatı bilinmiyorsa rakam uydurmaz', () => {
  const petition = generatePetition(validForm(), new Date(2026, 8, 3));
  const text = petitionToPlainText(petition);

  assert.match(text, /indirimsiz liste fiyatının baz alındığı iddia edilerek/);
  assert.doesNotMatch(text, /\(null TL\)|\[LİSTE FİYATI\]/);
  assert.match(text, /fiilen ödenen ücret yerine indirimsiz liste fiyatının baz alınmasının/);
});

test('Bilgisayar Mühendisliğini ilk sırada tutar ve lisansüstü program içermez', () => {
  const { ATLAS_DEPARTMENTS } = require('../data/departments.js');

  assert.deepEqual(ATLAS_DEPARTMENTS[0], {
    name: 'Bilgisayar Mühendisliği',
    faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi',
  });
  assert.equal(ATLAS_DEPARTMENTS.some(({ name }) => /\(YL\)|\(DR\)/.test(name)), false);
  assert.equal(
    ATLAS_DEPARTMENTS.some(({ faculty }) => faculty === 'Meslek Yüksekokulu'),
    true,
  );
});

test('HTML zorunlu alanları, autofill niteliklerini ve gizlilik mesajını sunar', () => {
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

  assert.match(html, /<html lang="tr">/);
  assert.match(html, /autocomplete="name"/);
  assert.match(html, /autocomplete="tel"/);
  assert.match(html, /autocomplete="street-address"/);
  assert.match(
    html,
    /name="nationalId"[^>]*inputmode="numeric"[^>]*maxlength="11"[^>]*autocomplete="off"/,
  );
  assert.match(html, /Girdiğiniz bilgiler cihazınızda işlenir\./);
  assert.match(html, /DİLEKÇEYİ OLUŞTUR/);
});

test('istemci kodu kalıcı depolama, ağ gönderimi ve güvensiz HTML sink kullanmaz', () => {
  const source = readFileSync(join(__dirname, '..', 'app.js'), 'utf8');

  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /textContent\s*=/);
  assert.match(source, /window\.print\(\)/);
});

test('stiller A4 yazdırmayı ve erişilebilir etkileşim durumlarını tanımlar', () => {
  const css = readFileSync(join(__dirname, '..', 'style.css'), 'utf8');

  assert.match(css, /width:\s*210mm/);
  assert.match(css, /min-height:\s*297mm/);
  assert.match(css, /@media print/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
