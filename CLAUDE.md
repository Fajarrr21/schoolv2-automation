# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Cypress E2E test suite for **CARDS School V2** (Laravel + Blade + Livewire v2 + Bootstrap 5/Metronic), **staging** (`https://staging-school.cazh.id`). Tests, folder names, and test titles are written in **Bahasa Indonesia** — match that language when adding tests. Structure, conventions, and workflow copy the V3 QA repo `../schoolv3-automation` (READ-ONLY: read and copy patterns, never modify).

> **TARGET = STAGING saja.** Hanya environment `staging`. Jangan tambahkan production.
> - V2 multi-tenant (1 kode, host + DB per sekolah). Repo ini menguji SATU host sekolah staging.
> - Staging = **data bersama** tim lain. Spec CRUD membuat & menghapus riwayat progres di staging.
> - **Jangan run Cypress tanpa diminta** — user yang menjalankan.
> - **Data test hanya program tahfidz + siswa KHUSUS QA** di blok `staging` fixture `tahfidz.json`. Selama blok itu kosong, spec **fail-fast** dengan pesan jelas. Jangan pakai siswa/program milik orang lain.
> - Setiap riwayat buatan test ditandai **Deskripsi = `QA<6-digit-timestamp><seq>`**.
> - **Cleanup WAJIB**: `cypress/e2e/stagingv2/cleanup/cleanupTahfidz.cy.js` hanya menghapus riwayat **milik siswa QA** yang Deskripsi-nya `startsWith("QA")`. Alasan: fitur "satu satuan hanya tercatat pada satu riwayat" (commit 228d96e9) — riwayat yang tertinggal **mengunci ayatnya**, run berikutnya gagal palsu.
> - **Jangan** memakai akun untuk submit lupa/reset/ganti password atau PIN.

### Referensi kode app (READ-ONLY)

- Source V2 = `../cazh/cazh-cards-dashboard`. Bandingkan dengan **`origin/staging`** (`master` = production). Yang ter-deploy bisa dicek: `GET /healthcheck` → `git.commit` (5 Okt 2026 = `4c4882d0`; 6 Okt 2026 09:20 = `2a2a430e`, fix BUG-001 + dropdown tidak menutup sendiri; 6 Okt 2026 11:25 = `153647d9`, refactor `TahfidzUnit::deriveChoice` untuk form Edit + API, tanpa fix bug tiket 2).
- **Staging bisa di-deploy ulang di tengah sesi.** Sebelum menganalisis kegagalan yang "tiba-tiba", cek `/healthcheck`. Commit baru yang belum ada di `origin/staging` lokal dibaca **lewat GitHub API (read-only)**, mis. `gh api repos/CazhID/cazh-cards-dashboard/compare/<lama>...<baru>` dan `gh api repos/CazhID/cazh-cards-dashboard/commits/<sha>` — JANGAN `git fetch` di repo referensi.
- **Repo itu TIDAK BOLEH diubah** — baca saja: `git show origin/staging:<path>`, `git grep ... origin/staging`, `git log origin/staging`. Jangan checkout/fetch/pull/stash.
- Repo lain di `../cazh/` (cazh-infra, Cazh-Main-System, banking/notification/hub/whatsapp-service) juga hanya dibaca.
- File relevan modul Tahfidz:
  - `app/Http/Livewire/StudentAffairs/Tahfidz/{Index,Detail,MemberDetail}.php` (MemberDetail = form riwayat)
  - `app/Http/Livewire/StudentAffairs/Tahfidz/Datatable/{MemberDatatable,ProgressHistoryDatatable}.php`
  - `app/Http/Livewire/Member/DetailMember/Table/TahfidzDatatable.php` (tab Tahfidz di Anggota > Detail)
  - `app/Utilities/TahfidzUnit.php` (langkah, opsi, format capaian `compactNumbers`), `app/Models/TahfidzProgress.php`
  - `resources/views/student-affairs/tahfidz/*`, `resources/views/member/detail-member/table/tahfidz-table-row.blade.php`
  - `routes/cazh/student-affairs.php` (prefix `student-affairs`), `routes/cazh/setting.php`
  - Commit fitur: `228d96e9` (ayat terkunci), `decda14a` (API multi select), `d11e866b` (form web), `e33b0cf8` (fix tombol Simpan)
