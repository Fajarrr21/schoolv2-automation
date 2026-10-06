#!/usr/bin/env python3
"""
Generate docs/test-cases/TC_Tahfidz_ImprovementBatas.xlsx (tiket "Improvement Tahfidz",
eksekusi Cards School V2 saja) dari testcase manual user.

Pakai:
    python scripts/build_tc_improvement.py ["<path Testcase_Improvement_Tahfidz.xlsx>"]

ID: TC-IMT-### = IMT-### di testcase manual (ditelusuri 1:1).
Cross-check source: ../cazh/cazh-cards-dashboard origin/staging (READ-ONLY).
"""
import re
import sys
from collections import Counter

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Fajar\Downloads\Testcase_Improvement_Tahfidz.xlsx"
OUT = r"C:\Users\Fajar\Documents\schoolv2-automation\docs\test-cases\TC_Tahfidz_ImprovementBatas.xlsx"

src = openpyxl.load_workbook(SRC)


def rows(sheet):
    ws = src[sheet]
    hdr = [c.value for c in ws[1]]
    return [dict(zip(hdr, r)) for r in ws.iter_rows(min_row=2, values_only=True) if r[0]]


def num(i):
    return int(i.split("-")[1])


def tc(n):
    return f"TC-IMT-{n:03d}"


school = rows("Cards School")
edu = rows("Cards Edu")
parents = rows("Cards Parents")
lintas = rows("Lintas Platform")

# ---------------------------------------------------------------- Spec V2
SPEC = {}
for n in [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27]:
    SPEC[n] = "Pengaturan/Kesiswaan/batas-tahfidz/pengaturanbatas.cy.js"
for n in list(range(28, 38)):
    SPEC[n] = "Kesiswaan/Tahfidz/improvement-batas/batasprogram.cy.js"
for n in list(range(40, 57)) + [65]:
    SPEC[n] = "Kesiswaan/Tahfidz/improvement-batas/detailprogram.cy.js"
for n in range(57, 65):
    SPEC[n] = "Kesiswaan/Tahfidz/improvement-batas/filterbatas.cy.js"
for n in [66, 67, 68, 69, 71, 99, 100]:
    SPEC[n] = "Kesiswaan/Tahfidz/improvement-batas/detailanggota.cy.js"
for n in range(72, 93):
    SPEC[n] = "Kesiswaan/Tahfidz/improvement-batas/formriwayat.cy.js"
for n in range(93, 99):
    SPEC[n] = "Kesiswaan/Tahfidz/improvement-batas/riwayatbatas.cy.js"
for n in [101, 102, 105]:
    SPEC[n] = "Kesiswaan/Tahfidz/improvement-batas/mushaf.cy.js"

# ---------------------------------------------------------------- Status khusus V2
MANUAL = {
    1: "Butuh akun dengan jenis pengguna khusus (hak akses Batas Tahfidz). Dikumpulkan di akhir.",
    2: "Butuh akun jenis pengguna tanpa hak akses. Dikumpulkan di akhir.",
    3: "Butuh akun jenis pengguna hak akses Lihat saja. Dikumpulkan di akhir.",
    4: "Butuh akun jenis pengguna Lihat + Tambah. Dikumpulkan di akhir.",
    5: "Butuh akun jenis pengguna Lihat + Ubah. Dikumpulkan di akhir.",
    6: "Mengubah form Jenis Pengguna (data bersama). Dikumpulkan di akhir.",
    12: "Butuh koneksi diputus / throttling jaringan; V2 tidak punya pesan gagal muat khusus (rappasoft). Dikumpulkan di akhir.",
    18: "Butuh dua tab bersamaan + menyimpan pengaturan instansi baru (permanen). Dikumpulkan di akhir.",
    21: "Butuh koneksi diputus saat simpan. Dikumpulkan di akhir.",
    22: "Butuh sesi kedaluwarsa (logout di tab lain). Dikumpulkan di akhir.",
    25: "Butuh dua admin bersamaan. Dikumpulkan di akhir.",
    38: "Butuh dua admin bersamaan. Dikumpulkan di akhir.",
    44: "Butuh akun tanpa hak akses detail progres (bila konfigurasinya ada). Dikumpulkan di akhir.",
    70: "Butuh akun tanpa hak akses detail siswa (bila konfigurasinya ada). Dikumpulkan di akhir.",
    103: "Regresi pra-deploy: butuh nilai riwayat sebelum rilis. Dikumpulkan di akhir.",
    104: "Mengubah pengaturan instansi pada program lama milik bersama; dikumpulkan di akhir (atau otomasi bila ada instansi QA).",
}
NA_V2 = {
    103: "Keputusan user 6 Okt 2026 (D5): skip -> N/A. Tidak ada riwayat dari sebelum rilis di staging.",
    104: "Keputusan user 6 Okt 2026 (D5): skip -> N/A (butuh program/riwayat lama sebelum rilis).",
    44: "Source V2: link nama program hanya dicek dengan izin yang sama dengan membuka halaman Tahfidz (MiddlewareMenuAccess::can('student-affairs','tahfidz')); tidak ada konfigurasi 'akses list tanpa detail' -> N/A V2.",
    70: "Source V2 (member/table-row.blade.php): link nama anggota tidak dicek izin sama sekali; tidak ada konfigurasi 'tanpa akses detail siswa' -> N/A V2.",
    39: "Source V2 (origin/staging) tidak punya form Import Tahfidz -> N/A untuk V2.",
    25: "Keputusan user 6 Okt 2026: skip -> N/A. Skenario dua admin mengedit bersamaan tidak memungkinkan dijalankan di staging.",
    33: "Keputusan user 6 Okt 2026: dropdown Batas Tahfidz V2 tidak punya opsi kosong dan selalu terisi default, jadi kondisi 'Batas Tahfidz kosong' tidak bisa dicapai lewat UI -> N/A V2. Catatan: pesan validasi server tetap bawaan Laravel, bukan 'Lengkapi seluruh field yang wajib diisi.'",
}

