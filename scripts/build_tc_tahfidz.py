"""Generate docs/test-cases/TC_Tahfidz_CapaianMultiSelect.xlsx dari testcase manual user
(Testcase_Multi_Select_Capaian_Tahfidz (3).xlsx) + cross-check source V2 origin/staging."""
import re
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

SRC = r"C:\Users\Fajar\Downloads\Testcase_Multi_Select_Capaian_Tahfidz (3).xlsx"
OUT = r"C:\Users\Fajar\Documents\schoolv2-automation\docs\test-cases\TC_Tahfidz_CapaianMultiSelect.xlsx"

src = openpyxl.load_workbook(SRC)

def rows(sheet):
    ws = src[sheet]
    hdr = [c.value for c in ws[1]]
    return [dict(zip(hdr, r)) for r in ws.iter_rows(min_row=2, values_only=True) if r[0]]

school = rows("Cards School")
edu = rows("Cards Edu")
lintas = rows("Lintas Platform")

def num(msc):
    return int(msc.split("-")[1])

def tc(n):
    return f"TC-{n:03d}"

# Nama surat mengikuti konstanta app V2 (app/Utilities/Constant.php QURAN_SURAHS):
# 20 = "Taha", 78 = "An-Naba'". PRD menulis "Thaha".
def v2names(s):
    if s is None:
        return s
    s = re.sub(r"\bThaha\b", "Taha", s)
    s = re.sub(r"\bAn-Naba\b(?!')", "An-Naba'", s)
    return s

# ---------------------------------------------------------------- Kategori
HAPPY = {1, 2, 9, 10, 11, 48, 58, 65, 76, 81, 89, 94}
NEG = {33, 35, 37, 39, 46, 57, 60, 62, 70, 74, 77, 79, 26}
EDGE = {12, 15, 21, 22, 24, 31, 32, 34, 47, 49, 50, 51, 52, 54, 55, 56, 59, 63, 69,
        71, 72, 73, 75, 78, 83, 85, 86, 87, 88, 90, 93}

def kategori(n):
    if n in HAPPY: return "Happy"
    if n in NEG: return "Negatif"
    if n in EDGE: return "Edge"
    return "Positif"

# ---------------------------------------------------------------- Spec
SPEC = {}
for n in [1, 2] + list(range(4, 23)) + [76, 77, 78]: SPEC[n] = "tambahriwayat.cy.js"
for n in list(range(23, 44)) + [58, 60, 61, 62, 64, 65, 66, 67, 68, 69]: SPEC[n] = "pilihayat.cy.js"
for n in range(44, 56): SPEC[n] = "rentangayat.cy.js"
for n in [56, 57, 59, 63, 70, 71, 72, 73, 74, 79]: SPEC[n] = "ayatterkunci.cy.js"
for n in [3, 75, 80]: SPEC[n] = "editriwayat.cy.js"
for n in list(range(81, 89)) + [93]: SPEC[n] = "penulisancapaian.cy.js"
for n in range(89, 93): SPEC[n] = "export.cy.js"
SPEC[94] = "hapusriwayat.cy.js"

# TC Cards School yang TIDAK bisa diotomasi Cypress web (status Manual).
MANUAL = {
    33: "Kegagalan disusun di server (exception saat membaca peta halaman, MemberDetail::rebuildUnitOptions). Memutus koneksi browser hanya memicu error Livewire, bukan state 'gagal dimuat'. Uji manual dengan bantuan dev.",
    34: "Lanjutan TC-033 (butuh state gagal dari server).",
    35: "Butuh kombinasi pilihan yang tidak memuat ayat; menurut source, kondisi ini hampir tidak tercapai lewat UI biasa. Koordinasi data dengan dev.",
    79: "Butuh dua sesi admin bersamaan (tab A & B). Cypress hanya menjalankan satu tab; uji manual.",
}

# Sumber = PRD-ambigu untuk butir yang pertanyaannya dicatat (lihat sheet PRD-ambigu).
AMBIGU = {
    22: "Q5/Q7",
    25: "Q5",
    28: "Q5",
    31: "Q3",
    38: "Q4",
    43: "Q4",
    81: "Q2", 82: "Q2", 83: "Q2", 84: "Q2", 85: "Q2", 86: "Q2", 91: "Q2",
    88: "Q8",
    89: "Q9",
    1: "Q1",
}