- Source dipakai untuk cross-check selector/teks/validasi. Tetap konfirmasi lewat HTML asli.
- **V2 BUKAN shadcn/Radix.** Jangan bawa `data-slot`, `svg.lucide-*`, toast Sonner dari V3. Selector V2 ditemukan lewat element analysis (`docs/REFERENSI_ELEMEN.md`).

### Environment (staging saja)

- **URL**: `cypress/config/environments.js` (`staging: { baseUrl, loginPath: '/login' }`). **Kredensial**: `cypress.env.json` → `creds.staging` — **RAHASIA, git-ignored** (template `cypress.env.example.json`). Fallback CI: `CYPRESS_STAGING_EMAIL` / `CYPRESS_STAGING_PASSWORD`.
- Environment default = staging; nilai lain → run dibatalkan (`cypress.config.js`).
- Login V2 = form POST `/login` (CSRF, cookie session) → redirect `/home`. Bukan API JSON.

### Data QA modul Tahfidz (blok `staging` di `cypress/fixtures/tahfidz.json`)

- Siswa QA `#1082`. PRG-A = `QAAUTO Juz Ayat #247` (Jenis Juz, Batas Ayat) untuk navigasi langkah Juz/Halaman/Surah & popup Ganti Pilihan.
- **PRG-SA (Jenis Surah, Batas Ayat) WAJIB**: target Maryam, Taha, An-Naba', An-Nazi'at, 'Abasa, At-Takwir (390 ayat). Semua skenario **multi surat** (rentang lintas surat, ayat terkunci, penulisan, export, hapus) jalan di sini karena **BUG-001**: di Jenis Juz step Pilih Surah hilang setelah 1 surah dicentang.
- PRG-J/H/S dan RS opsional → TC terkait di-skip (Blocked) lewat `perluData()`. Data wajib kosong → `stagingData()` fail-fast.
- Riwayat pengunci (RL dsb.) dibuat spec di `before()` dan dihapus di `after()`; nomor ayat tiap TC digeser supaya tidak saling mengunci.
- Mushaf: halaman = value absolut (`toggleStepValue('halaman', 312)`), Juz 16 = 302–321, Juz 30 = 582–604, hal. 312 = Maryam 96–98 + awal Taha.

## App reference (baca duluan)