# Keputusan user 6 Okt 2026: QI = ikut usulan (ubah pengaturan instansi QA lalu
# kembalikan; tambah pengaturan instansi baru = Manual), QP = boleh program
# sementara QAAUTO-TMP, QD = Program A-F dibuat (#249, #251-#255), QS = tidak
# perlu (filter cukup satu anggota). Tidak ada lagi yang Blocked karena keputusan.
BUTUH = {}
MANUAL[16] = "Menambah pengaturan untuk instansi BARU bersifat permanen (tidak ada hapus) — keputusan QI: dikumpulkan di akhir."
MANUAL[34] = "Membuktikan Tipe Masal butuh MENYIMPAN program baru, dan create mengirim notifikasi 'Tahfidz Baru' ke siswa/orang tua. Dikumpulkan di akhir."

# ===== Keputusan dev 6 Okt 2026 =====
# A6: pesan gagal muat / gagal simpan / sesi berakhir belum ada -> bug; diotomasi tanpa
# menyimpan apa pun (request digagalkan intercept / cookie sesi dihapus).
for _n in (12, 21, 22):
    MANUAL.pop(_n, None)
# D1 (boleh tambah pengaturan untuk instansi QA, dihapus lewat DB) -> menunggu nama instansi.
for _n in (16, 18):
    MANUAL.pop(_n, None)
# D2 (boleh, kelas QA) -> menunggu nama kelas. D3 -> menunggu siswa QA kedua.
MANUAL.pop(34, None)
_D8 = " Menunggu jawaban D8 (akun per jenis pengguna)."
for _n in (1, 2, 3, 4, 5):
    MANUAL[_n] += _D8
pass  # D5 = skip (N/A)
pass  # D5 = skip (N/A)

# Data/kondisi yang tidak bisa disiapkan tanpa efek samping (Blocked, bukan gagal).
BLOCKED = {
    46: "Keputusan D4: foto dummy diunggah ke siswa QA lalu dikembalikan ke avatar otomatis. Menunggu file gambar dari user.",
    48: "Keputusan D4: sama dengan TC-IMT-046 (gambar digagalkan lewat intercept). Menunggu file gambar dari user.",
    65: "Keputusan D3: siswa QA kedua dibuatkan. Menunggu data/akun siswa QA kedua.",
    16: "Keputusan D1: boleh menyimpan pengaturan untuk instansi QA (dihapus lewat DB sesudahnya). Menunggu nama instansi QA.",
    18: "Keputusan D1: sama dengan TC-IMT-016. Menunggu nama instansi QA.",
    34: "Keputusan D2: boleh membuat program Masal di kelas QA. Menunggu nama kelas QA (berisi siswa QA saja, karena create mengirim notifikasi).",
}

