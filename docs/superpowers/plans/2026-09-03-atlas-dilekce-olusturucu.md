# Atlas Dilekçe Oluşturucu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İstanbul Atlas Üniversitesi lisans ve önlisans öğrencilerinin kişisel bilgilerini ve öğrenim ücretlerini girerek sabit hukuki metinden güvenli, yazdırılabilir bir A4 dilekçe oluşturduğu statik GitHub Pages uygulamasını teslim etmek.

**Architecture:** `index.html` erişilebilir tek sayfa kabuğunu, `style.css` ekran ve print düzenini, `data/departments.js` resmî program/fakülte eşlemesini taşır. `app.js` saf hesaplama/doğrulama/dilekçe modeli fonksiyonlarını ve tarayıcı DOM bağlayıcısını birlikte barındırır; saf fonksiyonlar Node'un yerleşik test koşucusuna CommonJS üzerinden açılırken tarayıcıda build olmadan çalışır.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, Node.js built-in `node:test` (yalnızca geliştirme doğrulaması), native browser print ve Clipboard API.

**Spec:** `docs/superpowers/specs/2026-09-03-atlas-dilekce-olusturucu-design.md`

## Global Constraints

- Uygulama GitHub Pages üzerinde herhangi bir build, route, backend veya API olmadan çalışmalıdır.
- Runtime bağımlılığı, CDN, analytics, cookie, `localStorage`, `sessionStorage` veya IndexedDB kullanılmamalıdır.
- Kullanıcının sağladığı dilekçe metnindeki hukuki ifadeler, yalnızca şartnamede izin verilen liste fiyatı varyantları dışında değiştirilmemelidir.
- Kişisel bilgiler yalnızca tarayıcı belleğinde işlenmeli ve hiçbir ağ isteğine eklenmemelidir.
- Kullanıcı girdisi dilekçe önizlemesine `innerHTML` ile aktarılmamalıdır.
- Relative asset yolları kullanılmalı; uygulama `https://USERNAME.github.io/REPO-NAME/` altında çalışmalıdır.
- Bilgisayar Mühendisliği varsayılan seçili olmalı; yalnızca lisans ve önlisans programları listelenmelidir.
- Para değerleri kuruş integer olarak hesaplanmalı ve Türkçe biçimde gösterilmelidir.
- Print çıktısında yalnızca A4 dilekçe görünmelidir.

---

### Task 1: Para, tarih ve tavan hesaplama çekirdeği

**Files:**
- Create: `tests/app.test.js`
- Create: `app.js`

**Interfaces:**
- Consumes: kullanıcı para metinleri ve kuruş integer değerleri.
- Produces: `parseMoney(value): number|null`, `formatMoney(kurus): string`, `calculateMaxAllowed(previousPaid): number`, `calculateOverpayment(currentPaid, maxAllowed): number`, `calculateIncreasePercentage(previousPaid, currentPaid): number`, `formatPercentage(value): string`, `formatDate(date): string`.

- [ ] **Step 1: Write the failing calculation tests**

```js
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

test('parses supported Turkish money inputs into integer kuruş', () => {
  assert.equal(parseMoney('282750'), 28_275_000);
  assert.equal(parseMoney('282.750'), 28_275_000);
  assert.equal(parseMoney('282750,00'), 28_275_000);
  assert.equal(parseMoney('282.750,50 TL'), 28_275_050);
  assert.equal(parseMoney(''), null);
  assert.equal(parseMoney('abc'), null);
});

test('formats integer kuruş in Turkish format', () => {
  assert.equal(formatMoney(28_275_000), '282.750,00 TL');
  assert.equal(formatMoney(35_343_750), '353.437,50 TL');
});

test('calculates the 25 percent ceiling and overpayment without float cents', () => {
  const maxAllowed = calculateMaxAllowed(28_275_000);
  assert.equal(maxAllowed, 35_343_750);
  assert.equal(calculateOverpayment(42_498_000, maxAllowed), 7_154_250);
});

test('calculates and formats the actual increase percentage', () => {
  const increase = calculateIncreasePercentage(28_275_000, 42_498_000);
  assert.equal(formatPercentage(increase), '50,30');
});

test('formats petition date as dd.mm.yyyy', () => {
  assert.equal(formatDate(new Date(2026, 8, 3)), '03.09.2026');
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/app.test.js`

Expected: FAIL because `../app.js` does not exist or the exported functions are undefined.

