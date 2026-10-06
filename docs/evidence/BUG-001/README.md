# BUG-001 — Program Jenis Juz: step Pilih Surah hilang setelah 1 surah dicentang

Status: **Fixed** — commit `2a2a430e` "fix(tahfidz): keep the Capaian Hafalan dropdowns usable in
the riwayat form", deploy staging 6 Okt 2026 09:20 (GET /healthcheck).

## Bukti sebelum fix
- Element analysis #2 (6 Okt 2026, langkah E.5): setelah Maryam dicentang, seluruh step Pilih Surah
  (label, dropdown, chip) hilang dari DOM; surat kedua tidak bisa dipilih.
- Cypress run 6 Okt 2026 sebelum deploy: TC-011 FAIL
  (`Expected to find element: #modal-progress.show [wire\:key^="step-surah"] .dropdown-menu, but never found it.`).
- Pola kedua (TC-018): halaman pertama 1 surat (hal. 582) -> surat terpilih otomatis -> menambah
  halaman 604 tidak memunculkan step Pilih Surah lagi.

## Bukti sesudah fix (retest)
- Cypress run 6 Okt 2026 sesudah deploy `2a2a430e`: **TC-011 PASS** (Maryam + Taha bisa dipilih,
  Daftar Ayat menampilkan kelompok Maryam dan Taha).

## Penyebab & perbaikan (diff commit 2a2a430e)
`TahfidzUnit::surahOptions()` kini membuang pilihan surah dari `$chosen` sebelum memanggil
`ayatScope()`, sehingga daftar surat tidak lagi tersaring oleh surat yang sudah dipilih.

<!-- AUTO:START -->
## Evidence otomatis (2026-10-06)

**Judul:** Program Jenis Juz: step Pilih Surah hilang setelah 1 surah dicentang, surat kedua tidak bisa dipilih
**TC terkait:** TC-011

Keterangan diff assertion: baris `-` = hasil AKTUAL app, baris `+` = EXPECTED (PRD/keputusan).

<!-- AUTO:END -->
