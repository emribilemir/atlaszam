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

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function appendLabeledParagraph(root, label, text) {
  const paragraph = createElement('p', 'petition-labeled');
  paragraph.append(createElement('strong', null, `${label} : `));
  paragraph.append(document.createTextNode(text));
  root.append(paragraph);
}

function renderPetition(model, root) {
  root.replaceChildren();

  root.append(createElement('h1', 'petition-title', model.heading));

  const studentSection = createElement('section', 'petition-student');
  studentSection.append(createElement('h2', 'petition-section-title', 'ÖĞRENCİNİN:'));
  const studentList = createElement('dl', 'petition-details');
  model.studentRows.forEach(([label, value]) => {
    studentList.append(createElement('dt', null, label));
    studentList.append(createElement('dd', null, value));
  });
  studentSection.append(studentList);
  root.append(studentSection);

  appendLabeledParagraph(root, 'KONU', model.subject);

  root.append(createElement('h2', 'petition-section-title petition-body-title', 'AÇIKLAMALAR :'));
  const explanationList = createElement('ol', 'petition-list');
  model.explanations.forEach((paragraph) => {
    explanationList.append(createElement('li', null, paragraph));
  });
  root.append(explanationList);

  root.append(createElement('h2', 'petition-section-title petition-body-title', 'SONUÇ VE TALEP :'));
  root.append(createElement('p', 'petition-lead', 'Yukarıda arz edilen nedenlerle;'));
  const requestList = createElement('ol', 'petition-list petition-requests');
  model.requests.forEach((request, index) => {
    const suffix = index === model.requests.length - 1 ? ` ${model.date}` : '';
    requestList.append(createElement('li', null, `${request}${suffix}`));
  });
  root.append(requestList);

  const signature = createElement('div', 'petition-signature');
  signature.append(createElement('strong', null, model.signatureName));
  signature.append(createElement('span', null, 'İmza'));
  root.append(signature);

  const attachments = createElement('section', 'petition-attachments');
  attachments.append(createElement('h2', 'petition-section-title', 'Ekler:'));
  const attachmentList = createElement('ol');
  model.attachments.forEach((attachment) => {
    attachmentList.append(createElement('li', null, attachment));
  });
  attachments.append(attachmentList);
  root.append(attachments);
}

function printPetition() {
  window.print();
}