# Hasil run Cypress (kunci = nomor TC). Nilai: ("PASS"|"FAIL"|"Blocked", catatan).
# Run 6 Okt 2026, Chrome, staging 2a2a430e: run penuh (10:44) + run ulang 4 spec (11:03)
# sesudah perbaikan script (radio Jenis default tidak mengirim request; TC-047 avatar otomatis).
RUN = "Run Cypress 6 Okt 2026 (staging 2a2a430e)"
HASIL = {}
for n in [7, 8, 9, 10, 13, 14, 15, 20, 23, 24, 26, 27, 28, 29, 30, 31, 35, 36, 37,
          40, 41, 42, 43, 45, 47, 49, 50, 51, 52, 53, 54, 55, 56,
          66, 67, 68, 69, 99, 100] + list(range(72, 93)) + [93, 94, 96, 97, 101, 102]:
    HASIL[n] = ("PASS", RUN + ": PASS.")
FAIL = {
    17: "BUG-014", 32: "BUG-011", 57: "BUG-008", 58: "BUG-008", 59: "BUG-008", 60: "BUG-008",
    61: "BUG-008", 63: "BUG-008", 64: "BUG-008", 62: "BUG-013", 71: "BUG-012",
    95: "BUG-007", 98: "BUG-007", 105: "BUG-010",
}
for n, b in FAIL.items():
    HASIL[n] = ("FAIL", f"{RUN}: FAIL -> {b} (evidence docs/evidence/{b}/).")
HASIL[105] = ("FAIL", f"{RUN}: FAIL -> BUG-010. Screenshot yang sama juga memperlihatkan BUG-009 (riwayat pertama di tanggal sama ikut 2 dari 23).")
HASIL[95] = ("FAIL", f"{RUN}: FAIL -> BUG-007. List riwayat & pencapaian riwayat benar (80%); baris anggota di Detail Program tampil '-' / 0%.")
HASIL[98] = ("FAIL", f"{RUN}: FAIL -> BUG-007. Persentase riwayat dihitung ulang benar (60%) dan Juz 29 bebas lagi; baris anggota di Detail Program tampil '-'.")
for _n in (12, 21, 22):
    HASIL[_n] = ("FAIL", f"{RUN} (11:30): FAIL -> BUG-015 (evidence docs/evidence/BUG-015/). Simulasi tanpa menyimpan data: request digagalkan intercept / cookie sesi dihapus.")
HASIL[21] = ("FAIL", HASIL[21][1] + " Bagian 'klik Simpan berkali-kali' belum diuji (butuh simpan sungguhan).")
HASIL[22] = ("FAIL", HASIL[22][1] + " Redirect ke login sudah benar; teks notifikasi 'Sesi Anda Berakhir - Untuk keamanan akun, silakan login kembali.' berbeda dari PRD.")
HASIL[98] = ("FAIL", f"{RUN} (11:30): FAIL -> BUG-009 (riwayat pertama di tanggal sama tampil 80%, expected 60% — keputusan dev B1: urut tanggal lalu id). Juga terdampak BUG-007 (baris anggota Detail Program '-').")
# Run 6 Okt 2026 11:30-12:10 (staging 153647d9 / 88e43584): keputusan D1/D3/D4.
for _n in (16, 18, 46, 48, 65):
    BLOCKED.pop(_n, None)
HASIL[16] = ("PASS", "Run Cypress 6 Okt 2026 11:44 (staging 153647d9): PASS. Pengaturan dibuat untuk 'Digital International School' (office 69535bc689994b001aba0378) -> HAPUS lewat DB (keputusan D1). Dicatat di docs/test-data/pengaturan-baru.json; run berikutnya tidak membuat lagi selama baris masih ada.")
HASIL[18] = ("PASS", "Run Cypress 6 Okt 2026 11:44: PASS. Instansi QA & instansi baru tidak ditawarkan; Simpan dari 'tab kedua' (opsi basi disisipkan) ditolak 'Instansi ini sudah memiliki pengaturan Batas Tahfidz.', tetap satu pengaturan.")
HASIL[46] = ("PASS", "Run Cypress 6 Okt 2026 12:05 (staging 88e43584): PASS dengan foto dummy cypress/fixtures/foto-siswa-qa.jpg (keputusan D4); foto dikembalikan ke avatar otomatis sesudahnya.")
HASIL[48] = ("PASS", "Run Cypress 6 Okt 2026 12:05: PASS. Gambar digagalkan (cy.intercept 404, cache dimatikan) -> inisial tampil.")
HASIL[65] = ("PASS", "Run Cypress 6 Okt 2026 12:05: PASS dengan siswa staging #686 (keputusan D3/no.4); keanggotaan dihapus lagi sesudah test.")
# Laporan extension 6 Okt 2026 (TC-IMT-006) + akun QA "QA BT ..." -> 001..005 diotomasi (hakakses.cy.js).
for _n in (1, 2, 3, 4, 5, 6):
    MANUAL.pop(_n, None)