# Catatan hasil cross-check source V2 origin/staging (commit 4c4882d0 = yang ter-deploy).
SRCNOTE = {
    1: "KEPUTUSAN Q1 (user 6 Okt 2026): menu Tambah Riwayat di Aksi TIDAK wajib; spec menguji Detail program > Aksi > Detail > Tambah Riwayat. Source staging: menu Aksi pada list anggota Detail program hanya berisi Detail & Hapus (student-affairs/tahfidz/member/table-row.blade.php). Tombol Tambah Riwayat hanya ada di halaman Detail Siswa. TERKONFIRMASI HTML asli (element analysis #1, 5 Okt 2026): menu Aksi = Detail, Hapus; teks Tambah Riwayat tidak ada di halaman Detail program. Calon BUG, menunggu jawaban Q1. Label field di form = 'Tanggal' (PRD: 'Tanggal Kegiatan') dan Capaian Hafalan tampil di atas Tanggal/Deskripsi.",
    3: "Source: set_edit() mengisi unit_marked dari unit_list riwayat dan menurunkan pilihan Juz/Halaman/Surah dari ayatnya (deriveChoiceFromUnits).",
    5: "Butuh program PRG-J (Batas Juz). Belum ada di data QA, tunggu checkpoint 2.",
    6: "Butuh program PRG-H (Batas Halaman). Belum ada di data QA, tunggu checkpoint 2.",
    7: "Butuh program PRG-S (Jenis Surah, Batas Surah). Belum ada di data QA, tunggu checkpoint 2.",
    8: "Butuh program PRG-SA (Jenis Surah, Batas Ayat). Belum ada di data QA, tunggu checkpoint 2.",
    11: "Source: TahfidzUnit::surahOptions() (Jenis Juz) memakai ayatScope($chosen) yang ikut menyaring surah terpilih -> opsi tinggal 1 -> auto-pilih & step Pilih Surah disembunyikan.",
    12: "Assert: tidak ada pesan batas & jumlah chip = jumlah opsi. Pencentangan semua halaman bisa ratusan klik, jadi dibatasi target PRG-A.",
    16: "Source: placeholder pencarian dropdown = 'Cari Juz' / 'Cari Halaman' / 'Cari Surah' (wire:model step_search.*).",
    21: "Source: langkah dengan satu pilihan dipilih otomatis dan tidak dirender (visibleSteps). Sesuai PRD.",
    22: "TERKONFIRMASI HTML: popup Ganti Pilihan muncul bila ADA ayat terpilih di mana pun (melepas Juz 30 saat ayat terpilih semuanya dari Juz 16 tetap memunculkan popup). Menambah juz mempertahankan halaman yang masih sah. Lihat Q5 & Q7.",
    25: "Source: judul 'Ganti Pilihan?', pesan '{Ayat} yang sudah dipilih akan dihapus ketika Anda mengganti pilihan ini. Lanjutkan?', tombol Batal/Ganti. Sesuai PRD.",
    31: "TERKONFIRMASI HTML (element analysis #2): 60 ayat per kelompok surat (badge tetap total, mis. '76 ayat'); digulir sampai dasar TIDAK menambah ayat; lanjutan hanya lewat tombol showMoreUnits('<surahId>') 'Muat ayat berikutnya'. Spec meng-assert bunyi PRD (digulir) -> merah sampai Q3 diputuskan.",
    32: "Otomasi: response Livewire diperlambat lewat cy.intercept (setDelay) lalu assert 'Memuat daftar ayat...' + tombol section disabled.",
    37: "Source: input bertipe text (huruf bisa diketik) tapi penyaringan hanya pada nomor ayat, jadi huruf menghasilkan 'Ayat tidak ditemukan.'. Masuk expected (huruf tidak menyaring).",
    38: "Source: Cari Ayat memakai str_contains pada nomor ayat. Ketik 5 juga menampilkan 15, 25, 50-59, dst. Lihat Q4.",
    39: "Source: teks kosong = '{Ayat} tidak ditemukan.' -> 'Ayat tidak ditemukan.'.",
    43: "KEPUTUSAN Q4 (user 6 Okt 2026): pencarian 'mengandung' BENAR. Expected diubah: Pilih Semua Hasil dengan kata kunci 5 mencentang SEMUA ayat yang nomornya memuat 5. (Catatan lama:) Source: karena pencarian = 'mengandung', Pilih Semua Hasil dengan kata kunci 5 ikut mencentang 15, 25, 50-59, dst. Expected manual (hanya Ayat 5) akan FAIL di V2. Element analysis #2 belum bisa membuktikan (data saat itu hanya ayat 96-98). Lihat Q4.",
    44: "Source: tombol 'Pilih Rentang Ayat' nonaktif bila Daftar Ayat < 2 ayat atau seluruhnya terkunci.",
    47: "Source: rangeEndOptions() = satuan sesudah Dari Ayat mengikuti urutan Daftar Ayat (urut mushaf). Sesuai PRD.",
    48: "Source: setelah Terapkan tampil keterangan '{n} ayat ditambahkan.' (tidak disebut PRD, tidak di-assert sebagai syarat).",
    49: "Contoh PRD (Thaha 5 -> Maryam 3) terbalik terhadap urutan mushaf; dipakai Maryam -> Taha (Catatan Sinkronisasi user no. 6).",
    54: "Source: applyStepValues() memanggil resetRange(), sehingga panel ikut tertutup dan nilai kosong.",
    56: "Source: keterangan '{n} ayat ditambahkan, {m} ayat dilewati karena sudah tercatat pada riwayat lain.' Sesuai PRD.",
    57: "Source: 'Seluruh ayat pada rentang ini sudah tercatat pada riwayat lain.' Sesuai PRD.",
    61: "Source: judul 'Hapus Semua Ayat Terpilih?', tombol Batal / Hapus Semua. Sesuai PRD.",
    64: "Source: 'Belum ada ayat yang dipilih.' Sesuai PRD.",
    65: "Source: item Ayat Terpilih berlabel 'Ayat n' di bawah header nama surat (bukan 'Taha Ayat n' per item).",
    67: "Source: '{n} ayat terpilih' + badge '{Surat} {jumlah}' per surat. Sesuai PRD.",
    69: "Source: area Ayat Terpilih height 110px + overflow-y auto.",
    70: "Source: checkbox terkunci = input checked disabled + ikon gembok title 'Sudah tercatat pada riwayat lain'. Keterangan berupa tooltip (title), bukan teks yang tampil.",
    74: "Source: 'Seluruh ayat pada pilihan ini sudah tercatat pada riwayat lain.' + tombol Rentang/Pilih Semua/Hapus Semua nonaktif.",
    77: "Source: pesan validasi 'Pilih minimal satu satuan yang sudah hafal.' (WithValidation unit_list.required).",
    79: "Source: pesan 'Sebagian ayat yang Anda pilih sudah dicatat pada riwayat lain. Daftar ayat dimuat ulang, silakan periksa kembali.' Sesuai PRD.",
    81: "Source: kolom Capaian Hafalan = achievement_display_short -> 'Taha Ayat 1-10' (TANPA 'QS.', 'Ayat' kapital). PRD: 'QS. Thaha ayat 1-10'. Lihat Q2.",
    85: "Source: formatUnitsShort max=2 lalu ' +{n} surat'. Sesuai PRD (kecuali prefix QS., lihat Q2).",
    87: "Butuh data RS (riwayat lama sebelum rilis). Tidak bisa dibuat lewat UI baru; minta siswa yang sudah punya riwayat lama.",
    88: "Source: Batas Surah ditulis per nama surat dipisah koma (tanpa rentang), Batas Juz 'Juz 1-3, 5', Batas Halaman 'Halaman 1-3, 7'. Lihat Q8. Butuh PRG-J/H/S.",
    89: "Source export: header 'No, Tanggal Dibuat, Tanggal Riwayat, Capaian Hafalan, Deskripsi, Pencapaian, Dibuat Oleh'. Header 'Tanggal Riwayat' (PRD: 'Tanggal Riwayat Tahfidz'). Lihat Q9.",
    90: "Source export memakai achievement_display (lengkap, tanpa '+n surat'). Sesuai PRD.",
    92: "Source: achievement_text = '{persen}% ({done} dari {total} {satuan})', persen bulat tanpa desimal, selain itu 2 desimal.",
    93: "Persentase dihitung dari unit_total (kumulatif) / total satuan target. Total ayat target PRG-SA = jumlah ayat surat target (Maryam 98 + Taha 135 = 233).",
    94: "Pencapaian di list Detail program & Detail Siswa dibaca ulang setelah reload.",
}

