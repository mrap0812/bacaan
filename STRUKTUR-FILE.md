# Bacaan PWA – File Structure (Refactored)

**Bacaan** adalah aplikasi Progressive Web App untuk sistem bacaan aktif dengan spaced repetition, catatan bahasa sendiri, uji Feynman, dan target harian pembacaan.

## 📁 Struktur File Modular

Kode telah dipisahkan dari file monolitik `index.html` menjadi struktur modular untuk kemudahan maintenance dan debug:

### Root Files
- **`index.html`** – HTML semantic murni. Tidak ada inline CSS atau JavaScript.
- **`manifest.webmanifest`** – Manifest PWA untuk instalasi ke layar utama.
- **`sw.js`** – Service worker untuk offline support dan caching.

### CSS
- **`css/styles.css`** – Seluruh design system dan styling aplikasi (~800 baris)
  - Variabel CSS (warna, spacing, shadows, typography)
  - Komponen: header, buttons, forms, modals, cards, charts, timer
  - Responsive design dan dark mode

### JavaScript

#### `js/state.js` (~300 baris)
**State management & data persistence**
- `state`, `ui`, `timer`, `revealed` – Global state variables
- `load()`, `save()` – LocalStorage I/O
- `defaults()` – Fresh data structure
- Data models: `newBook()`, `PURPOSE`, `STATUS`
- Date utilities: `dayKey()`, `fmtDate()`, `daysBetween()`, dst.
- Spaced Repetition: `scheduleNext()`, `dueReviews()`, `SR_INTERVALS`
- Reading log: `logToday()`, `currentStreak()`, `longestStreak()`
- UI state: `applyTheme()`, `toggleTheme()`, `toast()`, `undoable()`

#### `js/utils.js` (~250 baris)
**Utility & helper functions**
- Escaping: `esc()`, `escAttr()`
- Book helpers: `initials()`, `coverHTML()`, `allTags()`, `getBook()`
- Timer: `fmtClock()`, `timerElapsed()`
- Search: `globalSearch()`, `openBookAt()`
- Export/Import: `exportData()`, `importData()`
- Backup nudge: `backupNudgeHTML()`, `dismissBackupNudge()`
- Offline state: `updateOnlineState()`

#### `js/ui.js` (dibatasi ~500 baris, lanjutan di app.js)
**Rendering & view functions**
- Main dispatcher: `render()`
- View renderers: `renderLibrary()`, `renderPlanner()`, `renderReview()`, `renderStats()`, `renderMethod()`
- Chart builders: `buildHeatmap()`, `buildBarChart()`, `buildDonut()`, `buildInsights()`
- Helper rings: `planRing()`, `planStat()`

#### `js/app.js` (dibatasi ~600+ baris)
**Application logic & event handlers**
- Book management: `openBook()`, `editBook()`, `deleteBook()`, `showBookModal()`
- Work tabs: `renderDetail()`, `renderWorkTab()`, `tabSetup()`, `tabQuestions()`, dst.
- Form handlers: `showNoteForm()`, `showQuoteForm()`, `showCardForm()`, `showFeynForm()`
- Item actions: `toggleQ()`, `delQ()`, `delNote()`, `delQuote()`, `delCard()`, `delFeyn()`
- Open Library search: `searchOpenLibrary()`
- AI features: `aiCall()`, `aiSuggestQuestions()`, `aiFeynmanFeedback()`
- Settings: `openSettings()`, `modal()`
- Timer: `startTimer()`, `pauseTimer()`, `resetTimer()`, `wireTimer()`, `timerCardHTML()`
- Keyboard shortcuts: `handleKeydown()`, `shortcutsHelp()`, `openCommandPalette()`
- PWA runtime: SW registration, install prompt, update flow, offline detection, deep-links
- Top-level wiring: Event listener setup, keyboard handlers, file input, modal handlers

## 🔄 Dependencies & Load Order

```
index.html
├── css/styles.css (stylesheets)
├── js/state.js (state, data models, persistence)
├── js/utils.js (helpers, depends on state.js)
├── js/ui.js (rendering, depends on state.js + utils.js)
└── js/app.js (logic, depends on all above)
```

Urutan sangat penting: `state.js` harus lebih dulu dari `ui.js` dan `app.js` karena mereka bergantung pada variabel global dan fungsi yang didefinisikan di dalamnya.

## 🎯 Keuntungan Struktur Modular

1. **Maintenance** – Mudah menemukan dan mengubah fitur spesifik
2. **Debug** – Error lebih mudah diidentifikasi karena kode terorganisir
3. **Reusability** – Fungsi utilitas dapat digunakan di tempat lain tanpa duplikasi
4. **Scalability** – Mudah menambah fitur baru tanpa mengotori file utama
5. **Readability** – Setiap file punya tanggung jawab jelas (single responsibility)

## 🚀 Menggunakan Aplikasi

1. Buka `index.html` di browser (atau install sebagai PWA)
2. File akan otomatis load urutan di atas
3. Semua data disimpan di `localStorage` → tidak perlu backend
4. Berjalan offline sepenuhnya (dengan service worker)

## 📝 Catatan Pengembang

- **Tidak ada build process** – Vanilla JS, langsung berjalan di browser
- **Data format** – JSON sederhana di localStorage (key: `bacaan_data_v2`)
- **Export/Import** – File `.json` untuk backup manual
- **PWA features** – Instalasi ke layar utama, offline, update prompt
- **AI integration** – Optional (BYO API key untuk Anthropic/OpenAI)

---

**Bacaan** – Baca cerdas, ingat lama. 📚
