# BUG-002

## Retest 7 Oktober 2026

**PASS → Fixed.** Staging `a9e3c84c` (cherry-pick `2b820ac4`, deploy 7 Okt 2026), Cypress Chrome. TC-026: setelah Batal di popup Ganti Pilihan, checkbox Juz 16 tetap tercentang dan ayat terpilih utuh.

<!-- AUTO:START -->
## Evidence otomatis (2026-10-06)

**Judul:** Popup Ganti Pilihan > Batal: checkbox juz/halaman tetap tidak tercentang padahal pilihan tidak berubah
**TC terkait:** TC-026

Keterangan diff assertion: baris `-` = hasil AKTUAL app, baris `+` = EXPECTED (PRD/keputusan).

### TC-026
![TC-026](TC-026_Tahfidz_-_Capaian_Multi_Select_-_Pilih_Ayat_--_Lepas_pilihan_--_TC-026_Popup_Ganti_Pilihan_Batal_mempertahankan_juz_dan_ayat_failed_.png)

<!-- AUTO:END -->