for _n in (1, 2, 3, 4, 5):
    SPEC[_n] = "Pengaturan/Kesiswaan/batas-tahfidz/hakakses.cy.js"
HASIL[6] = ("FAIL", "Observasi lewat Claude in Chrome 6 Okt 2026: item Pengaturan > Kesiswaan > Batas Tahfidz hanya checkbox on/off, TIDAK ada aksi Semua/Lihat/Tambah/Ubah -> BUG-016. Temuan UI form (counter/toggle tidak reaktif, judul modal Edit) -> BUG-017.")
_RH = "Run Cypress 6 Okt 2026 13:13 (staging 88e43584, akun QA BT)"
HASIL[1] = ("PASS", f"{_RH}: PASS (akun QA BT Semua: submenu tampil, Tambah & Edit tersedia).")
HASIL[2] = ("FAIL", f"{_RH}: FAIL -> BUG-016. Submenu tersembunyi (benar), tetapi halaman tetap bisa dibuka lewat URL langsung.")
HASIL[3] = ("FAIL", f"{_RH}: FAIL -> BUG-016 (tombol Tambah tampil untuk akun Lihat).")
HASIL[4] = ("FAIL", f"{_RH}: FAIL -> BUG-016 (aksi Edit tampil untuk akun Lihat + Tambah).")
HASIL[5] = ("FAIL", f"{_RH}: FAIL -> BUG-016 (tombol Tambah tampil untuk akun Lihat + Ubah).")
SPEC[19] = "Pengaturan/Kesiswaan/batas-tahfidz/hakakses.cy.js"
HASIL[19] = ("PASS", f"{_RH}: PASS dengan akun QA BT Semua (instansinya hanya SMP Digital Indonesia+ yang sudah berpengaturan): Tambah nonaktif + 'Seluruh instansi sudah memiliki pengaturan Batas Tahfidz.'")
HASIL[11] = ("Blocked", f"{RUN}: data staging hanya <= 10 pengaturan; pagination butuh > 10 baris. D1 hanya mengizinkan instansi QA, jadi tetap Blocked.")
# Uji manual 6 Okt 2026 (dua tab admin) + cek read-only Cypress sesudahnya.
MANUAL[38] = ("Uji manual 6 Okt 2026 (dua tab admin, staging 88e43584, Program F #255, Batas Halaman). "
              "Teramati: Simpan dari tab basi ditolak, tetapi banner hanya menampilkan pesan umum 'Upss! Terjadi Kesalahan' "
              "dan dropdown Batas Tahfidz menampilkan 'Ayat' (tidak terkunci). BELUM TERVERIFIKASI: apakah Batas #255 "
              "tetap Halaman sesudah reload (bila berubah ke Ayat = bug High), status response livewire/message (200 validasi atau 500), "
              "dan apakah riwayat uji QA-manual-038 sudah dihapus. Diverifikasi bersama retest sesudah fix.")
BLOCKED[34] = "Keputusan D2: program Masal di kelas QA. Kelas 'QA Tahfidz' (id 45, berisi Aisyah Safitri #1082) SUDAH SIAP; belum dijalankan. Dijalankan bersama retest sesudah fix (create mengirim notifikasi 'Tahfidz Baru' ke siswa QA saja)."


# Koreksi expected: Juz 3 berakhir di tengah halaman 62 (juz 4 dimulai 3:93),
# jadi Juz 2 + Juz 3 = halaman 22-62 = 41 halaman (laporan data user: "0 dari 41
# halaman"; docs/tahfidz_batas_tahfidz.md: halaman 62/121/201/502 milik dua juz).
KOREKSI_41 = "DIKOREKSI dari testcase manual (40 -> 41 halaman): Juz 3 = halaman 42-62, halaman 62 dimiliki Juz 3 & Juz 4 (Mushaf Madinah)."
EXPECTED_OVERRIDE = {
    50: "Batas Tahfidz: Juz 3, Halaman 45. Pencapaian: 24.39% (10 dari 41 halaman).",
    65: "Penambahan berhasil walau program sudah punya riwayat. Anggota baru tampil dengan Batas Tahfidz \"-\" dan 0% (0 dari 41 halaman). Batas Tahfidz program tetap Halaman.",
    77: "Juz 2 hanya menampilkan halaman 22-41. Juz 3 hanya menampilkan halaman 42-62.",
    84: "Juz 30 bernomor 1 s.d. 23. Juz 2 bernomor 1 s.d. 20 dan Juz 3 bernomor 1 s.d. 21.",
    90: "Riwayat tersimpan. Pencapaian 24.39% (10 dari 41 halaman).",
    92: "Pencapaian 7.32% (3 dari 41 halaman) (format V2: 2 desimal, titik).",
    99: "Kolom Capaian menampilkan posisi terakhir beserta persen dan pecahan, contoh Juz 3, Halaman 45 · 24.39% (10 dari 41 halaman).",
}

