# Referensi Elemen — CARDS School V2 (staging)

Status per elemen: **verified** (dilihat di HTML asli / run) · **crosschecked** (dari source
`../cazh/cazh-cards-dashboard` `origin/staging`, belum dilihat di HTML asli) · **unverified** (hipotesis).

Commit staging yang ter-deploy (GET `/healthcheck`, 5 Okt 2026): `4c4882d0` = `origin/staging`.

**Element analysis #1 (5 Okt 2026, extension Claude in Chrome, read-only):** bagian A (login),
B (list program), C (detail program) → **verified**.
**Element analysis #2 (6 Okt 2026):** bagian D (Detail Siswa), E (modal Tambah Riwayat), F (tab
Tahfidz di Anggota) pada program `QAAUTO Juz Ayat` #247, siswa #1082 → **verified**; selector §4–§5
yang tertulis "crosschecked" di bawah sudah dilihat di HTML asli kecuali yang diberi catatan.
Belum dilihat langsung: modal Hapus (§6), isi file export (§7), form Edit, popup bentrok simpan.

V2 = Bootstrap 5 + Metronic + Livewire v2 + Alpine. **Tidak ada** `data-slot`, `svg.lucide-*`, Sonner.

## 0. Pola umum (verified)

- **Anchor baris tabel**: `tr[wire\:key="table-row-{id}"]` (id program di list program, id
  member di list anggota). Lebih stabil daripada `:nth-child` / row-by-text.
- **Menu Aksi baris = Alpine, bukan Bootstrap/Metronic**: `div[x-data="{ open: false }"]` →
  `button` teks "Aksi" → `div.menu` dapat class `show` via `x-bind:class`. Di Cypress: klik
  `td:last-child button` (teks Aksi) → `.menu.show a.menu-link` (exact text) → tutup dengan
  Escape / klik luar. Komponen `<x-tables.action-button>` dipakai juga oleh tabel riwayat
  (crosschecked).