function initializeApp() {
  const form = document.querySelector('#petition-form');
  if (!form || !Array.isArray(window.ATLAS_DEPARTMENTS)) return;

  const formPanel = document.querySelector('#form-panel');
  const resultSection = document.querySelector('#result-section');
  const resultHeading = document.querySelector('#result-heading');
  const petitionPaper = document.querySelector('#petition-paper');
  const departmentSelect = document.querySelector('#department');
  const facultyInput = document.querySelector('#faculty');
  const listPriceKnown = document.querySelector('#listPriceKnown');
  const listPriceField = document.querySelector('#list-price-field');
  const listPriceInput = document.querySelector('#listPrice');
  const errorSummary = document.querySelector('#form-errors');
  const copyStatus = document.querySelector('#copy-status');
  let currentPetition = null;

  const groups = new Map();
  const quickGroup = createElement('optgroup');
  quickGroup.label = 'Hızlı seçim';

  window.ATLAS_DEPARTMENTS.forEach((department, index) => {
    const option = createElement('option', null, department.name);
    option.value = String(index);
    if (index < 2) {
      quickGroup.append(option);
      return;
    }

    if (!groups.has(department.faculty)) {
      const group = createElement('optgroup');
      group.label = department.faculty;
      groups.set(department.faculty, group);
    }
    groups.get(department.faculty).append(option);
  });

  departmentSelect.append(quickGroup, ...groups.values());
  departmentSelect.value = '0';

  function selectedDepartment() {
    return window.ATLAS_DEPARTMENTS[Number(departmentSelect.value)];
  }

  function updateFaculty() {
    facultyInput.value = selectedDepartment()?.faculty || '';
  }

  function toggleListPrice() {
    const isKnown = listPriceKnown.checked;
    listPriceField.hidden = !isKnown;
    listPriceInput.required = isKnown;
    listPriceKnown.setAttribute('aria-expanded', String(isKnown));
    if (!isKnown) {
      listPriceInput.value = '';
      listPriceInput.removeAttribute('aria-invalid');
      document.querySelector('#error-listPrice').textContent = '';
    }
  }

  function collectFormData() {
    const department = selectedDepartment();
    return {
      fullName: form.elements.fullName.value.trim(),
      nationalId: form.elements.nationalId.value,
      studentNumber: form.elements.studentNumber.value.trim(),
      faculty: department?.faculty || '',
      department: department?.name || '',
      classLevel: form.elements.classLevel.value,
      phone: form.elements.phone.value.trim(),
      address: form.elements.address.value.trim(),
      previousPaid: parseMoney(form.elements.previousPaid.value),
      currentPaid: parseMoney(form.elements.currentPaid.value),
      listPriceKnown: form.elements.listPriceKnown.checked,
      listPrice: form.elements.listPriceKnown.checked
        ? parseMoney(form.elements.listPrice.value)
        : null,
    };
  }

  function clearErrors() {
    errorSummary.hidden = true;
    errorSummary.replaceChildren();
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
      field.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.field-error').forEach((fieldError) => {
      fieldError.textContent = '';
    });
  }

  function showErrors(errors) {
    const entries = Object.entries(errors);
    if (!entries.length) return;

    const heading = createElement('strong', null, 'Lütfen aşağıdaki alanları kontrol edin:');
    const list = createElement('ul');
    entries.forEach(([fieldName, message]) => {
      const field = form.elements[fieldName];
      if (field) field.setAttribute('aria-invalid', 'true');
      const fieldError = document.querySelector(`#error-${fieldName}`);
      if (fieldError) fieldError.textContent = message;
      list.append(createElement('li', null, message));
    });
    errorSummary.append(heading, list);
    errorSummary.hidden = false;

    const firstField = form.elements[entries[0][0]];
    if (firstField) firstField.focus();
    else errorSummary.focus();
  }

  function showOverpaymentWarning() {
    errorSummary.textContent = 'Girdiğiniz tutarlara göre %25 sınırının üzerinde bir tahsilat görünmüyor. Lütfen ödeme tutarlarını kontrol edin.';
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  async function copyPetition() {
    if (!currentPetition) return;
    const text = petitionToPlainText(currentPetition);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.className = 'copy-fallback';
        document.body.append(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      copyStatus.textContent = 'Dilekçe metni kopyalandı.';
    } catch {
      copyStatus.textContent = 'Metin kopyalanamadı. Lütfen tekrar deneyin.';
    }
  }

  updateFaculty();
  toggleListPrice();

  departmentSelect.addEventListener('change', updateFaculty);
  listPriceKnown.addEventListener('change', toggleListPrice);

  form.elements.nationalId.addEventListener('input', (event) => {
    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 11);
  });

  ['previousPaid', 'currentPaid', 'listPrice'].forEach((fieldName) => {
    form.elements[fieldName].addEventListener('blur', (event) => {
      const value = parseMoney(event.currentTarget.value);
      if (value !== null) event.currentTarget.value = formatMoney(value).replace(/ TL$/, '');
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();

    const data = collectFormData();
    const errors = validateForm(data);
    if (Object.keys(errors).length) {
      showErrors(errors);
      return;
    }

    const maxAllowed = calculateMaxAllowed(data.previousPaid);
    if (calculateOverpayment(data.currentPaid, maxAllowed) <= 0) {
      showOverpaymentWarning();
      return;
    }

    currentPetition = generatePetition(data);
    renderPetition(currentPetition, petitionPaper);
    formPanel.hidden = true;
    resultSection.hidden = false;
    resultHeading.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelector('#print-button').addEventListener('click', printPetition);
  document.querySelector('#copy-button').addEventListener('click', copyPetition);
  document.querySelector('#edit-button').addEventListener('click', () => {
    resultSection.hidden = true;
    formPanel.hidden = false;
    copyStatus.textContent = '';
    form.elements.fullName.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeApp);
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
    renderPetition,
    printPetition,
  };
}
