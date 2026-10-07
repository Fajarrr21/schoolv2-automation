# BUG-009 — Dua riwayat di tanggal yang sama: Pencapaian riwayat pertama ikut menghitung satuan riwayat kedua

**Modul:** Kesiswaan > Tahfidz > Detail Siswa (list Riwayat Progress) · **Severity:** Medium · **Ditemukan:** 6 Oktober 2026 (screenshot run Cypress TC-IMT-105, staging commit `2a2a430e`)

## Langkah
1. Login sebagai admin.
2. Buka Detail Siswa Aisyah Safitri pada Program F (#255, Batas Halaman, target Juz 30 = 23 halaman).
3. Tambah Riwayat: Tanggal = hari ini, tandai Halaman 582, Simpan.
4. Tambah Riwayat lagi: Tanggal = hari ini (sama), tandai Halaman 583, Simpan.
5. Lihat kolom Pencapaian kedua riwayat.

## Expected
Pencapaian riwayat = kumulatif **sampai riwayat itu** (PRD; komentar source `calculateUnitTotal`):
- Riwayat 1 (Halaman 582): `4.35% (1 dari 23 halaman)`
- Riwayat 2 (Halaman 583): `8.70% (2 dari 23 halaman)`

## Actual
Keduanya `8.70% (2 dari 23 halaman)` (lihat screenshot). Grafik/riwayat lama ikut "naik" setiap ada riwayat baru di tanggal yang sama.

![TC-IMT-105 run 1](TC-IMT-105_run1.png)

## Penyebab (source origin/staging, READ-ONLY)
`app/Repositories/TahfidzProgress/TahfidzProgressRepository.php`:
- `recalculateProgressAfter($progress)` mengambil riwayat `activity_date >= tanggal riwayat baru` dan `id != riwayat baru` → **termasuk riwayat lebih lama di tanggal yang sama**.
- `calculateUnitTotal(..., $entry->activity_date, $entry->id)` lalu memakai `activity_date <= tanggal` → ikut memasukkan riwayat yang dibuat **sesudahnya** di tanggal yang sama.

## Saran fix
Pakai urutan (activity_date, id) secara konsisten di kedua fungsi, mis. pada `calculateUnitTotal`:
```php
->where(fn ($q) => $q->where('activity_date', '<', $currentDate)
    ->orWhere(fn ($q) => $q->where('activity_date', $currentDate)->where('id', '<', $currentId)))
```
dan pada `recalculateProgressAfter` hanya riwayat dengan (activity_date, id) lebih besar dari riwayat yang berubah.

## Retest 7 Oktober 2026

**PASS → Fixed.** Staging `a9e3c84c` (cherry-pick `2b820ac4`, deploy 7 Okt 2026), Cypress Chrome. TC-IMT-098: dua riwayat di tanggal yang sama — riwayat pertama tetap 60% (3 dari 5 juz), riwayat kedua 80%.

<!-- AUTO:START -->
## Evidence otomatis (2026-10-06)

**Judul:** Dua riwayat di tanggal sama: Pencapaian riwayat pertama ikut menghitung riwayat kedua
**TC terkait:** TC-IMT-098

Keterangan diff assertion: baris `-` = hasil AKTUAL app, baris `+` = EXPECTED (PRD/keputusan).

### TC-IMT-098
```
-'80% (4 dari 5 juz)'
+'60% (3 dari 5 juz)'
```
![TC-IMT-098](TC-IMT-098_Tahfidz_-_Edit_List_Export_Hapus_Riwayat_Batas_Tahfidz_--_TC-IMT-098_Hapus_riwayat_menghitung_ulang_persentase_failed_.png)

<!-- AUTO:END -->
