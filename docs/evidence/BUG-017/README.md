# BUG-017 — Form Jenis Pengguna: counter/toggle sub-grup tidak reaktif, toggle grup tidak sinkron saat Edit, judul modal Edit salah

**Modul:** Pengaturan > Pengguna > Jenis Pengguna · **Severity:** Low · **Ditemukan:** 6 Oktober 2026 (observasi lewat Claude in Chrome saat TC-IMT-006). Di luar scope tiket Tahfidz, dicatat karena ditemukan saat menguji item Batas Tahfidz.

## Langkah & temuan
1. Login sebagai admin > Pengaturan > Pengguna > Jenis Pengguna > **Tambah**.
2. Grup Pengaturan: centang modul Kesiswaan (sub-modul Tipe Pelanggaran, Perizinan, Batas Tahfidz ikut tercentang, label "Kesiswaan 3/3").
3. Lepas sub-modul **Batas Tahfidz** (level 3).
   - **Expected:** label menjadi "Kesiswaan 2/3" dan toggle sub-grup mati (seperti perilaku level 2: lepas satu modul → toggle grup OFF, counter 9/9 → 8/9).
   - **Actual:** label tetap "Kesiswaan 3/3" dan toggle tetap menyala, padahal hanya 2 yang tercentang (data tersimpan tetap benar).
4. Buka **Edit** jenis pengguna lama (mis. "Khusus Fajar"):
   - grup Administrasi tampil **6/6 tetapi toggle OFF** (toggle grup tidak disinkronkan saat memuat data).
   - judul modal tetap **"Tambah Jenis Pengguna"** padahal sedang mengedit.

## Dampak
Admin salah membaca hak akses yang aktif dan bisa mengira sedang membuat jenis baru.

## Lokasi source (perkiraan)
`app/Http/Livewire/Setting/User/Type.php`, `resources/views/setting/user/type.blade.php`.

## Evidence
Laporan observasi extension 6 Okt 2026 (tanpa screenshot). Belum ada TC otomatis.