- [ ] **Step 3: Implement the minimal pure helpers in `app.js`**

Implement exact behavior:

```js
function calculateMaxAllowed(previousPaid) {
  return Math.round((previousPaid * 125) / 100);
}

function calculateOverpayment(currentPaid, maxAllowed) {
  return currentPaid - maxAllowed;
}

function calculateIncreasePercentage(previousPaid, currentPaid) {
  return ((currentPaid / previousPaid) - 1) * 100;
}
```

`parseMoney` must remove spaces and `TL`, distinguish Turkish decimal comma from grouping dots, reject malformed/non-positive syntax, and return integer kuruş. `formatMoney` must use `Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`. Export helpers only under `if (typeof module !== 'undefined' && module.exports)`.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `node --test tests/app.test.js`

Expected: 5 tests pass, 0 fail.

- [ ] **Step 5: Commit the calculation core**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add petition calculation utilities"
```

---

### Task 2: Kimlik doğrulama ve sabit dilekçe modeli

**Files:**
- Modify: `tests/app.test.js`
- Modify: `app.js`

**Interfaces:**
- Consumes: Task 1 para/tarih yardımcıları; `{ fullName, nationalId, studentNumber, faculty, department, classLevel, phone, address, previousPaid, currentPaid, listPriceKnown, listPrice }` form modeli.
- Produces: `isValidTurkishId(value): boolean`, `validateForm(data): Record<string,string>`, `generatePetition(data, now): PetitionModel`, `petitionToPlainText(model): string`.

- [ ] **Step 1: Add failing validation and petition tests**

Append tests that assert:

```js
test('validates a Turkish identity number checksum', () => {
  assert.equal(isValidTurkishId('10000000146'), true);
  assert.equal(isValidTurkishId('10000000145'), false);
  assert.equal(isValidTurkishId('00000000000'), false);
});

test('rejects missing fields and non-positive fees', () => {
  const errors = validateForm({
    fullName: '', nationalId: '123', studentNumber: '', department: '',
    classLevel: '', phone: '', address: '', previousPaid: null,
    currentPaid: 0, listPriceKnown: false, listPrice: null,
  });
  assert.equal(errors.fullName, 'Ad soyad alanı zorunludur.');
  assert.equal(errors.nationalId, 'Geçerli bir T.C. Kimlik No girin.');
  assert.equal(errors.previousPaid, 'Geçerli ve sıfırdan büyük bir tutar girin.');
});

test('generates the known-list-price petition without changing legal clauses', () => {
  const petition = generatePetition(validForm({ listPriceKnown: true, listPrice: 35_757_000 }), new Date(2026, 8, 3));
  const text = petitionToPlainText(petition);
  assert.match(text, /357\.570,00 TL/);
  assert.match(text, /YÖK’ün emredici nitelikteki tavan kararının açık ihlalidir\./);
  assert.match(text, /kanuna karşı hile teşkil etmekte olup/);
  assert.match(text, /Emir Bilici\nİmza/);
});

test('omits invented numbers when list price is unknown', () => {
  const petition = generatePetition(validForm({ listPriceKnown: false, listPrice: null }), new Date(2026, 8, 3));
  const text = petitionToPlainText(petition);
  assert.match(text, /indirimsiz liste fiyatının baz alındığı/);
  assert.doesNotMatch(text, /\(null TL\)|\[LİSTE FİYATI\]/);
  assert.match(text, /fiilen ödenen ücret yerine indirimsiz liste fiyatının baz alınmasının/);
});
```

Define `validForm(overrides = {})` in the test with the prompt's example values, `faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi'`, `department: 'Bilgisayar Mühendisliği'`, and `classLevel: '4. Sınıf'`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/app.test.js`

Expected: existing Task 1 tests pass; new tests fail because the new APIs are not exported.

- [ ] **Step 3: Implement validation and petition generation**

Implement the standard Turkish identity checksum:

```js
const digits = value.split('').map(Number);
const tenth = ((digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
  - (digits[1] + digits[3] + digits[5] + digits[7])) % 10;
const eleventh = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;
```

`generatePetition` must return ordered sections (`heading`, `studentRows`, `subject`, `explanations`, `requests`, `date`, `signatureName`, `attachments`) using the exact supplied legal sentences. Select only the two explicitly permitted paragraph/request variants based on `listPriceKnown`. It must calculate `maxAllowed`, `overpayment`, and the percentage through Task 1 helpers.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `node --test tests/app.test.js`