# ---------------------------------------------------------------- Catatan source V2
SRCNOTE = {
    7: "Source V2 TahfidzLimit/Datatable: kolom Instansi, Batas Tahfidz, Metode Perhitungan Halaman, Dibuat Pada, Aksi; default sort created_at desc. Metode tampil '-' untuk Batas Juz/Surah.",
    8: "Diuji lewat kombinasi filter yang tidak menghasilkan data (tanpa mengosongkan data bersama).",
    9: "Source V2: filter 'Instansi' dan 'Batas Tahfidz' (rappasoft).",
    13: "Source V2: dropdown Instansi = officesWithoutSetting(); default Batas = Halaman, Metode = mushaf; helper text sesuai blade.",
    15: "Source V2: field Metode SELALU tampil & wajib (sesuai keputusan PRD Flag no. 2).",
    16: "Source V2: pesan 'Pengaturan Batas Tahfidz berhasil disimpan.' PERMANEN: tidak ada hapus pengaturan (lihat Pertanyaan QI).",
    17: "Source V2: tombol Simpan TIDAK dinonaktifkan sebelum Instansi dipilih (x-buttons.submit tanpa :disabled); validasi server memakai pesan bawaan Laravel, bukan 'Lengkapi seluruh field yang wajib diisi.' -> calon BUG.",
    19: "Source V2: teks 'Seluruh instansi sudah memiliki pengaturan Batas Tahfidz.' + tombol disabled. Bergantung data seluruh instansi staging.",
    23: "Source V2: pesan 'Perubahan pengaturan Batas Tahfidz berhasil disimpan.' Instansi tampil sebagai input disabled.",
    27: "Source V2: TahfidzUnit::defaultLimit -> Halaman untuk Jenis Juz bila instansi tanpa pengaturan.",
    29: "Source V2: TahfidzUnit::allowedLimits('juz') = juz, halaman, ayat.",
    30: "Source V2: allowedLimits('surah') = surah, ayat.",
    32: "Source V2: flash info 'Pilihan Batas Tahfidz disesuaikan karena Jenis Tahfidz diubah.'",
    33: "Source V2: validasi Laravel 'Batas Tahfidz wajib diisi' (bukan 'Lengkapi seluruh field yang wajib diisi.') -> calon BUG bila field bisa dikosongkan.",
    37: "Source V2: teks 'Batas Tahfidz tidak dapat diubah karena program sudah memiliki riwayat progres.' (form-text text-warning).",
    40: "VERIFIED element analysis #1: nama program = <a href=/student-affairs/tahfidz/detail/{id}>.",
    43: "List program V2: kolom checkbox belum terlihat di HTML element analysis #1 -> cek saat element analysis.",
    45: "VERIFIED element analysis #1: card info menampilkan 'Batas Tahfidz:' + badge.",
    46: "Source V2 member/table-row: foto symbol-35px symbol-circle; inisial bila tidak ada foto / onerror.",
    47: "Source V2: inisial 2 huruf pertama kata nama (sesuai keputusan PRD Flag no. 3).",
    48: "Diotomasi dengan cy.intercept gambar -> 404 (onerror -> inisial). Butuh anggota QA yang punya foto.",
    54: "VERIFIED element analysis #1: '-' dan '0% (0 dari N satuan)'.",
    55: "Source V2: posisi terakhir = satuan TERJAUH (urutan mushaf) dari kumulatif riwayat terbaru (TahfidzUnit::lastUnit), bukan sekadar riwayat terakhir (Keputusan Flag no. 10).",
    61: "Source V2 MemberDatatable::memberIdsAtUnit: membandingkan lastUnit(unit_total) riwayat terbaru -> sesuai expected.",
    62: "Source V2 MemberDatatable::filters(): tingkat filter dengan SATU opsi TETAP ditampilkan (komentar kode bilang tidak ditawarkan, implementasi tidak) -> calon BUG.",
    64: "Source V2: export_table -> exportToExcel() dari query datatable (crosschecked, ikut filter?).",
    71: "VERIFIED element analysis #2: card Data Siswa V2 hanya Instansi, Nama, Tingkat-Kelas, Nama Program, Jenis, Target. TIDAK ada Batas Tahfidz -> calon BUG.",
    80: "Source V2: langkah dengan satu opsi dipilih otomatis & disembunyikan (visibleSteps).",
    82: "Source V2: pilihan yang tidak lagi tersedia dibuang; yang masih sah dipertahankan (tiket Multi Select Q7).",
    87: "Source V2: 'Pilih minimal satu satuan yang sudah hafal.' (sama dengan tiket Multi Select TC-077).",
    92: "Source V2 Helpers::formatPercentage: non-bulat -> 2 desimal titik ('7.50% (3 dari 40 halaman)').",
    99: "VERIFIED element analysis #2 (F): kolom Capaian = posisi (div.fw-bold) + progress bar + '0% (0 dari N satuan)'.",
    101: "Source V2: peta halaman 604 halaman, 665 baris (docs/tahfidz_batas_tahfidz.md).",
    105: "Source V2: achievement_display memformat halaman memakai metode instansi SAAT INI (formatPageParts), sehingga riwayat lama ikut berubah tampilan setelah metode diganti -> calon BUG / PRD-ambigu.",
}

