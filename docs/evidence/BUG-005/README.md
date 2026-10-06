# BUG-005

<!-- AUTO:START -->
## Evidence otomatis (2026-10-06)

**Judul:** Penulisan capaian tanpa 'QS.' dan 'Ayat' kapital (PRD: 'QS. {surat} ayat {ayat}')
**TC terkait:** TC-081, TC-082, TC-083, TC-084, TC-085, TC-086, TC-090, TC-091

Keterangan diff assertion: baris `-` = hasil AKTUAL app, baris `+` = EXPECTED (PRD/keputusan).

### TC-081
```
-'Taha Ayat 1-10'
+'QS. Taha ayat 1-10'
```
![TC-081](TC-081_Tahfidz_-_Capaian_Multi_Select_-_Penulisan_Capaian_--_Batas_Ayat_--_TC-081_Ayat_berurutan_ditulis_sebagai_rentang_failed_.png)

### TC-082
```
-'Taha Ayat 11-13, 17, 20'
+'QS. Taha ayat 11-13, 17, 20'
```
![TC-082](TC-082_Tahfidz_-_Capaian_Multi_Select_-_Penulisan_Capaian_--_Batas_Ayat_--_TC-082_Ayat_loncat_dipisah_koma_failed_.png)

### TC-083
```
-'Taha Ayat 21-25, 27-30'
+'QS. Taha ayat 21-25, 27-30'
```
![TC-083](TC-083_Tahfidz_-_Capaian_Multi_Select_-_Penulisan_Capaian_--_Batas_Ayat_--_TC-083_Rentang_hanya_dipakai_bila_seluruh_ayat_pada_rentang_terca.png)

### TC-084
```
-'Maryam Ayat 1-3, Taha Ayat 130-135'
+'QS. Maryam ayat 1-3, QS. Taha ayat 130-135'
```
![TC-084](TC-084_Tahfidz_-_Capaian_Multi_Select_-_Penulisan_Capaian_--_Batas_Ayat_--_TC-084_Dua_surat_ditulis_per_surat_dipisah_koma_failed_.png)

### TC-085
```
-'An-Naba\' Ayat 1-2, An-Nazi\'at Ayat 1-2 +2 surat'
+'QS. An-Naba\' ayat 1-2, QS. An-Nazi\'at ayat 1-2 +2 surat'
```
![TC-085](TC-085_Tahfidz_-_Capaian_Multi_Select_-_Penulisan_Capaian_--_Batas_Ayat_--_TC-085_Lebih_dari_dua_surat_menampilkan_dua_surat_pertama_lalu_ju.png)

### TC-086
```
-'Maryam Ayat 40, Taha Ayat 40'
+'QS. Maryam ayat 40, QS. Taha ayat 40'
```
![TC-086](TC-086_Tahfidz_-_Capaian_Multi_Select_-_Penulisan_Capaian_--_Batas_Ayat_--_TC-086_Urutan_surat_pada_penulisan_mengikuti_urutan_mushaf_failed.png)

### TC-090
![TC-090](TC-090_Tahfidz_-_Capaian_Multi_Select_-_Export_Riwayat_--_TC-090_Riwayat_lebih_dari_dua_surat_ditulis_lengkap_pada_export_failed_.png)

### TC-091
![TC-091](TC-091_Tahfidz_-_Capaian_Multi_Select_-_Export_Riwayat_--_TC-091_Penulisan_rentang_dan_ayat_loncat_pada_export_sama_dengan_list_failed_.png)

<!-- AUTO:END -->