- **Header kolom aksi kosong** (`thead th` terakhir tanpa label) → jangan index kolom lewat teks header.
- **Derau DOM**: komponen `utilities.offline` selalu ada di DOM ("Waduhhh, internetnya mati
  nih ...", "Anda sedang tidak terhubung ke internet"). Jangan `cy.contains` longgar di `body`.
- **Derau console**: halaman detail program melempar `SyntaxError: Invalid or unexpected token`
  (`/student-affairs/tahfidz/detail/{id}:0:0`). Tidak memblok UI; sudah dicatat (tidak
  menggagalkan) oleh `cypress/support/e2e.js`.
- **Pencarian rappasoft**: `input[wire\:model="filters.search"]` (placeholder "Cari"), substring
  case-insensitive ("QA" ikut cocok dengan "al ba-qa-rah") → nama/penanda harus unik.

## 1. Login — `resources/views/auth/login.blade.php` (verified)

| Elemen | Selector | Status |
|---|---|---|
| Form | `form[action$="/login"][method="POST"]` (action absolut `https://staging-school.cazh.id/login`) | verified |
| Email | `input#email[name="email"]` | verified |
| Password | `input[name="password"]` (type dipasang Alpine `:type`, jangan pilih via type) | verified |
| Submit | `form[action$="/login"] button[type="submit"]` teks "Masuk" | verified |
| Lupa password | `a[href$="/password/reset"]` — **JANGAN diklik/di-submit** | verified |
| Redirect sukses | `/home` (RouteServiceProvider::HOME) | crosschecked |
| Pesan gagal login | `<x-alert.validation/>` / `@error('email')` | unverified |

## 2. Route Tahfidz & komponen Livewire

| Halaman | Path | Komponen Livewire utama | Status |
|---|---|---|---|
| List program | `/student-affairs/tahfidz` | `student-affairs.tahfidz.index` + `student-affairs.tahfidz.datatable` | verified |
| Detail program | `/student-affairs/tahfidz/detail/{id}` | `student-affairs.tahfidz.detail` + `student-affairs.tahfidz.datatable.member-datatable` | verified |
| Detail Siswa | `/student-affairs/tahfidz/detail/{tahfidz_id}/member/{member_id}` | `student-affairs.tahfidz.member-detail` (+ `...datatable.progress-history-datatable`) | path verified (href), komponen crosschecked |

Komponen global di setiap halaman: `utilities.offline`, `utilities.search-no-card`,
`utilities.search-member-header`, `utilities.theme`.
Request Livewire v2: `POST /livewire/message/<nama-komponen>` (crosschecked; URL request
belum dilihat di Network — bagian E).

## 2b. List program — `/student-affairs/tahfidz` (verified)

- Header: `Nama Program | Target | Deskripsi | Instansi | Kelas | Jurusan | Anggota | Dibuat Oleh | Tanggal Dibuat | (kosong)`.
  **Tidak ada** kolom Jenis / Batas Tahfidz (hanya di card Detail program).
- Nama program = `td:first-child a[href$="/student-affairs/tahfidz/detail/{id}"]`.
- Target = `span.badge.badge-info` (maks 3) + `span.badge.badge-warning` "{n}+".
- Aksi: **Detail, Edit, Hapus**. Edit/Hapus = `$emit('set_edit_tahfidz'|'set_delete_tahfidz', {payload})` — lihat temuan keamanan di §9.
- Paginasi 10 baris/halaman.

## 3. Detail program — `/student-affairs/tahfidz/detail/{id}` (verified)

- Card info: `.card.shadow-sm.mb-5` → `h2` nama program, `p.text-muted` "{Tipe} - {Target}"
  (contoh "Satuan - Juz 1 sampai Juz 30"), `p.fw-bold` instansi, "Batas Tahfidz:" +
  `.badge.badge-light-primary` ("Ayat"), `p.text-gray-700` deskripsi.
- Header tabel anggota: `Nama | No Kartu | Batas Tahfidz | Pencapaian | Terakhir Update | (kosong)`.
- Baris: `tr[wire\:key="table-row-{memberId}"]`; nama = 2 link `a[href$="/detail/{id}/member/{memberId}"]`
  (avatar + `a.text-gray-800.fw-bold`); Batas Tahfidz "-" (`span.text-muted`) bila belum ada
  riwayat; Pencapaian `.badge.badge-light-primary` "0% (0 dari 6236 ayat)"; Terakhir Update
  "Belum ada riwayat".
- Menu Aksi baris anggota: **Detail, Hapus** saja. Teks "Tambah Riwayat" **tidak ada sama
  sekali** di halaman ini (dicek `body.innerText`). → Q1 terkonfirmasi di HTML asli, calon BUG.

## 4. Detail Siswa — header & riwayat (`member-detail.blade.php`)

| Elemen | Selector | Status |
|---|---|---|
| Tombol Tambah Riwayat | `button[wire\:click="modalForm"]` teks "Tambah Riwayat" | crosschecked |
| Tombol Excel | `button[wire\:click*="export_table_tahfidz_progress_history"]` | crosschecked |
| Grafik | `#chart-tahfidz-progress` (ApexCharts) | crosschecked |
| Tabel riwayat | rappasoft bs5 table; kolom: Tanggal Dibuat, Tanggal Riwayat, Deskripsi (dipotong 50 char), Capaian Hafalan, Pencapaian (`.badge.badge-light-primary`), Dibuat Oleh, Aksi | crosschecked |
| Aksi baris | dropdown `<x-tables.action-button>` → `a.menu-link` "Edit" / "Hapus" (`$emit('set_edit'|'set_delete')`) | crosschecked |
| Pencarian tabel | kolom Deskripsi `searchable()` → input search rappasoft (?) | unverified |
| Notifikasi | `.alert.bg-primary` (sukses) / `.alert.bg-danger` (gagal) | crosschecked |

Pesan: "Riwayat progress berhasil ditambahkan!" / "...berhasil diedit!" / "...berhasil dihapus!".

## 5. Modal Tambah/Edit Riwayat — `#modal-progress`

`<x-modal>` = `div.modal.fade#modal-progress` → `.modal-content` → `form[wire\:submit\.prevent="submit"]`.
Judul `h2`: "Tambah Riwayat Progress" / "Edit Riwayat Progress". Urutan isi: **Capaian Hafalan → Tanggal → Deskripsi**.

| Elemen | Selector / teks | Status |
|---|---|---|
| Label langkah | `label.form-label` "Pilih Juz" / "Pilih Halaman" / "Pilih Surah" | crosschecked |
| Toggle dropdown | `button[data-bs-toggle="dropdown"]` teks "Pilih Juz" / "{n} Juz dipilih" | crosschecked |
| Cari dalam dropdown | `input[wire\:model\.debounce\.300ms="step_search.juz"]` (placeholder "Cari Juz") | crosschecked |
| Opsi dropdown | `.dropdown-menu label.form-check` → `input[type=checkbox][wire\:click^="toggleStepValue('juz'"]` + `.form-check-label` | crosschecked |
| Kosong di dropdown | "{Juz} tidak ditemukan." | crosschecked |
| Chip | `span.badge.bg-light-primary` + `i.las.la-times[wire\:click^="removeStepValue("]` | crosschecked |
| Label section | "Tandai Ayat yang sudah hafal" | crosschecked |
| Cari Ayat | `input[wire\:model\.debounce\.300ms="unit_search"]` placeholder "Cari Ayat" | crosschecked |
| Pilih Rentang | `button[wire\:click="toggleRangePanel"]` "Pilih Rentang Ayat" | crosschecked |
| Pilih Semua | `button[wire\:click="markAllVisibleUnits"]` "Pilih Semua Ayat" / "Pilih Semua Hasil" | crosschecked |
| Hapus Semua | `button[wire\:click="askClearMarkedUnits"]` "Hapus Semua Ayat Terpilih" | crosschecked |
| Dari / Sampai | `select[wire\:model="range_from"]` / `select[wire\:model="range_to"]`, opsi "Taha - Ayat 5" | crosschecked |
| Terapkan | `button[wire\:click="applyRange"]` | crosschecked |
| Keterangan rentang | `.bg-light-primary .fs-7.text-gray-700` | crosschecked |
| Ayat Terpilih jumlah | "{n} ayat terpilih" + `span.badge.badge-light-primary` "{Surat} {n}" | crosschecked |
| Ayat Terpilih item | `span.badge.bg-light` → label "Ayat n" + `i[wire\:click^="unmarkUnit("]` | crosschecked |
| Ayat Terpilih kosong | "Belum ada ayat yang dipilih." | crosschecked |
| Daftar Ayat — header surat | `div.fw-bold.text-gray-800` (nama surat) + `span.text-muted.fs-8` "{n} ayat" | crosschecked |
| Daftar Ayat — checkbox | `input.form-check-input[type=checkbox][wire\:model="unit_marked"][value="19:5"]` (kunci `surah:ayat`) | crosschecked |
| Ayat terkunci | `input[type=checkbox][checked][disabled]` (tanpa wire:model) + `i.las.la-lock[title="Sudah tercatat pada riwayat lain"]` | crosschecked |
| Muat berikutnya | `button[wire\:click^="showMoreUnits("]` "Muat ayat berikutnya" (60/kelompok) | crosschecked |
| Loading | "Memuat daftar ayat..." (`wire:loading`) | crosschecked |
| Gagal | "Daftar ayat gagal dimuat." + `button[wire\:click="retryUnitOptions"]` "Coba Lagi" | crosschecked |
| Kosong | "Ayat tidak ditemukan." / "Tidak ada ayat pada pilihan ini." / "Lengkapi pilihan di atas terlebih dahulu" | crosschecked |
| Semua terkunci | "Seluruh ayat pada pilihan ini sudah tercatat pada riwayat lain." | crosschecked |
| Popup Ganti Pilihan | overlay `div.position-fixed` (BUKAN modal Bootstrap), `h3` "Ganti Pilihan?", tombol `wire:click="cancelChangeChoice"` Batal / `confirmChangeChoice` Ganti | crosschecked |
| Popup Hapus Semua | `h3` "Hapus Semua Ayat Terpilih?", `cancelClearMarkedUnits` Batal / `clearMarkedUnits` Hapus Semua | crosschecked |
| Tanggal | `input[type=date][wire\:model\.defer="activity_date"]` label "Tanggal" | crosschecked |
| Deskripsi | `input[type=text][wire\:model\.defer="description"]` | crosschecked |
| Batal | `.modal-footer button[wire\:click="reset_field"]` | crosschecked |
| Simpan | `.modal.show .modal-footer button[type="submit"]` (teks "Simpan", saat submit "Tunggu Sebentar..."; TIDAK pernah disabled kecuali loading/offline) | verified |
| Error validasi | `@error('unit_list')` → `<x-error.validation>` "Pilih minimal satu satuan yang sudah hafal." | crosschecked |

## 6. Modal Hapus Riwayat — `#modal-progress-delete`

Judul "Hapus Riwayat Progress", teks `Apakah anda yakin menghapus Riwayat Progress Tahfidz "{tanggal}" - {posisi} ?`, tombol Batal / Hapus (`<x-buttons.submit target="delete">`).

## 7. Export Riwayat — `progress/export.blade.php`

Header: `No | Tanggal Dibuat | Tanggal Riwayat | Capaian Hafalan | Deskripsi | Pencapaian | Dibuat Oleh`.
Capaian Hafalan = `achievement_display` (lengkap). Nama file "Riwayat Progress Tahfidz" (?) via `exportToExcel()`.

## 8. Format capaian (source `TahfidzUnit`)

- Batas Ayat: `"{Surat} Ayat {compactNumbers}"` per surat, dipisah `", "`, urut mushaf. List: maks 2 surat lalu `" +{n} surat"`. Export: lengkap. **PRD meminta `QS. {Surat} ayat …` (Q2).**
- Batas Juz: `"Juz 1-3, 5"`. Batas Halaman: `"Halaman 1-3, 7"` (per juz bila penomoran per juz). Batas Surah: nama surat dipisah koma.
- Pencapaian: `"{persen}% ({done} dari {total} {satuan})"` — persen bulat tanpa desimal, selain itu 2 desimal.
- Nama surat dari `Constant::QURAN_SURAHS`: 19 Maryam (98), 20 **Taha** (135), 78 An-Naba' (40), 79 An-Nazi'at, 80 'Abasa.

## 9. Temuan di luar tiket (dari element analysis #1)

**Data office bocor ke HTML list program** — `resources/views/student-affairs/tahfidz/table-row.blade.php`
(origin/staging) baris 86: `$emit('set_edit_tahfidz', {{ json_encode(array_merge($row->toArray(), …)) }})`
dan baris 89: `$emit('set_delete_tahfidz', {{ $row }})`. Relasi `offices` ikut ter-serialize dan
model `Office` tidak punya `$hidden`, jadi setiap baris memuat ±8.500 karakter JSON berisi
seluruh kolom office, termasuk field berbentuk hash bcrypt, `main_user_id`, dan
`end_date_support_access` (laporan extension; isinya sengaja tidak disalin). Terkonfirmasi
source + HTML. Bukan cakupan TC (konvensi: tanpa security case) → kandidat entri `bugs.csv`.


## 10. Hasil element analysis #2 — perilaku yang memengaruhi POM (verified)

- **Request**: semua aksi di modal = `POST /livewire/message/student-affairs.tahfidz.member-detail` (200).
  Tabel riwayat = komponen `student-affairs.tahfidz.datatable.progress-history-datatable`.
- **Modal** `#modal-progress` & `#modal-progress-delete` selalu ada di DOM (`modal fade`) → cek `.show`.
- **Dropdown step menutup sendiri** setiap re-render Livewire (centang item / ketik cari), walau
  `data-bs-auto-close="outside"` → POM membuka ulang sebelum setiap klik (`bukaStep`).
- **wire:key step berubah** tiap render (`step-juz-1` → `step-juz-2`) → `[wire\:key^="step-juz"]`.
- **Label halaman tidak stabil**: "Juz 16 - Halaman 11" (≥2 juz) vs "Halaman 11" (1 juz). Anchor =
  value mushaf absolut `toggleStepValue('halaman', 312)`. Juz 16 = 302–321, Juz 30 = 582–604.
- **Halaman 312** (Juz 16 hal. 11) memuat akhir Maryam (96–98) + awal Taha. Hal. 312 + 582 → opsi
  surah Maryam, Taha, An-Naba'.
- **BUG-001**: di Jenis Juz step Pilih Surah HILANG setelah 1 surah dicentang (tidak ada chip surah).
- **BUG-002**: setelah popup Ganti Pilihan > Batal, checkbox juz tetap tidak tercentang.
- **Popup Ganti Pilihan** muncul bila ADA ayat terpilih, walau juz yang dilepas tidak menyumbang ayat (Q5).
- **Daftar Ayat**: 60 item per surat; badge = total ("76 ayat"); digulir sampai dasar TIDAK memuat
  lagi; lanjutan lewat `showMoreUnits('<surahId>')` (Q3).
- **Cari Ayat**: hanya nomor ayat; "Taha" → "Ayat tidak ditemukan."; label tombol jadi "Pilih Semua Hasil".
- **Rentang**: opsi "Sampai" mulai 1 ayat sesudah "Dari"; keterangan "{n} ayat ditambahkan." menghitung
  yang BARU ditambahkan; Terapkan disabled lagi setelah diterapkan, nilai select tetap.
- **Ayat Terpilih**: badge "Maryam 3" + chip per ayat (`unmarkUnit('19:96')`), urut mushaf; hapus chip
  ikut melepas checkbox.
- **Tab Tahfidz Anggota**: `/member/student/detail/{memberId}` → `#kt_tab_pane_tahfidz`, baris
  `tr[wire:key="table-row-{tahfidzId}"]` (id PROGRAM), capaian `span.fw-bold.fs-7.text-nowrap`
  "0% (0 dari 6236 ayat)". Link tab `a[href="#kt_tab_pane_tahfidz"]` (?) belum dilihat.
- **Belum dikonfirmasi**: modal tertutup lewat klik backdrop saat form terisi (sekali teramati, isian hilang).