SRCNOTE[52] = (SRCNOTE.get(52, "") + " Data disesuaikan: target D (78-82) tidak punya surah sebelum An-Naba', jadi 2 surah = An-Naba' + An-Nazi'at -> posisi terakhir An-Nazi'at.").strip()
SRCNOTE[102] = (SRCNOTE.get(102, "") + " Data disesuaikan: tidak ada program QA bertarget Al-Baqarah -> dicek Al-Mulk 30 ayat & An-Naba' 40 ayat (Program E), serta 37 surah Juz 30 (Program C).").strip()
SRCNOTE[101] = (SRCNOTE.get(101, "") + " Dijalankan pada Program U #247 (target Juz 1-30) karena Program F hanya Juz 30; form dibuka tanpa disimpan.").strip()
for _n in (3, 4, 5):
    SRCNOTE[_n] = (SRCNOTE.get(_n, "") + " Form Jenis Pengguna V2 hanya punya checkbox on/off Batas Tahfidz (tanpa aksi Lihat/Tambah/Ubah) -> diperkirakan FAIL (BUG-016).").strip()

HAPPY = {16, 23, 40, 49, 66, 72, 89, 95}
EDGE = {19, 27, 31, 32, 35, 56, 61, 62, 63, 64, 80, 84, 85, 92, 105, 101, 102}


def kategori(n, jenis):
    if jenis == "Negatif":
        return "Negatif"
    if n in HAPPY:
        return "Happy"
    if n in EDGE:
        return "Edge"
    return "Positif"


def sumber(s):
    return "PRD"  # Keputusan Flag 1-10 user = ikut PRD; temuan V2 dicatat di Catatan.


# Data uji per TC (program QAAUTO A-F, laporan data user 6 Okt 2026).
PROG = {"A": "Program A #249 (Juz Juz, Juz 26-30)", "B": "Program B #251 (Juz Halaman, Juz 2-3, 41 hal.)",
        "C": "Program C #252 (Juz Ayat, Juz 29-30, 995 ayat)", "D": "Program D #253 (Surah Surah, 5 surah)",
        "E": "Program E #254 (Surah Ayat, An-Naba'+Al-Mulk, 70 ayat)", "F": "Program F #255 (Juz Halaman, Juz 30, 23 hal.)"}
TEST_DATA = {}
for n, p in {49: "A", 50: "B", 51: "C", 52: "D", 53: "E", 55: "B", 56: "F", 57: "A", 58: "B", 59: "D", 60: "C",
             61: "A", 62: "F", 65: "B", 72: "A", 73: "B", 74: "C", 75: "D", 76: "E", 77: "B", 78: "C", 79: "C",
             80: "F", 81: "A", 82: "C", 83: "F", 84: "F", 85: "C", 88: "A", 89: "A", 90: "B", 92: "B",
             93: "B", 94: "A", 95: "A", 98: "A", 101: "F"}.items():
    TEST_DATA[n] = PROG[p] + "; siswa QA Aisyah Safitri #1082"
for n in (86, 91, 96):
    TEST_DATA[n] = "Program A, B, D, E; siswa QA #1082"
for n in range(28, 33):
    TEST_DATA[n] = "Form Tambah program (TIDAK disimpan) dengan instansi QA / SD / SMA Digital Indonesia"
