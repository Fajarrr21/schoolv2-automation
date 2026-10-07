# BUG-006 — Popup "Ganti Pilihan?" muncul walau tidak ada ayat yang akan dihapus

Severity: **Low**. Keputusan user Q5 (6 Okt 2026): dicatat sebagai bug.
Bukti: element analysis #2 (6 Okt 2026, extension Claude in Chrome, langkah E.12a),
program QAAUTO Juz Ayat #247, siswa #1082.

## Langkah
1. Detail Siswa > Tambah Riwayat.
2. Pilih Juz 16 dan Juz 30, Halaman 312 (Juz 16) dan 582 (Juz 30), Surah Maryam.
3. Centang Maryam Ayat 96, 97, 98 (semuanya berada di Juz 16).
4. Buka Pilih Juz, lepas centang **Juz 30**.

## Expected (PRD Tambah Riwayat Progress Siswa)
"Ketika admin melepas centang sebuah juz atau halaman **sedangkan sudah ada ayat yang dipilih di
bawahnya**, sistem menampilkan popup konfirmasi 'Ganti Pilihan?' …". Juz 30 tidak memiliki ayat
terpilih, jadi Juz 30 langsung terlepas tanpa popup.

## Actual
Popup tetap muncul dengan pesan "Ayat yang sudah dipilih akan dihapus ketika Anda mengganti pilihan
ini. Lanjutkan?", padahal setelah Ganti tidak ada ayat yang terhapus (V2 hanya membuang ayat yang
keluar dari cakupan lewat `pruneMarkedToScope`). Pesan popup menyesatkan.

HTML popup yang tampil (element analysis #2, E.12a):

```html
<div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
  <div class="bg-white rounded shadow-lg p-8 mx-4">
    <h3 class="fw-bolder mb-3">Ganti Pilihan?</h3>
    <p class="text-gray-700 mb-6"> Ayat yang sudah dipilih akan dihapus ketika Anda mengganti pilihan ini. Lanjutkan? </p>
    <div class="d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-light" wire:click="cancelChangeChoice">Batal</button>
      <button type="button" class="btn btn-primary" wire:click="confirmChangeChoice">Ganti</button>
    </div>
  </div>
</div>
```

## Lokasi di source (origin/staging)
`app/Http/Livewire/StudentAffairs/Tahfidz/MemberDetail.php` — `toggleStepValue()`:

```php
if ($removing && $step !== TahfidzUnit::LIMIT_SURAH && $this->unit_marked !== []) {
    $this->unit_pending = ['step' => $step, 'values' => $next];
    return;
}
```

Kondisinya hanya "ada ayat terpilih", bukan "ada ayat terpilih yang akan terbuang".

## Saran perbaikan
Hitung dulu ayat terpilih yang akan keluar dari cakupan bila pilihan baru diterapkan (susun ulang
cakupan dengan `unit_choice` sementara), lalu set `unit_pending` hanya bila hasilnya tidak kosong.

## Retest 7 Oktober 2026

**PASS → Fixed.** Staging `a9e3c84c` (cherry-pick `2b820ac4`, deploy 7 Okt 2026), Cypress Chrome. TC-025B (TC baru): melepas Juz 30 yang tidak punya ayat terpilih langsung terlepas tanpa popup; Juz 16 dan ayat Taha tetap.

<!-- AUTO:START -->
## Evidence otomatis (2026-10-06)

**Judul:** Popup Ganti Pilihan muncul walau tidak ada ayat terpilih yang akan dihapus
**TC terkait:** -

Keterangan diff assertion: baris `-` = hasil AKTUAL app, baris `+` = EXPECTED (PRD/keputusan).

<!-- AUTO:END -->
