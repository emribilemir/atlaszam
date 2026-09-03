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

function isValidTurkishId(value) {
  if (!/^\d{11}$/.test(value) || value[0] === '0') return false;

  const digits = value.split('').map(Number);
  const rawTenth = (
    (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
    - (digits[1] + digits[3] + digits[5] + digits[7])
  );
  const tenth = ((rawTenth % 10) + 10) % 10;
  const eleventh = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;

  return digits[9] === tenth && digits[10] === eleventh;
}

function validateForm(data) {
  const errors = {};
  const requiredMessages = {
    fullName: 'Ad soyad alanı zorunludur.',
    studentNumber: 'Öğrenci numarası alanı zorunludur.',
    department: 'Bölüm seçimi zorunludur.',
    classLevel: 'Sınıf seçimi zorunludur.',
    phone: 'Telefon alanı zorunludur.',
    address: 'Adres alanı zorunludur.',
  };

  Object.entries(requiredMessages).forEach(([field, message]) => {
    if (!String(data[field] || '').trim()) errors[field] = message;
  });

  if (!isValidTurkishId(String(data.nationalId || ''))) {
    errors.nationalId = 'Geçerli bir T.C. Kimlik No girin.';
  }

  ['previousPaid', 'currentPaid'].forEach((field) => {
    if (!Number.isSafeInteger(data[field]) || data[field] <= 0) {
      errors[field] = 'Geçerli ve sıfırdan büyük bir tutar girin.';
    }
  });

  if (data.listPriceKnown && (!Number.isSafeInteger(data.listPrice) || data.listPrice <= 0)) {
    errors.listPrice = 'Geçerli ve sıfırdan büyük bir liste fiyatı girin.';
  }

  return errors;
}

function generatePetition(data, now = new Date()) {
  const previousPaid = formatMoney(data.previousPaid);
  const currentPaid = formatMoney(data.currentPaid);
  const maxAllowedValue = calculateMaxAllowed(data.previousPaid);
  const maxAllowed = formatMoney(maxAllowedValue);
  const overpaymentValue = calculateOverpayment(data.currentPaid, maxAllowedValue);
  const overpayment = formatMoney(overpaymentValue);
  const increase = formatPercentage(
    calculateIncreasePercentage(data.previousPaid, data.currentPaid),
  );

  const knownListPriceExplanation = `Tarafıma şifahen; önceki yıl uygulanan indirimsiz liste fiyatının (${formatMoney(data.listPrice)}) baz alındığı iddia edilerek iade yapılamayacağı ifade edilmiş, ancak talebime rağmen bu hususun yazılı yasal dayanağı verilmemiştir. Bir önceki yıl fiilen ödenen nihai ücret yerine fiktif liste fiyatlarının baz alınması kanuna karşı hile teşkil etmekte olup YÖK düzenlemelerinde bu yönde bir istisna yer almamaktadır.`;
  const unknownListPriceExplanation = 'Tarafıma şifahen; önceki yıl uygulanan indirimsiz liste fiyatının baz alındığı iddia edilerek iade yapılamayacağı ifade edilmiş, ancak talebime rağmen bu hususun yazılı yasal dayanağı verilmemiştir. Bir önceki yıl fiilen ödenen nihai ücret yerine fiktif liste fiyatlarının baz alınması kanuna karşı hile teşkil etmekte olup YÖK düzenlemelerinde bu yönde bir istisna yer almamaktadır.';
  const knownListPriceRequest = `Talebimin reddi halinde, fiilen ödenen ücret yerine ${formatMoney(data.listPrice)}'nin baz alınmasının hangi mevzuat hükmüne veya YÖK kararına dayandığının 3071 sayılı Dilekçe Hakkının Kullanılmasına Dair Kanun ve 4982 sayılı Bilgi Edinme Hakkı Kanunu uyarınca tarafıma yazılı olarak bildirilmesini saygılarımla arz ve talep ederim.`;
  const unknownListPriceRequest = 'Talebimin reddi halinde, fiilen ödenen ücret yerine indirimsiz liste fiyatının baz alınmasının hangi mevzuat hükmüne veya YÖK kararına dayandığının 3071 sayılı Dilekçe Hakkının Kullanılmasına Dair Kanun ve 4982 sayılı Bilgi Edinme Hakkı Kanunu uyarınca tarafıma yazılı olarak bildirilmesini saygılarımla arz ve talep ederim.';

  return {
    heading: 'İSTANBUL ATLAS ÜNİVERSİTESİ REKTÖRLÜĞÜNE',
    studentRows: [
      ['Adı Soyadı', data.fullName],
      ['T.C. Kimlik No', data.nationalId],
      ['Öğrenci No', data.studentNumber],
      ['Fakülte / Bölüm', `${data.faculty} / ${data.department} / ${data.classLevel}`],
      ['İletişim / Tel', `${data.phone} / ${data.address}`],
    ],
    subject: `2026-2027 Eğitim-Öğretim yılı kayıt yenileme ücretinde YÖK tavan artış sınırının (%25) aşılması nedeniyle oluşan ${overpayment} fazla tahsilatın iadesi ve işlemin yasal dayanağının yazılı bildirimi talebidir.`,
    explanations: [
      `Üniversitenizin yukarıda belirtilen bölümünde kayıtlı öğrenciyim. 2025-2026 eğitim-öğretim yılı öğrenim ücreti olarak tarafımdan ${previousPaid} tahsil edilmiştir.`,
      'Yükseköğretim Kurulu (YÖK) Başkanlığı tarafından alınan karar uyarınca, vakıf yükseköğretim kurumlarında kayıtlı mevcut öğrencilerin 2026-2027 eğitim-öğretim yılı öğrenim ücreti artış oranı azami %25 olarak sınırlandırılmıştır.',
      `Buna göre 2026-2027 eğitim-öğretim yılı için tahsil edilebilecek azami ücret ${maxAllowed} (${previousPaid} + %25) olmasına rağmen, erken ödeme döneminde tarafımdan ${currentPaid} tahsil edilmiştir. Bu durum fiilen %${increase} oranında zamma tekabül etmekte olup YÖK’ün emredici nitelikteki tavan kararının açık ihlalidir.`,
      data.listPriceKnown ? knownListPriceExplanation : unknownListPriceExplanation,
    ],
    requests: [
      `2026-2027 eğitim-öğretim yılı öğrenim ücretimin YÖK kararlarına uygun şekilde bir önceki yıl ödediğim ${previousPaid} üzerinden azami %25 artışla (${maxAllowed} olarak) yeniden hesaplanmasını,`,
      `Fazladan tahsil edilen ${overpayment}'nin tarafıma ivedilikle iade edilmesini,`,
      data.listPriceKnown ? knownListPriceRequest : unknownListPriceRequest,
    ],
    date: formatDate(now),
    signatureName: data.fullName,
    attachments: [
      '2025-2026 Eğitim-Öğretim Yılı Ödeme Dekontu',
      '2026-2027 Eğitim-Öğretim Yılı Ödeme Dekontu',
    ],
    calculations: {
      previousPaid,
      currentPaid,
      maxAllowed,
      overpayment,
      increase,
      overpaymentValue,
    },
  };
}

function petitionToPlainText(model) {
  const studentLines = model.studentRows
    .map(([label, value]) => `${label.padEnd(18, ' ')}: ${value}`)
    .join('\n');
  const explanations = model.explanations
    .map((paragraph, index) => `${index + 1}. ${paragraph}`)
    .join('\n\n');
  const requests = model.requests
    .map((request, index) => `${index + 1}. ${request}`)
    .join('\n');
  const attachments = model.attachments
    .map((attachment, index) => `${index + 1}. ${attachment}`)
    .join('\n');

  return `${model.heading}\n\nÖĞRENCİNİN:\n${studentLines}\n\nKONU : ${model.subject}\n\nAÇIKLAMALAR :\n\n${explanations}\n\nSONUÇ VE TALEP :\n\nYukarıda arz edilen nedenlerle;\n${requests} ${model.date}\n\n${model.signatureName}\n\nİmza\n\nEkler:\n${attachments}`;
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
    isValidTurkishId,
    validateForm,
    generatePetition,
    petitionToPlainText,
  };
}