# TC yang dijalankan di PRG-SA (Jenis Surah, Batas Ayat): butuh 2+ surat, yang di
# Jenis Juz tidak mungkin karena BUG-001.
SA_TC = {3, 8, 20, 23, 24, 30, 31, 32, 36, 37, 38, 39, 40, 41, 42, 43, 58, 60, 61, 62, 64, 65, 66, 67, 68, 69,
         75, 76, 78, 80, 81, 82, 83, 84, 85, 86, 89, 90, 91, 92, 93, 94} | set(range(44, 58)) | {59, 63, 70, 71, 72, 73, 74}

STATUS = {
    11: ("FAIL", "BUG-001 - Cypress run 6 Okt 2026 (Chrome): step Pilih Surah hilang setelah surat pertama dicentang."),
    26: ("FAIL", "BUG-002 - Cypress run 6 Okt 2026 (Chrome): setelah Batal, checkbox Juz 16 tidak tercentang."),
    1: ("FAIL", "Cypress run 6 Okt 2026: menu Aksi = ['Detail', 'Hapus'], tanpa Tambah Riwayat. Menunggu Q1 (calon BUG)."),
}
# PASS di Cypress run 6 Okt 2026 (Chrome, staging, PRG-A #247, siswa #1082).
for _n in [2, 4, 9, 10, 12, 13, 14, 16, 17, 18, 19, 21, 22, 77, 25, 27, 28, 29]:
    STATUS[_n] = ("PASS", "Cypress run 6 Okt 2026 (Chrome).")
# Blocked: data belum ada.
for _n in [5, 6, 7]:
    STATUS[_n] = ("Blocked", "Program PRG-J/H/S belum dibuat.")
STATUS[15] = ("Blocked", "Target PRG-A masih Juz 1-30; perlu dipersempit ke Juz 16 + 30.")
STATUS[87] = ("Blocked", "Data RS (riwayat lama) belum ada.")
STATUS[88] = ("Blocked", "Program PRG-J/H/S belum dibuat.")
for _n in SA_TC:
    STATUS.setdefault(_n, ("Blocked", "PRG-SA (QAAUTO Surah Ayat) belum dibuat."))
