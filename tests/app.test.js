const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseMoney,
  formatMoney,
  calculateMaxAllowed,
  calculateOverpayment,
  calculateIncreasePercentage,
  formatPercentage,
  formatDate,
} = require('../app.js');

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
