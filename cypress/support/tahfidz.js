// tahfidz.js — setup bersama spec Kesiswaan > Tahfidz > Capaian Multi Select.
//
// Dipakai oleh semua spec di cypress/e2e/stagingv2/Kesiswaan/Tahfidz/capaian-multiselect
// dan cleanup. Bukan test — hanya merangkai POM.
import LoginPage from './pageobjects/LoginPage';
import DetailSiswaPage from './pageobjects/member/DetailSiswaPage';
import Form from './pageobjects/tahfidz/RiwayatProgresForm';
import { hariIni, makeUniq } from './helpers';

/** Bersihkan sesi, login via cy.session, pasang alias Livewire. */
export const siapkan = () => {
  LoginPage.clearSession();
  LoginPage.loginViaSession();
  Form.interceptLivewire();
  DetailSiswaPage.interceptTable();
};

/** Buka Detail Siswa QA pada program tertentu. */
export const bukaDetailSiswa = (S, program) => {
  DetailSiswaPage.visit(program.id, S.siswa.id);
};

/** Buka Detail Siswa lalu modal Tambah Riwayat. */
export const bukaForm = (S, program) => {
  bukaDetailSiswa(S, program);
  DetailSiswaPage.bukaTambah();
};

/**
 * Buat satu riwayat lewat UI di program Jenis Surah (step Surah -> Ayat).
 * Deskripsi = penanda QA (dipakai cleanup). Mengembalikan deskripsi.
 *
 * @param {object} S        blok staging
 * @param {object} program  S.programSurahAyat
 * @param {object} opts     { surah: [19, 20], ayat: ['19:1', ...], deskripsi, pesan }
 */
export const buatRiwayatSurah = (S, program, { surah, ayat, deskripsi, pesan, urutanSurah }) => {
  bukaForm(S, program);
  Form.pilihStep('surah', urutanSurah || surah);
  Form.tandaiAyat(ayat);
  Form.isiField({ tanggal: hariIni(), deskripsi });
  Form.simpanSukses(pesan);
  DetailSiswaPage.assertRiwayatAda(deskripsi);
  return deskripsi;
};

/** Hapus seluruh riwayat QA siswa QA di satu program (column-scoped startsWith "QA"). */
export const bersihkan = (S, program, fx) => {
  if (!program || !program.id) return;
  bukaDetailSiswa(S, program);
  DetailSiswaPage.bersihkanRiwayatQA(fx.testData.prefix, fx.pesan.hapusSukses);
};

/** Generator deskripsi QA<ts><seq> per spec. */
export const penanda = (fx) => makeUniq(fx.testData.prefix);