# ===== HASIL RUN FINAL 6 Okt 2026 (Chrome, staging, PRG-A #247, PRG-SA #248, siswa #1082) =====
STATUS = {}
_R = "Cypress run 6 Okt 2026 (Chrome)."
for _n in [1, 2, 3, 4, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22,
           23, 24, 25, 27, 28, 29, 30, 32, 36, 37, 38, 39, 40, 41, 42, 43,
           44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
           56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
           70, 71, 72, 73, 74, 75, 76, 77, 78, 80, 89, 92, 93, 94]:
    STATUS[_n] = ("PASS", _R)
STATUS[11] = ("FAIL", "BUG-001 - " + _R + " Step Pilih Surah hilang setelah surat pertama dicentang.")
STATUS[26] = ("FAIL", "BUG-002 - " + _R + " Checkbox Juz 16 tidak tercentang setelah Batal.")
STATUS[31] = ("FAIL", "BUG-004 - " + _R + " Digulir tetap 60 ayat; lanjutan hanya lewat tombol.")
for _n in [81, 82, 83, 84, 85, 86, 90, 91]:
    STATUS[_n] = ("FAIL", "BUG-005 - " + _R + " V2 menulis '{surat} Ayat {n}', PRD 'QS. {surat} ayat {n}'. Aturan rentang/koma/urutan/+n surat sudah benar.")
for _n in [5, 6, 7]:
    STATUS[_n] = ("Blocked", "Program PRG-J/H/S belum dibuat.")
STATUS[15] = ("Blocked", "Target #247 Juz 1-30 terkunci (tidak bisa diedit).")
STATUS[87] = ("Blocked", "Data RS (riwayat lama) belum ada.")
STATUS[88] = ("Blocked", "Program PRG-J/H/S belum dibuat.")
# ===== RETEST PASCA-DEPLOY 2a2a430e (6 Okt 2026) =====
_R2 = "Cypress run 6 Okt 2026 pasca-deploy 2a2a430e (Chrome)."
for _n in [5, 6, 7, 15, 77, 88, 11]:
    STATUS[_n] = ("PASS", _R2)
STATUS[11] = ("PASS", "BUG-001 FIXED (deploy 2a2a430e). " + _R2 + " Evidence: docs/evidence/BUG-001/README.md")
STATUS[26] = ("FAIL", "BUG-002 - " + _R2 + " Evidence: docs/evidence/BUG-002/")
STATUS[31] = ("FAIL", "BUG-004 - " + _R2 + " Evidence: docs/evidence/BUG-004/")
for _n in [81, 82, 83, 84, 85, 86, 90, 91]:
    STATUS[_n] = ("FAIL", "BUG-005 - " + _R2 + " V2 '{surat} Ayat {n}' vs PRD 'QS. {surat} ayat {n}'. Evidence: docs/evidence/BUG-005/")
STATUS[87] = ("Tidak diotomasi", "Keputusan user 6 Okt 2026 (D5): skip / N/A. Butuh riwayat lama (sebelum rilis) yang tidak ada di staging dan tidak bisa dibuat lewat UI.")
# ===== RETEST 7 OKT 2026 (staging a9e3c84c, fix dev) =====
_R3 = "Retest Cypress 7 Okt 2026 (staging a9e3c84c, Chrome): PASS."
STATUS[26] = ("PASS", "BUG-002 FIXED. " + _R3)
STATUS[31] = ("PASS", "BUG-004 FIXED (dimuat otomatis saat digulir). " + _R3)
for _n in [81, 82, 83, 84, 85, 86, 90, 91]:
    STATUS[_n] = ("PASS", "BUG-005 FIXED (format 'QS. {surat} ayat {ayat}'). " + _R3)
STATUS[25] = ("PASS", _R3 + " + TC-025B (BUG-006: lepas juz tanpa ayat terpilih -> tanpa popup) PASS, BUG-006 FIXED.")

# ===== KEPUTUSAN DEV (6 Okt 2026) =====
_D6 = "Keputusan dev D6 (6 Okt 2026): cukup unit test. State hanya muncul bila server gagal menyusun daftar satuan (exception di buildUnitOptions); memblokir request dari browser tidak memicunya."
STATUS[33] = ("Tidak diotomasi", _D6)
STATUS[34] = ("Tidak diotomasi", _D6 + " (lanjutan TC-033)")
STATUS[35] = ("Tidak diotomasi", "Keputusan dev D7 (6 Okt 2026): N/A. Opsi tiap langkah diturunkan dari pilihan sebelumnya dan satuan terpakai tetap tampil terkunci, jadi daftar kosong tidak tercapai lewat UI (jaring pengaman saja).")


# TC yang riwayatnya dibuat oleh spec sendiri (pre-condition "riwayat ... tersimpan" / RL).
MEMBUAT_RIWAYAT = {3, 5, 6, 7, 56, 57, 59, 63, 70, 71, 72, 73, 74, 75, 76, 78, 80} | (set(range(81, 95)) - {87})

