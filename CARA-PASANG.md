# Bacaan — Cara Pasang sebagai Aplikasi Android (PWA)

Panduan ini membuat Bacaan bisa dipasang di layar utama HP, berjalan penuh
tanpa internet, dan tampil layar penuh tanpa address bar.

---

## Kenapa harus di-host? (jangan dilewati)

Service worker — bagian yang membuat aplikasi berjalan offline — **hanya
diizinkan berjalan di HTTPS atau localhost.** Ini aturan keamanan browser,
bukan pilihan desain saya.

Artinya: **membuka `index.html` langsung dari penyimpanan HP (`file://`)
tidak akan menjadikannya PWA.** Aplikasinya tetap jalan, tapi tanpa ikon
layar utama, tanpa mode offline, dan tanpa tampilan layar penuh.

GitHub Pages memberi Anda HTTPS gratis dan permanen. Sekali atur, selesai.

---

## Langkah 1 — Buat repository

1. Masuk ke [github.com](https://github.com) (buat akun bila belum punya).
2. Klik **New repository**.
3. Isi nama: **`bacaan`**
4. Pilih **Public**
   *(GitHub Pages gratis mensyaratkan repo publik. Ini hanya berarti kode
   aplikasinya bisa dilihat orang — **data bacaan Anda tetap di HP Anda
   sendiri**, tidak pernah terunggah ke mana pun.)*
5. Klik **Create repository**.

## Langkah 2 — Unggah file

1. Di halaman repo, klik **Add file → Upload files**.
2. Seret **seluruh isi** folder ini:
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - folder `icons/` (beserta 6 file PNG di dalamnya)

   > Penting: unggah **isinya**, bukan foldernya. Struktur harus persis:
   > `index.html` berada di akar repo, dan `icons/` sebagai subfolder.

3. Klik **Commit changes**.

## Langkah 3 — Aktifkan GitHub Pages

1. Buka tab **Settings** di repo Anda.
2. Menu kiri → **Pages**.
3. Bagian *Source*: pilih branch **`main`**, folder **`/ (root)`**.
4. Klik **Save**.
5. Tunggu 1–2 menit. Muat ulang halaman itu — URL Anda akan muncul:

   ```
   https://USERNAME.github.io/bacaan/
   ```

## Langkah 4 — Pasang di Android

1. Buka URL tersebut di **Chrome** pada HP Anda.
2. Tunggu beberapa detik (service worker sedang mendaftar).
3. Akan muncul salah satu dari:
   - tombol **Pasang** di pojok kanan atas aplikasi, **atau**
   - banner "Add to Home screen" dari Chrome, **atau**
   - menu **⋮ → Tambahkan ke layar utama**
4. Setelah terpasang: buka dari ikon layar utama. Tidak ada address bar,
   dan **matikan data pun tetap jalan penuh.**

### iPhone/iPad (bila perlu)
Safari → tombol **Bagikan** → **Add to Home Screen**.
(iOS tidak punya tombol pasang otomatis — ini normal, bukan kesalahan.)

---

## Memperbarui aplikasi nanti

1. Unggah `index.html` yang baru ke repo (Add file → Upload files → timpa).
2. Buka `sw.js`, ubah baris:
   ```js
   const CACHE_VERSION = 'bacaan-v2';
   ```
   menjadi `'bacaan-v3'`, lalu commit.

Angka versi itulah yang memberi tahu browser bahwa ada pembaruan. Tanpa
mengubahnya, HP akan terus memakai versi lama dari cache. Saat Anda buka
aplikasi berikutnya, muncul notifikasi **"Versi baru tersedia"**.

---

## Yang perlu Anda pahami soal data (baca sekali, penting)

**Sekarang lebih aman.** Dulu data terikat ke lokasi file di penyimpanan;
memindahkan file bisa membuat data seolah hilang. Kini data terikat ke
URL `https://USERNAME.github.io/bacaan/` yang **permanen** — selama URL
itu tidak berubah, data Anda aman di perangkat itu.

**Tapi tiga hal ini tetap berlaku dan tidak bisa dihilangkan oleh PWA:**

1. **Tidak ada sinkronisasi HP ↔ laptop.** Setiap perangkat punya
   penyimpanannya sendiri. Sinkronisasi butuh server; aplikasi ini
   sengaja tanpa server agar data Anda tidak pernah keluar dari perangkat.
   Jembatannya: **Ekspor backup** di satu perangkat → **Impor** di
   perangkat lain.

2. **Menghapus data situs = data hilang.** Termasuk "Clear browsing data"
   atau meng-uninstall PWA-nya dengan opsi hapus data.

3. **Backup tetap wajib.** Aplikasi mengingatkan Anda tiap 14 hari.
   File `.json` hasil ekspor itulah satu-satunya salinan yang benar-benar
   milik Anda dan bisa dipindahkan.

**Jangan gunakan mode Incognito/Penyamaran** — data terhapus otomatis saat
jendela ditutup.

---

## Ringkas: apa yang berubah dengan PWA

| | Sebelum (file HTML) | Sesudah (PWA) |
|---|---|---|
| Ikon layar utama | ✗ | ✓ |
| Jalan offline | ✓ (buka file) | ✓ (ikon, layar penuh) |
| Tampilan layar penuh | ✗ | ✓ |
| Origin data | rapuh, ikut path file | permanen, ikut URL |
| Pintasan tekan-lama ikon | ✗ | ✓ Tinjau / Planner |
| Sinkronisasi antar perangkat | ✗ | ✗ (tetap perlu ekspor/impor) |