for n in (35, 36, 37):
    TEST_DATA[n] = "Program A #249 (Batas diubah lalu DIKEMBALIKAN) + pengaturan SMP Digital Indonesia+ (dikembalikan)"
for n in (13, 14, 15, 17, 20, 23, 24, 26, 27, 105):
    TEST_DATA[n] = "Pengaturan instansi SMP Digital Indonesia+ (diubah lalu DIKEMBALIKAN)"

out = []
for r in school:
    n = num(r["ID"])
    cat = []
    status = "Belum dijalankan"
    if n in NA_V2:
        status = "N/A V2"
        cat.append(NA_V2[n])
    elif n in MANUAL:
        status = "Manual"
        cat.append("Manual: " + MANUAL[n])
    elif n in BLOCKED:
        status = "Blocked"
        cat.append("Blocked: " + BLOCKED[n])
        cat.append(f"Otomasi: {SPEC.get(n, '-')} (ditandai pending/skip)")
    else:
        butuh = [k for k, v in BUTUH.items() if n in v]
        if butuh:
            status = "Blocked"
            cat.append("Menunggu " + ", ".join(butuh) + " (sheet Pertanyaan).")
        cat.append(f"Otomasi: {SPEC.get(n, '-')}")
        if n in HASIL:
            status, catatan = HASIL[n]
            if catatan:
                cat.append(catatan)
    if n in SRCNOTE:
        cat.append(SRCNOTE[n])
    expected = r["Hasil yang Diharapkan"]
    if n in EXPECTED_OVERRIDE:
        expected = EXPECTED_OVERRIDE[n]
        cat.append(KOREKSI_41)
    cat.append(f"Ref manual: {r['ID']} ({r['Modul']}; {r['Jenis Uji']}; sumber {r['Sumber']}).")
    out.append([
        tc(n), kategori(n, r["Jenis Uji"]), r["Skenario"], r["Prasyarat"], r["Langkah"],
        TEST_DATA.get(n, ""), expected, sumber(r["Sumber"]), status, "\n".join(cat),
    ])

tdo = []
for platform, rr in (("Cards Edu", edu), ("Cards Parents", parents), ("Lintas Platform", lintas)):
    for r in rr:
        tdo.append([tc(num(r["ID"])), platform, r["Modul"], r["Skenario"], "Tidak diotomasi",
                    "Aplikasi mobile / notifikasi / sinkronisasi lintas platform, di luar scope Cypress web V2.", r["ID"]])

PERTANYAAN = [
    ("QI", "Instansi QA untuk Pengaturan Batas Tahfidz", "Pengaturan per instansi, tidak bisa dihapus.",
     "DIPUTUSKAN user 6 Okt 2026 (ikut usulan): test mengubah pengaturan SMP Digital Indonesia+ lalu MENGEMBALIKAN nilai awal di after(); tambah pengaturan instansi baru (TC-IMT-016, 018) = Manual."),
    ("QP", "Program sementara", "TC Batas Tahfidz pada Program butuh membuat/edit/hapus program.",
     "DIPUTUSKAN user 6 Okt 2026: boleh. DIPAKAI SEBAGIAN: form Tambah dibuka tanpa disimpan (create mengirim notifikasi 'Tahfidz Baru'); Edit memakai Program A lalu dikembalikan. TC-IMT-034 = Manual."),
    ("QD", "Program A-F", "Dibutuhkan untuk kolom/filter/form per batas.",
     "SELESAI: A #249, B #251, C #252, D #253, E #254, F #255 (laporan data user 6 Okt 2026)."),
    ("QS", "Siswa QA kedua", "Semula untuk filter dengan 2 anggota.",
     "TIDAK DIPERLUKAN: filter dibuktikan dengan satu anggota (nilai posisi Aisyah -> tampil, nilai lain -> kosong). Membuat siswa butuh No HP & Nomor Kartu valid (berisiko)."),
]