def testdata(n, pre, langkah):
    toks = re.findall(r"\b(PRG-[A-Z]+|RL|RS)\b", (pre or ""))
    out = ", ".join(dict.fromkeys(toks)) if toks else "PRG-A"
    if n in SA_TC:
        out = out.replace("PRG-A", "PRG-SA") if "PRG-A" in out else "PRG-SA, " + out
    if n in MEMBUAT_RIWAYAT:
        out += "; Deskripsi = QA<ts><seq>"
    return out

DIPUTUSKAN = {1, 38, 43}
def sumber(n):
    return "PRD-ambigu" if (n in AMBIGU and n not in DIPUTUSKAN) else "PRD"

OVERRIDE = {
    1: {"Skenario": "Form Tambah Riwayat dapat dibuka dari Detail program lewat Aksi > Detail",
        "Langkah": "1. Buka Kesiswaan > Tahfidz > Detail program\n2. Cari siswa, klik Aksi > Detail\n3. Klik Tambah Riwayat"},
    43: {"Skenario": "Pilih Semua Hasil mencentang seluruh ayat hasil pencarian nomor ayat",
         "Hasil yang Diharapkan": "Seluruh ayat Maryam dan Taha yang nomornya memuat angka 5 (5, 15, 25, 50-59, ...) tercentang dan masuk Ayat Terpilih; pilihan tetap setelah kata kunci dihapus"},
}
out_rows = []
for r in school:
    n = num(r["ID"])
    r = {**r, **OVERRIDE.get(n, {})}
    cat = []
    if n in AMBIGU:
        cat.append(f"Pertanyaan {AMBIGU[n]} (sheet PRD-ambigu).")
    if n in SRCNOTE:
        cat.append(SRCNOTE[n])
    if n in MANUAL:
        cat.append("Manual: " + MANUAL[n])
    else:
        cat.append(f"Otomasi: {SPEC[n]}")
    if n in SA_TC:
        cat.append("Dijalankan di PRG-SA (Jenis Surah) karena multi surat di Jenis Juz terblokir BUG-001.")
    if n in STATUS:
        cat.insert(0, STATUS[n][1])
    cat.append(f"Ref manual: {r['ID']} ({r['Area']}; {r['Jenis Uji']}; sumber {r['Sumber']}).")
    out_rows.append([
        tc(n), kategori(n), v2names(r["Skenario"]), v2names(r["Prasyarat"]),
        v2names(r["Langkah"]), testdata(n, r["Prasyarat"], r["Langkah"]),
        v2names(r["Hasil yang Diharapkan"]), sumber(n),
        STATUS[n][0] if n in STATUS else ("Manual" if n in MANUAL else "Belum dijalankan"),
        "\n".join(cat),
    ])

# ---------------------------------------------------------------- Tidak diotomasi
tdo = []
for r in edu:
    tdo.append([tc(num(r["ID"])), "Cards Edu (mobile)", r["Area"], r["Skenario"],
                "Tidak diotomasi", "Aplikasi mobile Cards Edu, di luar scope Cypress web.", r["ID"]])
for r in lintas:
    alasan = ("Notifikasi push / in-app di luar scope project ini."
              if r["Area"] == "Notifikasi"
              else "Butuh Cards Edu / Cards Parents (mobile), di luar scope Cypress web.")
    tdo.append([tc(num(r["ID"])), "Lintas Platform", r["Area"], r["Skenario"],
                "Tidak diotomasi", alasan, r["ID"]])

