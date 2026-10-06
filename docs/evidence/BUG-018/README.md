# BUG-018 — Form Pengguna & Jenis Pengguna: nama dipaksa Title Case dan pesan sistem kurang informatif

**Modul:** Pengaturan > Pengguna (Daftar & Jenis Pengguna) · **Severity:** Low (improvement) · **Ditemukan:** 6 Oktober 2026 (observasi lewat Claude in Chrome saat menyiapkan akun QA). Di luar scope tiket Tahfidz.

## Temuan
1. **Nama jenis pengguna dipaksa Title Case.** Input "QA BT Semua" tampil "Qa Bt Semua" di kartu jenis pengguna dan dropdown Role → akronim rusak.
   *Expected:* nama disimpan/ditampilkan sesuai input.
2. **Pesan error email tidak memberi jalan keluar.** Tambah Pengguna dengan email yang sudah terdaftar di akun Cazh: "Upss! Terjadi Kesalahan — Email sudah terdaftar dengan nomor HP berbeda. Silakan gunakan email lain atau masuk dengan akun yang sudah ada." Mengganti No HP tidak membantu.
   *Expected:* pesan menjelaskan email terikat ke akun Cazh lain (tanpa membocorkan No HP), atau ada opsi menautkan akun yang sudah ada.
3. **Tidak ada info kredensial.** Pesan sukses hanya "Pengguna berhasil ditambahkan !"; password akun baru dikirim Cazh Main System lewat email tanpa pemberitahuan di layar.
   *Expected:* pesan sukses menyebut "Password dikirim ke <email>".
4. **Tidak ada item hak akses Dashboard** di form Jenis Pengguna (catatan; hak akses minimum tidak bisa memakai "Dashboard: Lihat").

## Lokasi source (perkiraan)
`app/Http/Livewire/Setting/User/{Index,Type}.php`, `app/Repositories/User/UserRepository.php::create` (register lewat `CazhAuth`, email dikirim dari Main System).

## Evidence
Laporan observasi extension 6 Okt 2026 (tanpa screenshot).