Expected: all tests pass, 0 fail.

- [ ] **Step 5: Commit validation and petition behavior**

```bash
git add app.js tests/app.test.js
git commit -m "feat: validate inputs and generate fixed petition text"
```

---

### Task 3: Resmî program verisi ve erişilebilir form kabuğu

**Files:**
- Create: `data/departments.js`
- Create: `index.html`
- Modify: `tests/app.test.js`

**Interfaces:**
- Consumes: İstanbul Atlas Üniversitesi AKTS/Bilgi Paketi lisans ve önlisans listesi.
- Produces: `ATLAS_DEPARTMENTS: Array<{ name: string, faculty: string }>` globali/CommonJS export'u; `#petition-form` ve Task 4'ün bağlayacağı sabit DOM id'leri.

- [ ] **Step 1: Add failing static-contract tests**

Add tests using `node:fs` and `require('../data/departments.js')`:

```js
test('keeps Computer Engineering first and excludes graduate programs', () => {
  assert.deepEqual(ATLAS_DEPARTMENTS[0], {
    name: 'Bilgisayar Mühendisliği',
    faculty: 'Mühendislik ve Doğa Bilimleri Fakültesi',
  });
  assert.equal(ATLAS_DEPARTMENTS.some(({ name }) => /\(YL\)|\(DR\)/.test(name)), false);
  assert.equal(ATLAS_DEPARTMENTS.some(({ faculty }) => faculty === 'Meslek Yüksekokulu'), true);
});

test('HTML exposes accessible required fields and privacy copy', () => {
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<html lang="tr">/);
  assert.match(html, /autocomplete="name"/);
  assert.match(html, /autocomplete="tel"/);
  assert.match(html, /autocomplete="street-address"/);
  assert.match(html, /name="nationalId"[^>]*inputmode="numeric"[^>]*maxlength="11"[^>]*autocomplete="off"/);
  assert.match(html, /Girdiğiniz bilgiler cihazınızda işlenir\./);
  assert.match(html, /DİLEKÇEYİ OLUŞTUR/);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/app.test.js`

Expected: FAIL because `data/departments.js` and `index.html` do not exist.

- [ ] **Step 3: Create the department dataset and semantic HTML**

Populate the dataset from the official program page, including all undergraduate and associate programs in the spec and excluding all graduate entries. Put Turkish and English Computer Engineering first, then group remaining entries by faculty/MYO. Export with:

```js
if (typeof window !== 'undefined') window.ATLAS_DEPARTMENTS = ATLAS_DEPARTMENTS;
if (typeof module !== 'undefined' && module.exports) module.exports = { ATLAS_DEPARTMENTS };
```

Create semantic `header`, `main`, `form`, `fieldset`, explicit labels, per-field error slots, privacy notice, hidden optional list-price region, hidden alert summary, hidden result/action region, and an empty `#petition-paper`. Load `./data/departments.js` before deferred `./app.js` with relative paths.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/app.test.js`

Expected: all tests pass, 0 fail.

- [ ] **Step 5: Commit data and markup**

```bash
git add data/departments.js index.html tests/app.test.js
git commit -m "feat: add official programs and accessible form"
```

---

### Task 4: Tarayıcı akışı, güvenli DOM render ve A4 tasarım

**Files:**
- Modify: `app.js`
- Create: `style.css`
- Modify: `tests/app.test.js`

**Interfaces:**
- Consumes: Task 2 `PetitionModel`, Task 3 DOM id'leri ve `window.ATLAS_DEPARTMENTS`.
- Produces: `renderPetition(model, root): void`, `printPetition(): void`, form submit/list-price/edit/copy/print etkileşimleri ve ekran/print CSS'i.

- [ ] **Step 1: Add failing security and UI-contract tests**

Add source-contract assertions:

```js
test('client code avoids persistent storage, network submission, and unsafe HTML sinks', () => {
  const source = readFileSync(join(__dirname, '..', 'app.js'), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /textContent\s*=/);
  assert.match(source, /window\.print\(\)/);
});