# ---------------------------------------------------------------- PRD-ambigu
QUESTIONS = [
    ("Q1", "TC-001", "Akses Tambah Riwayat dari Detail program",
     "DoD dan PRD: Kesiswaan > Tahfidz > Detail > Aksi > Tambah Riwayat. Source V2 staging: menu Aksi list anggota hanya Detail & Hapus, Tambah Riwayat hanya di halaman Detail Siswa.",
     "Apakah V2 memang wajib punya menu Aksi > Tambah Riwayat di Detail program? Kalau ya, TC-001 meng-assert menu itu (merah sampai diperbaiki, calon BUG). Kalau tidak, TC-001 dialihkan ke jalur Detail > klik nama siswa > Tambah Riwayat."),
    ("Q2", "TC-081..086, TC-091", "Format penulisan capaian",
     "PRD Detail Siswa: 'QS. Thaha ayat 130-135, QS. Maryam ayat 1-3'. Source V2: 'Taha Ayat 130-135' (tanpa 'QS.', 'Ayat' kapital, ejaan 'Taha' dari konstanta app). DoD hanya memberi contoh 'ayat 1-10'.",
     "Apakah prefix 'QS.' dan huruf kecil 'ayat' WAJIB? Pola dipusatkan di fixture (format.capaianPerSurat). Default spec = pola PRD 'QS. {surat} ayat {ayat}', jadi kalau V2 dianggap salah, TC Penulisan capaian akan merah sampai diperbaiki."),
    ("Q3", "TC-031", "Dimuat bertahap saat digulir",
     "PRD/DoD: kelompok berikutnya dimuat ketika admin menggulir mendekatinya. Source V2: tombol 'Muat ayat berikutnya' per kelompok (60 ayat per muat), bukan scroll.",
     "Apakah tombol diterima sebagai implementasi V2? Kalau tidak, TC-031 meng-assert pemuatan saat digulir (merah, calon BUG)."),
    ("Q4", "TC-038, TC-043", "Cari Ayat: cocok persis atau mengandung",
     "PRD: menyaring berdasarkan nomor ayat. Source V2: str_contains, jadi kata kunci 5 juga menampilkan 15, 25, 50-59. TC manual MSC-043 mengharapkan hanya Ayat 5.",
     "Apakah Cari Ayat harus cocok persis (hanya ayat 5)? Kalau ya, TC-043 merah di V2 (calon BUG). Kalau 'mengandung' diterima, expected TC-038/043 diubah jadi 'seluruh ayat yang nomornya memuat 5'."),
    ("Q5", "TC-022, TC-025, TC-028", "Pemicu popup Ganti Pilihan",
     "PRD: popup muncul saat melepas juz/halaman 'sedangkan sudah ada ayat yang dipilih DI BAWAHNYA'. Source V2: popup muncul bila ADA ayat terpilih di mana pun, termasuk ayat dari juz lain.",
     "Melepas Juz 30 padahal ayat terpilih hanya dari Juz 16: tanpa popup (PRD harfiah) atau dengan popup (V2) yang benar? Jawaban ini menentukan expected edge case di TC-022."),
    ("Q6", "-", "Cakupan data uji",
     "TC manual memakai 5 program (PRG-A, PRG-J, PRG-H, PRG-S, PRG-SA) + kondisi RL dan RS. Prompt menyebut satu program + siswa QA.",
     "Apakah kamu menyiapkan kelima program QA? Kalau hanya PRG-A, TC-005..008 dan TC-088 berstatus Blocked. RL dibuat sendiri oleh spec (lalu dibersihkan). RS (riwayat lama) tidak bisa dibuat lewat UI baru, jadi butuh siswa yang sudah punya riwayat lama."),
    ("Q7", "TC-022", "Menambah pilihan langkah sebelumnya",
     "PRD h: mengubah pilihan langkah sebelumnya mengosongkan langkah sesudahnya. Source V2: menambah juz MEMPERTAHANKAN halaman yang masih sah (hanya yang tidak lagi tersedia yang dibuang). Sudah tercatat sebagai Catatan Sinkronisasi no. 9 di TC manual.",
     "Konfirmasi PM: perilaku V2 (mempertahankan) dianggap benar? Sampai ada jawaban, kasus 'menambah' tidak di-assert."),
    ("Q8", "TC-088", "Penulisan pada Batas Surah",
     "PRD: pada Batas Juz/Halaman/Surah penulisan mengikuti pola yang sama dengan satuannya. Source V2: Batas Juz 'Juz 1-3, 5', Batas Halaman 'Halaman 1-3, 7', Batas Surah daftar nama surat dipisah koma tanpa rentang (dan dipendekkan '+n surat').",
     "Untuk Batas Surah, apakah surat berurutan harus digabung menjadi rentang? Kalau ya, bagaimana bentuknya?"),
    ("Q9", "TC-089", "Nama kolom export",
     "PRD: kolom Capaian Hafalan 'setelah kolom Tanggal Riwayat Tahfidz'. Source V2: header kolom = 'Tanggal Riwayat'.",
     "Apakah header 'Tanggal Riwayat' sudah dianggap sama? Default spec: assert Capaian Hafalan tepat setelah kolom berawalan 'Tanggal Riwayat', tanpa menuntut kata 'Tahfidz'."),
    ("Q10", "-", "Arti 'Detail Siswa' untuk POM",
     "Di V2, daftar riwayat + tombol Tambah Riwayat + Excel ada di halaman Detail Siswa Tahfidz (/student-affairs/tahfidz/detail/{id}/member/{member}). Ada juga tab Tahfidz di Anggota > Detail Anggota (ringkasan posisi dan persentase per program). Prompt menyebut TahfidzDetailPage = 'detail program + daftar riwayat'.",
     "Usulan: TahfidzDetailPage = Detail program + list anggota; DetailSiswaPage = Detail Siswa Tahfidz (grafik, riwayat, Excel, form); tab Anggota hanya dipakai untuk verifikasi persentase. Setuju?"),
]

# ---------------------------------------------------------------- Pemetaan DoD (scope)
src_dod = rows("Pemetaan DoD")
def remap(ids):
    out = []
    for x in re.findall(r"MSC-(\d{3})", ids or ""):
        n = int(x)
        out.append(tc(n))
    return out

dod_rows = []
for r in src_dod:
    kode, kel, butir, ids = r["Kode"], r["Kelompok"], r["Butir DoD"], r["Testcase"]
    tcs = remap(ids)
    in_scope = [t for t in tcs if int(t[3:]) <= 94]
    if kel == "Cards Edu":
        status = "Tidak diotomasi (Cards Edu)"
    elif kode == "C8":
        status = "Tidak diotomasi (notifikasi di luar scope)"
    elif not in_scope:
        status = "Tidak diotomasi"
    else:
        auto = [t for t in in_scope if int(t[3:]) not in MANUAL]
        status = "Otomasi" if auto else "Manual"
        if kode == "U1":
            status = "Sebagian: aturan Cards School diotomasi, kesamaan dengan Cards Edu tidak"
    dod_rows.append([kode, kel, butir, ", ".join(in_scope) or "-", ", ".join(t for t in tcs if t not in in_scope) or "-", status])

