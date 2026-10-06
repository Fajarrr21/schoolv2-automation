// batas.js — setup bersama spec tiket "Improvement Tahfidz" (Batas Tahfidz).
// Bukan test — hanya merangkai POM. Fixture: cypress/fixtures/batas.json.
import DetailSiswaPage from './pageobjects/member/DetailSiswaPage';
import Form from './pageobjects/tahfidz/RiwayatProgresForm';
import PengaturanBatasPage from './pageobjects/pengaturan/PengaturanBatasPage';
import { hariIni, makeUniq, compactNumbers } from './helpers';

const PESAN_TAMBAH = 'Riwayat progress berhasil ditambahkan!';
const PESAN_HAPUS = 'Riwayat progress berhasil dihapus!';

/** Fail-fast: data QA tiket Improvement wajib lengkap. */
export const batasData = (fx) => {
  const kurang = [];
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((k) => {
    if (!fx.programs || !fx.programs[k] || !fx.programs[k].id) kurang.push(`programs.${k}.id`);
  });
  if (!fx.siswa || !fx.siswa.id) kurang.push('siswa.id');
  if (!fx.instansi || !fx.instansi.qa || !fx.instansi.qa.awal) kurang.push('instansi.qa.awal');
  if (kurang.length) {
    throw new Error(`DATA QA BELUM LENGKAP di cypress/fixtures/batas.json:\n  - ${kurang.join('\n  - ')}`);
  }
  return fx;
};

export const penanda = (fx) => makeUniq(fx.testData.prefix);

/** Buka Detail Siswa QA pada program. */
export const bukaSiswa = (fx, program) => DetailSiswaPage.visit(program.id, fx.siswa.id);

/** Buka form Tambah Riwayat pada program. */
export const bukaFormRiwayat = (fx, program) => {
  bukaSiswa(fx, program);
  DetailSiswaPage.bukaTambah();
};

/**
 * Buat satu riwayat lewat UI untuk program berbatas apa pun.
 * @param {object} pilih  { juz:[], halaman:[], surah:[] } — dipilih bila langkahnya tampil
 * @param {string[]} units kunci satuan: "26" (juz), "45" (halaman mushaf), "78" (surah), "20:5" (ayat)
 */
export const buatRiwayat = (fx, program, { pilih = {}, units, deskripsi }) => {
  bukaFormRiwayat(fx, program);
  ['juz', 'halaman', 'surah'].forEach((step) => {
    if (!pilih[step] || !pilih[step].length) return;
    cy.get('#modal-progress.show').then(($m) => {
      // Langkah dengan satu pilihan disembunyikan (auto-pilih) -> lewati.
      if ($m.find(`[wire\\:key^="step-${step}"]`).length) Form.pilihStep(step, pilih[step]);
    });
  });
  if (units.every((u) => String(u).includes(':'))) Form.tandaiAyat(units);
  else Form.centangAyat(units.map(String));
  Form.isiField({ tanggal: hariIni(), deskripsi });
  Form.simpanSukses(PESAN_TAMBAH);
  DetailSiswaPage.assertRiwayatAda(deskripsi);
  return deskripsi;
};

/** Hapus seluruh riwayat QA siswa QA di daftar program (column-scoped startsWith "QA"). */
export const bersihkanProgram = (fx, programs) => {
  programs
    .filter((p) => p && p.id)
    .forEach((p) => {
      bukaSiswa(fx, p);
      DetailSiswaPage.bersihkanRiwayatQA(fx.testData.prefix, PESAN_HAPUS);
    });
};

/** Pulihkan pengaturan instansi QA ke nilai awal (aman dipanggil berulang). */
export const pulihkanPengaturan = (fx) => {
  PengaturanBatasPage.pulihkan(fx.instansi.qa, fx.pengaturan.pesanEdit);
};

/**
 * Label nomor halaman sesuai metode instansi (TahfidzUnit::displayPageNumber):
 * mushaf -> nomor mushaf; per_juz -> urutan di dalam juz (value - awal juz + 1).
 */
export const labelHalaman = (fx, value, juz, metode) => {
  if (metode === 'mushaf') return Number(value);
  return Number(value) - fx.mushaf.juz[String(juz)][0] + 1;
};

/**
 * Juz pemilik halaman mushaf. Halaman milik dua juz (mis. 62 = Juz 3 & 4) diambil
 * juz yang ada di target program, lalu juz terkecil (TahfidzUnit::pageRow).
 */
export const juzDari = (fx, page, targetJuz = []) => {
  const milik = Object.keys(fx.mushaf.juz)
    .map(Number)
    .filter((j) => page >= fx.mushaf.juz[j][0] && page <= fx.mushaf.juz[j][1])
    .sort((a, b) => a - b);
  if (!milik.length) throw new Error(`Halaman ${page} belum ada di fixture batas.mushaf.juz`);
  return milik.find((j) => targetJuz.includes(j)) || milik[0];
};

/**
 * Penulisan Capaian Hafalan Batas Halaman (TahfidzUnit::formatPageParts):
 * mushaf -> "Halaman 22-27, 42-45"; per_juz -> "Juz 2 Halaman 1-6, Juz 3 Halaman 1-4".
 */
export const capaianHalaman = (fx, pages, metode, targetJuz = []) => {
  if (metode === 'mushaf') return `Halaman ${compactNumbers(pages)}`;
  const perJuz = {};
  pages.forEach((p) => {
    const j = juzDari(fx, p, targetJuz);
    (perJuz[j] = perJuz[j] || []).push(labelHalaman(fx, p, j, metode));
  });
  return Object.keys(perJuz)
    .map(Number)
    .sort((a, b) => a - b)
    .map((j) => `Juz ${j} Halaman ${compactNumbers(perJuz[j])}`)
    .join(', ');
};

/**
 * Jalankan blok dengan metode penomoran instansi QA tertentu. Kalau berbeda
 * dari nilai awal, pengaturan diubah dulu lalu DIKEMBALIKAN sesudah blok
 * (after() spec tetap memanggil pulihkanPengaturan sebagai jaring pengaman).
 */
export const denganMetode = (fx, metode, blok) => {
  const ubah = metode !== fx.instansi.qa.awal.metode;
  if (ubah) PengaturanBatasPage.ubah(fx.instansi.qa.nama, { metode }, fx.pengaturan.pesanEdit);
  blok();
  if (ubah) pulihkanPengaturan(fx);
};

/** Edit riwayat QA: tandai satuan tambahan lalu simpan (pesan edit). */
export const editRiwayat = (fx, program, deskripsi, { tambah = [], lepas = [] }) => {
  bukaSiswa(fx, program);
  DetailSiswaPage.tampilkanSemua().bukaEdit(deskripsi);
  if (tambah.length) Form.centangAyat(tambah.map(String));
  if (lepas.length) Form.lepasAyat(lepas.map(String));
  Form.simpanSukses(fx.riwayat.pesanEdit);
  DetailSiswaPage.assertRiwayatAda(deskripsi);
};

/** "{persen}% ({done} dari {total} {satuan})" seperti Helpers::formatPercentage. */
export { formatPencapaian } from './helpers';