test('styles define A4 print output and accessible interaction states', () => {
  const css = readFileSync(join(__dirname, '..', 'style.css'), 'utf8');
  assert.match(css, /width:\s*210mm/);
  assert.match(css, /min-height:\s*297mm/);
  assert.match(css, /@media print/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/app.test.js`

Expected: FAIL because DOM render/wiring and `style.css` do not yet exist.

- [ ] **Step 3: Implement DOM wiring and secure petition renderer**

On `DOMContentLoaded`, populate the department select, keep Computer Engineering selected, mirror the faculty in a readonly status field, toggle the list-price region and `required` state, sanitize the national ID to 11 digits, and format money fields on blur without losing parseability.

On submit: prevent default, collect values, call `validateForm`, set `aria-invalid`, write field errors with `textContent`, focus the first invalid field, stop on non-positive overpayment with the exact requested warning, otherwise generate and render the petition, hide the form panel, reveal the result, and focus `#result-heading`.

`renderPetition` must build elements with `document.createElement`, set all dynamic values with `textContent`, and preserve paragraph/request numbering. Copy must use `navigator.clipboard.writeText(petitionToPlainText(model))` with a textarea/`document.execCommand('copy')` fallback for older/mobile Safari. `printPetition` calls `window.print()`.

- [ ] **Step 4: Implement responsive and print CSS**

Use system fonts only. Define a restrained navy/white/neutral token palette with WCAG AA contrast, a form max-width near 720px, 44px controls, visible focus rings, single-column mobile layout, and an A4 paper using `width: 210mm; min-height: 297mm`. Under `@media print`, set `@page { size: A4; margin: 0; }`, hide everything except the petition result, remove paper shadow, and preserve readable page margins inside the paper.

- [ ] **Step 5: Run tests and browser verification**

Run: `node --test tests/app.test.js`

Expected: all tests pass, 0 fail.

Then run: `python3 -m http.server 4173`

Use a browser at `http://127.0.0.1:4173/` to verify desktop and iPhone-sized viewports: initial Computer Engineering selection, checkbox reveal/hide, invalid-field focus, exact example calculation (`353.437,50 TL`, `71.542,50 TL`, `%50,30`), unknown list-price wording, copy action, edit action, and print preview containing only the petition.

- [ ] **Step 6: Commit the complete interaction**

```bash
git add app.js style.css tests/app.test.js
git commit -m "feat: render and print accessible A4 petition"
```

---

### Task 5: README, final privacy audit and acceptance verification

**Files:**
- Create: `README.md`
- Modify: `tests/app.test.js`

**Interfaces:**
- Consumes: completed static application and original acceptance criteria.
- Produces: deploy/use/privacy/legal documentation and final verification evidence.

- [ ] **Step 1: Add a failing README contract test**

```js
test('README documents purpose, privacy, legal scope, and GitHub Pages deployment', () => {
  const readme = readFileSync(join(__dirname, '..', 'README.md'), 'utf8');
  assert.match(readme, /## Projenin amacı/);
  assert.match(readme, /## Kullanım/);
  assert.match(readme, /## GitHub Pages/);
  assert.match(readme, /## Gizlilik/);
  assert.match(readme, /## Hukuki not/);
  assert.match(readme, /kişisel bilgileri herhangi bir sunucuya göndermez/i);
  assert.match(readme, /Settings.*Pages.*Deploy from a branch/s);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/app.test.js`

Expected: README test fails because `README.md` does not exist; all earlier tests pass.

- [ ] **Step 3: Write the README**

Document the project's purpose, four-step usage, zero-build GitHub Pages deployment (`Settings → Pages → Deploy from a branch → main → /root`), the complete privacy meaning from the prompt, and that the legal text is an existing user-provided template rather than legal advice. Mention that tests run with `node --test tests/app.test.js` but are not required for deployment.

- [ ] **Step 4: Run the complete automated verification**

Run:

```bash
node --test tests/app.test.js
git diff --check
rg -n "localStorage|sessionStorage|indexedDB|fetch\\s*\\(|XMLHttpRequest|\\.innerHTML\\s*=" --glob '!docs/**' .
```

Expected: all tests pass; `git diff --check` exits 0; the privacy/security scan returns no matches in production files.

- [ ] **Step 5: Perform final acceptance walkthrough**

Re-read the original prompt and verify every completion criterion against source or browser evidence. Specifically inspect Safari-friendly autocomplete/inputmode attributes, exact legal clauses, optional list-price variants, auto date, department/faculty behavior, positive-overpayment gate, A4-only print output, keyboard focus order, mobile layout, and absence of personal-data persistence/network submission.

- [ ] **Step 6: Commit documentation and final tests**

```bash
git add README.md tests/app.test.js
git commit -m "docs: add deployment privacy and usage guide"
```