# ---------------------------------------------------------------- Data uji
DATA = [
    ("PRG-A", "Jenis Jus, Batas Ayat, Target Juz 16 dan Juz 30", "Navigasi langkah & multi select Juz/Halaman/Surah, popup Ganti Pilihan", "ADA: QAAUTO Juz Ayat #247, tapi target masih Juz 1-30 (TC-015 di-skip sampai target = Juz 16 + 30)", "staging.programUtama"),
    ("PRG-J", "Jenis Jus, Batas Juz, Target minimal 3 juz", "TC-005, TC-088", "Opsional (tanpa ini -> Blocked)", "staging.programBatasJuz"),
    ("PRG-H", "Jenis Jus, Batas Halaman, Target minimal 2 juz", "TC-006, TC-088", "Opsional", "staging.programBatasHalaman"),
    ("PRG-S", "Jenis Surah, Batas Surah, Target minimal 3 surah", "TC-007, TC-088", "Opsional", "staging.programBatasSurah"),
    ("PRG-SA", "Jenis Surah, Batas Ayat, Target Maryam, Taha, An-Naba', An-Nazi'at, 'Abasa, At-Takwir (390 ayat)", "Semua skenario multi surat (rentang lintas surat, ayat terkunci, penulisan, export, hapus) + TC-008, TC-093", "WAJIB (BUG-001: multi surat tidak bisa di Jenis Juz). BELUM ADA", "staging.programSurahAyat"),
    ("Siswa QA", "Satu siswa KHUSUS QA, terdaftar pada setiap program di atas", "Semua TC", "ADA: Aisyah Safitri #1082 (perlu konfirmasi khusus QA)", "staging.siswa"),
    ("RL", "Siswa PRG-SA yang punya riwayat lain berisi Maryam 1-5 dan Maryam 97", "TC-056, 057, 059, 063, 070-075", "Dibuat oleh spec di before() dengan Deskripsi QA, lalu dibersihkan", "-"),
    ("RS", "Siswa PRG-A dengan riwayat lama (sebelum rilis) berisi satu surat", "TC-087", "Opsional: tidak bisa dibuat lewat UI baru", "staging.siswaRiwayatLama"),
]

# ---------------------------------------------------------------- Tulis workbook
NAVY = "1F4E78"
THIN = Side(style="thin", color="D0D0D0")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
HFONT = Font(name="Arial", bold=True, size=10, color="FFFFFF")
HFILL = PatternFill("solid", fgColor=NAVY)
BFONT = Font(name="Arial", size=10)
WRAP = Alignment(vertical="top", wrap_text=True)
FILL = {
    "PRD-ambigu": PatternFill("solid", fgColor="FFEB9C"),
    "Manual": PatternFill("solid", fgColor="E7E6E6"),
    "Tidak diotomasi": PatternFill("solid", fgColor="E7E6E6"),
}

wb = openpyxl.Workbook()

def sheet(title, header, widths, data, first=False, fills=None):
    ws = wb.active if first else wb.create_sheet()
    ws.title = title
    for ci, (h, w) in enumerate(zip(header, widths), start=1):
        c = ws.cell(row=1, column=ci, value=h)
        c.font, c.fill, c.border = HFONT, HFILL, BORDER
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[openpyxl.utils.get_column_letter(ci)].width = w
    for ri, row in enumerate(data, start=2):
        for ci, v in enumerate(row, start=1):
            c = ws.cell(row=ri, column=ci, value=v)
            c.font, c.alignment, c.border = BFONT, WRAP, BORDER
        if fills:
            fills(ws, ri, row)
    ws.freeze_panes = "B2" if len(header) > 4 else "A2"
    ws.auto_filter.ref = ws.dimensions
    return ws

