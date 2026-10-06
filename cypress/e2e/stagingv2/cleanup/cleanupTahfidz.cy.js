// UTILITAS CLEANUP (bukan test case) — hapus riwayat progres tahfidz buatan QA.
//
// WAJIB dijalankan setelah run modul Tahfidz yang terputus: riwayat yang
// tertinggal MENGUNCI ayatnya (satu ayat hanya tercatat pada satu riwayat,
// commit 228d96e9) sehingga run berikutnya gagal palsu.
//
// Pengaman:
// - Hanya membuka Detail Siswa milik siswa QA (staging.siswa.id) pada program
//   QA yang ada di blok `staging` fixture tahfidz.json.
// - Hanya menghapus baris yang kolom Deskripsi-nya diawali "QA" (column-scoped,
//   startsWith — BUKAN includes seluruh baris).
// - Dikecualikan dari run CI (excludeSpecPattern di cypress.config.js).
//
// Jalankan sendiri: npm run cy:cleanup:tahfidz
import { siapkan, bersihkan } from '../../../support/tahfidz';
import { stagingData } from '../../../support/helpers';

const PROGRAM = ['programUtama', 'programSurahAyat', 'programBatasJuz', 'programBatasHalaman', 'programBatasSurah', 'programTargetTerbatas'];

describe('Cleanup - Riwayat Progres Tahfidz QA', () => {
  let fx;
  let S;

  before(() => {
    cy.fixture('tahfidz').then((d) => {
      fx = d;
      S = stagingData(d, []);
    });
  });

  beforeEach(() => {
    siapkan();
  });

  PROGRAM.forEach((nama) => {
    it(`Hapus riwayat berawalan "QA" milik siswa QA di ${nama}`, function () {
      const p = S[nama];
      if (!p || !p.id) {
        cy.log(`${nama} belum diisi — dilewati`);
        this.skip();
      }
      cy.log(`Program ${p.nama} (#${p.id}), siswa #${S.siswa.id}`);
      bersihkan(S, p, fx);
    });
  });
});
