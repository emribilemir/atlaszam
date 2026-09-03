'use strict';

function parseMoney(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const cleaned = String(value)
    .trim()
    .replace(/\s*TL\s*/gi, '')
    .replace(/\s+/g, '');

  if (!cleaned || cleaned.startsWith('-')) return null;

  let liraPart;
  let kurusPart = '';

  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length !== 2 || !/^\d{0,2}$/.test(parts[1])) return null;
    liraPart = parts[0].replace(/\./g, '');
    kurusPart = parts[1];
  } else if (cleaned.includes('.')) {
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      liraPart = cleaned.replace(/\./g, '');
    } else {
      const parts = cleaned.split('.');
      if (parts.length !== 2 || !/^\d{1,2}$/.test(parts[1])) return null;
      [liraPart, kurusPart] = parts;
    }
  } else {
    liraPart = cleaned;
  }

  if (!/^\d+$/.test(liraPart)) return null;

  const lira = Number(liraPart);
  const kurus = Number(kurusPart.padEnd(2, '0') || '0');
  const total = lira * 100 + kurus;

  return Number.isSafeInteger(total) ? total : null;
}

function formatMoney(kurus) {
  return `${new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kurus / 100)} TL`;
}

function calculateMaxAllowed(previousPaid) {
  return Math.round((previousPaid * 125) / 100);
}

function calculateOverpayment(currentPaid, maxAllowed) {
  return currentPaid - maxAllowed;
}

function calculateIncreasePercentage(previousPaid, currentPaid) {
  return ((currentPaid / previousPaid) - 1) * 100;
}

function formatPercentage(value) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseMoney,
    formatMoney,
    calculateMaxAllowed,
    calculateOverpayment,
    calculateIncreasePercentage,
    formatPercentage,
    formatDate,
  };
}
