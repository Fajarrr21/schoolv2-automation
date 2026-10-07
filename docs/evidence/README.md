# Evidence Bug — QA CARDS School V2 (staging)

> Di-generate oleh `python scripts/build_bug_tracker.py` dari `bugs.csv` — jangan diedit manual.
> Tiap folder `BUG-xxx/` berisi `README.md` (langkah, expected vs actual, lokasi source, saran fix) + screenshot.

## Tiket 1 - Capaian Multi Select

5 bug · 4 belum selesai · High 1 / Medium 1 / Low 3

| Prioritas | Bug | Severity | Status | Judul | TC terkait | Evidence |
|---|---|---|---|---|---|---|
| P01 | BUG-001 | High | Fixed | Program Jenis Juz: step Pilih Surah hilang setelah 1 surah dicentang, surat kedua tidak bisa dipilih | TC-011 | [BUG-001/](BUG-001/README.md) |
| P02 | BUG-002 | Medium | Open | Popup Ganti Pilihan > Batal: checkbox juz/halaman tetap tidak tercentang padahal pilihan tidak berubah | TC-026 | [BUG-002/](BUG-002/README.md) |
| P04 | BUG-004 | Low | Open | Daftar Ayat tidak dimuat otomatis saat digulir, lanjutan hanya lewat tombol Muat ayat berikutnya | TC-031 | [BUG-004/](BUG-004/README.md) |
| P05 | BUG-005 | Low | Open | Penulisan Capaian Hafalan tidak sesuai PRD: tanpa prefix 'QS.' dan kata 'Ayat' berhuruf kapital | TC-081, TC-082, TC-083, TC-084, TC-085, TC-086, TC-090, TC-091 | [BUG-005/](BUG-005/README.md) |
| P06 | BUG-006 | Low | Open | Popup Ganti Pilihan muncul walau tidak ada ayat terpilih yang akan dihapus | - | [BUG-006/](BUG-006/README.md) |

## Tiket 2 - Improvement Batas Tahfidz

10 bug · 10 belum selesai · High 3 / Medium 2 / Low 5

| Prioritas | Bug | Severity | Status | Judul | TC terkait | Evidence |
|---|---|---|---|---|---|---|
| P07 | BUG-008 | High | Open | Filter Batas Tahfidz di Detail program selalu HTTP 500 | TC-IMT-057, TC-IMT-058, TC-IMT-059, TC-IMT-060, TC-IMT-061, TC-IMT-063, TC-IMT-064 | [BUG-008/](BUG-008/README.md) |
| P08 | BUG-007 | High | Open | Detail program: anggota tampil '-', 0%, 'Belum ada riwayat' bila riwayat terbarunya ada di program lain | TC-IMT-095, TC-IMT-098 | [BUG-007/](BUG-007/README.md) |
| P09 | BUG-016 | High | Open | Hak akses Batas Tahfidz tidak punya aksi Lihat/Tambah/Ubah; tombol Tambah & Edit tidak dicek izinnya | TC-IMT-002, TC-IMT-003, TC-IMT-004, TC-IMT-005 | [BUG-016/](BUG-016/README.md) |
| P10 | BUG-009 | Medium | Open | Dua riwayat di tanggal sama: Pencapaian riwayat pertama ikut menghitung satuan riwayat kedua | TC-IMT-098 | [BUG-009/](BUG-009/README.md) |
| P11 | BUG-010 | Medium | Open | Riwayat lama ikut berubah penomoran halamannya setelah metode instansi diganti | TC-IMT-105 | [BUG-010/](BUG-010/README.md) |
| P12 | BUG-011 | Low | Open | Ganti Jenis Tahfidz: Batas diganti default instansi (bukan Surah) dan keterangan 'disesuaikan' tidak tampil | TC-IMT-032 | [BUG-011/](BUG-011/README.md) |
| P13 | BUG-012 | Low | Open | Card Data Siswa (Detail Siswa Tahfidz) tidak menampilkan Batas Tahfidz | TC-IMT-071 | [BUG-012/](BUG-012/README.md) |
| P14 | BUG-013 | Low | Open | Filter Batas Tahfidz: tingkat dengan satu pilihan tetap ditampilkan | TC-IMT-062 | [BUG-013/](BUG-013/README.md) |
| P15 | BUG-014 | Low | Open | Form Tambah pengaturan Batas Tahfidz: Simpan aktif sebelum Instansi dipilih | TC-IMT-017 | [BUG-014/](BUG-014/README.md) |
| P16 | BUG-015 | Low | Open | Pengaturan Batas Tahfidz: tidak ada pesan gagal muat / gagal simpan, teks sesi berakhir bukan versi PRD | TC-IMT-012, TC-IMT-021, TC-IMT-022 | [BUG-015/](BUG-015/README.md) |

## Di luar tiket

3 bug · 3 belum selesai · High 1 / Medium 0 / Low 2

| Prioritas | Bug | Severity | Status | Judul | TC terkait | Evidence |
|---|---|---|---|---|---|---|
| P03 | BUG-003 | High | Open | Data office termasuk field berbentuk hash password bocor ke HTML list program tahfidz | - | [BUG-003/](BUG-003/README.md) |
| P17 | BUG-017 | Low | Open | Form Jenis Pengguna: counter/toggle sub-grup tidak reaktif, toggle grup tidak sinkron saat Edit, judul modal Edit salah | - | [BUG-017/](BUG-017/README.md) |
| P18 | BUG-018 | Low | Open | Form Pengguna/Jenis Pengguna: nama dipaksa Title Case, pesan error email & pesan sukses kurang informatif | - | [BUG-018/](BUG-018/README.md) |