- `cypress/fixtures/app.json` — route map, akun, notifikasi, Livewire. Label `verified` / `crosschecked` / `unverified`.
- `cypress/fixtures/tahfidz.json` — route, label, pesan, teks placeholder, data test, blok `staging` (data QA).
- `docs/REFERENSI_ELEMEN.md` — selector V2 + statusnya.
- `docs/test-cases/TC_Tahfidz_CapaianMultiSelect.xlsx` — sheet TC (TC-### = MSC-### testcase manual user).

## Commands

- Only `cypress/e2e/stagingv2/**/*.cy.{js,ts}` is scanned.
- `npm run cy:open` / `npm run cy:run`. `npm test` = clean → run → report (`run-s`, jangan `&`).
- `npm run cy:smoke` (login), `npm run cy:tahfidz` (semua spec modul, urut), `npm run cy:tahfidz:<spec>`, `npm run cy:cleanup:tahfidz` (cleanup, dijalankan sendiri & sengaja).
- Tiket 2 "Improvement Tahfidz" (Batas Tahfidz): `npm run cy:batas` (pengaturan + 7 spec `Kesiswaan/Tahfidz/improvement-batas/`), `npm run cy:batas:<spec>`, `npm run cy:pengaturan:batas`, `npm run cy:cleanup:batas` (riwayat QA program A–F + pulihkan pengaturan instansi QA).

### Data QA tiket 2 (`cypress/fixtures/batas.json`)
- Program A–F (#249, #251–#255) per kombinasi Jenis × Batas, siswa QA #1082. Program #250 milik orang lain — jangan disentuh.
- Instansi QA = **SMP Digital Indonesia+** (nilai awal Ayat / per juz). Spec boleh mengubah lalu WAJIB memulihkan (`pulihkanPengaturan`). **Jangan pernah menyimpan form Tambah pengaturan** (permanen, tidak ada hapus) dan **jangan menyimpan form Tambah program** (mengirim notifikasi "Tahfidz Baru").
- Siswa tanpa foto di V2 menyimpan URL avatar otomatis (`ui-avatars.com`), bukan null.
- Radio/select Livewire yang sudah bernilai sama tidak mengirim request → jangan `cy.wait` request untuk nilai default.
- `retries: 0` — a flaky failure is a real failure.

## Git

- `git init` sudah. **Commit hanya kalau diminta.**
- **JANGAN** tambahkan baris `Co-Authored-By: Claude` atau atribusi Claude apa pun di commit/PR (instruksi user, menang atas default).

## Workflow

- **PRD-first**: semua dari tiket + PRD Notion. Jangan mengarang requirement. Butir ambigu → Sumber `PRD-ambigu` + pertanyaan di Catatan.
- **Urutan**: sheet TC → element analysis (minta HTML asli, jangan menebak) → kode (POM + spec + fixture) → cleanup.
- **Urutan spec**: Tambah → Pilih ayat/rentang/terkunci → Penulisan capaian → Edit → Export → Hapus (ayat kembali tersedia + persentase dihitung ulang) → cleanup.
- **Generate first, don't run Cypress.**
- `node --check <file>` tiap file JS. False alarm yang boleh diabaikan: `Cannot use import statement outside a module` pada file ESM (package.json `type: commonjs`; Cypress yang bundling).

## Test conventions

- **POM**: class singleton (`export default new XxxPage()`) di `cypress/support/pageobjects/`, getter di objek `elements`, method chainable (`return this`). Nilai hipotesis ditandai `(?)`; **jangan menulis spec di atas nilai `(?)`**.
- **Selectors**: id / `name` / `wire:model` / `wire:click` / scope dari label (`formItem(label)` = `label.parent()`) / row-by-text (`cy.contains('table tbody tr', teks)`). Exact match pakai `rx()`.
- **Native `.click()`** — jangan cypress-real-events.
- **Tidak ada `cy.wait(<angka>)`.** Pakai `cy.intercept` + `cy.wait('@alias')`. Livewire v2: `POST **/livewire/message/<komponen>` di-alias per aksi (`cy.livewireAlias`). Untuk state loading, perlambat response lewat intercept (`setDelay`), bukan jeda angka.
- **Livewire v2 — jebakan yang sudah terbukti (run 6 Okt 2026):**
  - `cy.wait('@alias')` selesai saat response TIBA; morph DOM terjadi sesudahnya → selalu ikuti dengan `cy.livewireIdle()` (hook `message.sent/processed` dipasang di `e2e.js`), dan bila perlu bukti DOM (chip berubah, step hilang).
  - Ada request susulan asinkron (`re_render_table` → `update_history`) yang bikin antrean alias bergeser → untuk simpan/hapus pakai `cy.tungguLivewireBerisi(alias, [dispatch modal-hide, pesan])`, jangan `cy.wait` biasa.
  - Alert flash sukses dirender lalu langsung hilang (render ulang tanpa flash) → verifikasi pesan dari RESPONSE, bukan DOM.
  - Bootstrap mengabaikan `hide()` selama fade-in → `cy.modalStabil(selector)` sebelum klik apa pun di modal.
  - Dropdown step tertutup sendiri tiap morph → klik opsi lewat `RiwayatProgresForm.dalamDropdown()` (buka ulang bila tertutup, tanpa `force`).
- **Cypress 16**: `Cypress.env()` sudah dihapus → non-rahasia `Cypress.expose()`, kredensial `cy.env([...])`. Support file dimuat sekali per proses run — jangan ubah `commands.js` saat run sedang berjalan.
- **Multi-row assertion**: `.should(callback)` + `Cypress.$`, jangan `.each()` + `cy.wrap()`. Teks yang ditunggu berubah → `.should(cb)`, bukan `.invoke().then()` (tidak di-retry).
- **Persistence**: verifikasi dengan reload halaman (riwayat tersimpan, persentase terhitung ulang).
- **Auth**: `beforeEach` clear cookies/localStorage lalu `LoginPage.loginViaSession()` (cy.session).
- **Naming**: `describe` bersarang per grup skenario; `it` = `TC-### : <deskripsi>`.
- **Format capaian**: `compactNumbers` / `formatCapaian` di `cypress/support/helpers.js` menyusun EXPECTED dari data uji (contoh `ayat 1-3, 7, 10`). Pola per surat dari fixture, bukan di-hardcode.

## Test case sheet (xlsx)

- Kolom: `ID | Kategori | Skenario | Pre-condition | Langkah | Test Data | Expected | Sumber | Status | Catatan`.
- Kategori: Happy / Positif / Negatif / Edge (tanpa security/injection). Sumber: PRD / PRD-ambigu / Asumsi.
- Status: Belum dijalankan / PASS / FAIL (+`BUG-###` di Catatan) / Blocked / Manual / Tidak diotomasi.
- Cards Edu (mobile), notifikasi, dan sinkronisasi lintas platform = sheet "Tidak Diotomasi".

## Known bugs

Fixture mencatat bug yang diketahui sebagai `bug: { ... }` dengan id `BUG-###`. Test meng-assert perilaku yang **BENAR** supaya tetap merah sampai bug diperbaiki.

## Bug tracker

- Sumber kebenaran = `bugs.csv` (di-commit). `Bug_Tracker_QA_CARDS.xlsx` = hasil generate (`python scripts/build_bug_tracker.py`), jangan diedit manual.
- Tambah bug: `/bug <deskripsi>` atau append `bugs.csv` lalu regenerate. ID mulai `BUG-001`, 3 digit.
- Kolom: `Bug ID, Tiket, Module, Title, Steps to Reproduce, Expected Result, Actual Result, Severity, Priority, Reporter, Status, Date Found, Video Evidence, Screenshot Evidence`.
- Tiket: `Tiket 1 - Capaian Multi Select` / `Tiket 2 - Improvement Batas Tahfidz` / `Di luar tiket`. xlsx berisi satu sheet per tiket + sheet `Semua Bug`.
- Severity High/Medium/Low. Steps bernomor mulai `1. Login sebagai admin`. Reporter default `Fajar Ardiansyah`, Status default `Open`, Date Found `DD Bulan YYYY`.
- **Evidence WAJIB** (permintaan user): screenshot (bukan video — berat) di `docs/evidence/BUG-xxx/` (DI-COMMIT; `cypress/screenshots` git-ignored & dihapus tiap run) + `README.md` berisi langkah, expected vs actual, lokasi source, saran fix. Kolom `Screenshot Evidence` di `bugs.csv` berisi path relatif. Otomatis: daftarkan TC di fixture `bug.BUG-xxx.tc`, lalu `python scripts/collect_evidence.py <log-run>` (salin screenshot gagal + kutip assertion dari log). Bug tanpa TC (mis. temuan element analysis) → README manual.
- Run cleanup pakai `--config trashAssetsBeforeRuns=false` supaya screenshot run sebelumnya tidak terhapus sebelum dikumpulkan.
- Tiket 2: `python scripts/collect_evidence.py <log> cypress/fixtures/batas.json`. Kumpulkan evidence SEBELUM run berikutnya (run baru menghapus `cypress/screenshots`).