PETUNJUK = [
    ("Tiket", "Multi Select Capaian Tahfidz (Notion, status Ready To Test). Project ini menguji CARDS School V2 STAGING saja: https://staging-school.cazh.id"),
    ("Scope", "Cards School: Form Tambah & Edit Riwayat Progres, Penulisan capaian (Detail Siswa + export), Perilaku umum. Cards Edu (mobile), notifikasi, dan sinkronisasi lintas platform TIDAK diotomasi (sheet 'Tidak Diotomasi')."),
    ("Sumber TC", "Diturunkan dari testcase manual user 'Testcase_Multi_Select_Capaian_Tahfidz (3).xlsx'. TC-### = MSC-### (nomor sama, ditelusuri 1:1 lewat kolom Catatan 'Ref manual')."),
    ("Sumber requirement", "PRD Notion 'Tahfidz - Detail Tahfidz -> Tambah Riwayat Progress Siswa' & 'Tahfidz - Detail Tahfidz -> Detail Siswa' + DoD tiket. Bila konflik, ikut PRD (keputusan sama dengan sheet 'Catatan Sinkronisasi' di TC manual)."),
    ("Cross-check source", "../cazh/cazh-cards-dashboard origin/staging commit 4c4882d0 = commit yang ter-deploy (GET /healthcheck, 5 Okt 2026). Commit fitur: 228d96e9, decda14a, d11e866b, e33b0cf8. Temuan source dicatat di kolom Catatan & sheet 'PRD-ambigu'. Source dipakai untuk cross-check; selector tetap dikunci lewat HTML asli."),
    ("Nama surat", "Ditulis sesuai konstanta app V2 (Constant::QURAN_SURAHS): 'Taha' (PRD: Thaha), \"An-Naba'\", \"An-Nazi'at\", \"'Abasa\"."),
    ("Kolom", "ID | Kategori (Happy/Positif/Negatif/Edge) | Skenario | Pre-condition | Langkah | Test Data | Expected | Sumber (PRD/PRD-ambigu/Asumsi) | Status | Catatan."),
    ("Status", "Belum dijalankan / PASS / FAIL (+ BUG-### di Catatan) / Blocked (data belum ada) / Manual (tidak bisa diotomasi Cypress web, diuji manual) / Tidak diotomasi (di luar scope)."),
    ("Penanda data", "Setiap riwayat yang dibuat test diberi Deskripsi = QA<6-digit-timestamp><seq>. Cleanup (cypress/e2e/stagingv2/cleanup/cleanupTahfidz.cy.js) hanya menghapus riwayat siswa QA yang Deskripsi-nya diawali 'QA'. Wajib, karena riwayat yang tertinggal MENGUNCI ayatnya."),
    ("Bug", "Bug ditandai inline: Status = FAIL + BUG-### di Catatan. Daftar bug di bugs.csv (/bug)."),
]

sheet("Petunjuk", ["Item", "Keterangan"], [22, 130], PETUNJUK, first=True)

def tc_fill(ws, ri, row):
    if row[7] == "PRD-ambigu":
        ws.cell(row=ri, column=8).fill = FILL["PRD-ambigu"]
    if row[8] == "Manual":
        ws.cell(row=ri, column=9).fill = FILL["Manual"]

sheet("TC Cards School",
      ["ID", "Kategori", "Skenario", "Pre-condition", "Langkah", "Test Data", "Expected", "Sumber", "Status", "Catatan"],
      [9, 10, 38, 32, 40, 22, 48, 12, 15, 60], out_rows, fills=tc_fill)

sheet("Tidak Diotomasi", ["ID", "Platform", "Area", "Skenario", "Status", "Alasan", "Ref manual"],
      [9, 18, 18, 60, 16, 50, 11], tdo,
      fills=lambda ws, ri, row: setattr(ws.cell(row=ri, column=5), "fill", FILL["Tidak diotomasi"]))

KEPUTUSAN = {
    "Q1": "USER 6 Okt 2026: TIDAK wajib. TC-001 diuji lewat Aksi > Detail > Tambah Riwayat.",
    "Q2": "USER 6 Okt 2026: sesuai PRD ('QS. {surat} ayat {ayat}'). Penulisan V2 yang berbeda = bug.",
    "Q3": "USER 6 Okt 2026: dampak kecil -> dicatat sebagai bug Low (BUG-004). TC-031 tetap meng-assert PRD.",
    "Q4": "USER 6 Okt 2026: pencarian 'mengandung' BENAR (5 -> 5, 15, 25, 50-59, ...). Expected TC-043 diubah.",
    "Q5": "Belum diputuskan. Fakta V2: popup muncul bila ADA ayat terpilih di mana pun (element analysis #2).",
    "Q6": "Selesai: PRG-SA #248 dibuat user. PRG-J/H/S & RS belum (opsional).",
}
QROWS = [list(q) + [KEPUTUSAN.get(q[0], "Belum diputuskan")] for q in QUESTIONS]
sheet("PRD-ambigu", ["No", "TC", "Topik", "Bunyi PRD vs source V2", "Pertanyaan", "Keputusan"],
      [6, 18, 28, 60, 60, 50], QROWS)

sheet("Pemetaan DoD", ["Kode", "Kelompok", "Butir DoD", "TC (scope)", "TC di luar scope", "Status otomasi"],
      [7, 18, 60, 40, 22, 30], dod_rows)

sheet("Data Uji", ["Kode", "Kebutuhan", "Dipakai oleh", "Status", "Kunci fixture (tahfidz.json)"],
      [10, 60, 45, 40, 32], DATA)

wb.save(OUT)

from collections import Counter
print("TC Cards School:", len(out_rows))
print("Kategori:", Counter(r[1] for r in out_rows))
print("Sumber:", Counter(r[7] for r in out_rows))
print("Status:", Counter(r[8] for r in out_rows))
print("Spec:", Counter(SPEC[int(r[0][3:])] for r in out_rows if r[8] != "Manual"))
print("Tidak diotomasi:", len(tdo))
print("DoD:", Counter(r[5] for r in dod_rows))
print("OK ->", OUT)