DATA = [
    ("Program A", "#249 QAAUTO A Juz Juz — Jenis Juz, Batas Juz, target Juz 26-30 (5 juz)", "ADA"),
    ("Program B", "#251 QAAUTO B Juz Halaman — Jenis Juz, Batas Halaman, target Juz 2 + 3 (41 halaman)", "ADA"),
    ("Program C", "#252 QAAUTO C Juz Ayat — Jenis Juz, Batas Ayat, target Juz 29 + 30 (995 ayat)", "ADA"),
    ("Program D", "QAAUTO Surah Surah — Jenis Surah, Batas Surah, target An-Naba', An-Nazi'at, 'Abasa, At-Takwir, Al-Infitar (#253)", "ADA"),
    ("Program E", "#254 QAAUTO E Surah Ayat — Jenis Surah, Batas Ayat, target Al-Mulk + An-Naba' (70 ayat)", "ADA"),
    ("Program F", "#255 QAAUTO F Juz30 Halaman — Jenis Juz, Batas Halaman, target Juz 30 saja (23 halaman)", "ADA"),
    ("Siswa QA 1", "Aisyah Safitri #1082 (sudah ada)", "ADA"),
    ("Siswa QA 2", "Tidak diperlukan untuk filter (QS); hanya TC-IMT-065 yang Blocked", "TIDAK DIPERLUKAN"),
    ("Instansi QA", "SMP Digital Indonesia+ (diubah lalu dikembalikan ke Ayat / per juz); SD & SMA Digital Indonesia hanya dibaca", "ADA (QI)"),
]

NAVY = "1F4E78"
THIN = Side(style="thin", color="D0D0D0")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
wb = openpyxl.Workbook()


def sheet(title, header, widths, data, first=False, status_col=None):
    ws = wb.active if first else wb.create_sheet()
    ws.title = title
    for ci, (h, w) in enumerate(zip(header, widths), start=1):
        c = ws.cell(row=1, column=ci, value=h)
        c.font = Font(name="Arial", bold=True, size=10, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor=NAVY)
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BORDER
        ws.column_dimensions[openpyxl.utils.get_column_letter(ci)].width = w
    fills = {"Manual": "E7E6E6", "Blocked": "FFEB9C", "N/A V2": "D9D9D9", "Tidak diotomasi": "E7E6E6"}
    for ri, row in enumerate(data, start=2):
        for ci, v in enumerate(row, start=1):
            c = ws.cell(row=ri, column=ci, value=v)
            c.font = Font(name="Arial", size=10)
            c.alignment = Alignment(vertical="top", wrap_text=True)
            c.border = BORDER
        if status_col and row[status_col - 1] in fills:
            ws.cell(row=ri, column=status_col).fill = PatternFill("solid", fgColor=fills[row[status_col - 1]])
    ws.freeze_panes = "B2" if len(header) > 4 else "A2"
    ws.auto_filter.ref = ws.dimensions


sheet("Petunjuk", ["Item", "Keterangan"], [22, 130], [
    ("Tiket", "Improvement Tahfidz (Notion). Eksekusi project ini: Cards School V2 STAGING saja (https://staging-school.cazh.id)."),
    ("Sumber TC", "Testcase manual user 'Testcase_Improvement_Tahfidz.xlsx'. TC-IMT-### = IMT-### (1:1). Keputusan Flag 1-10 user (ikut PRD) dipakai apa adanya."),
    ("Cross-check source", "../cazh/cazh-cards-dashboard origin/staging (READ-ONLY), termasuk docs/tahfidz_batas_tahfidz.md. Temuan V2 di kolom Catatan ('calon BUG')."),
    ("Status", "Belum dijalankan / PASS / FAIL (+BUG-###) / Blocked (menunggu data/keputusan, lihat sheet Pertanyaan) / Manual (dikumpulkan di akhir) / N/A V2 / Tidak diotomasi."),
    ("Scope", "Cards School (105 TC). Cards Edu, Cards Parents, Lintas Platform (50 TC) = Tidak diotomasi."),
], first=True)
sheet("TC Cards School V2", ["ID", "Kategori", "Skenario", "Pre-condition", "Langkah", "Test Data", "Expected", "Sumber", "Status", "Catatan"],
      [11, 10, 38, 32, 40, 18, 48, 9, 15, 60], out, status_col=9)
sheet("Tidak Diotomasi", ["ID", "Platform", "Modul", "Skenario", "Status", "Alasan", "Ref manual"],
      [11, 16, 22, 55, 16, 45, 10], tdo, status_col=5)
sheet("Pertanyaan", ["Kode", "Topik", "Fakta (source/staging)", "Keputusan yang dibutuhkan"], [6, 30, 70, 70], PERTANYAAN)
sheet("Data Uji", ["Kode", "Kebutuhan", "Status"], [14, 90, 26], DATA)

wb.save(OUT)
print("TC Cards School V2:", len(out))
print("Status:", Counter(r[8] for r in out))
print("Kategori:", Counter(r[1] for r in out))
print("Tidak diotomasi:", len(tdo))
print("OK ->", OUT)
