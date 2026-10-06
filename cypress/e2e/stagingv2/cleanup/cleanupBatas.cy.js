// UTILITAS CLEANUP (bukan test case) — tiket Improvement Tahfidz (Batas Tahfidz).
//
// 1. Hapus riwayat progres QA siswa QA pada program A-F (fixture batas.json).
// 2. Kembalikan pengaturan Batas Tahfidz instansi QA ke nilai awal
//    (batas.instansi.qa.awal) bila run terputus sesudah mengubahnya.
//
// Pengaman sama dengan cleanupTahfidz: hanya siswa QA, hanya baris yang kolom
// Deskripsi-nya diawali "QA" (column-scoped), hanya instansi QA. Program A (#249),
// B (#251), C (#252), D (#253) juga dibersihkan cleanupTahfidz; aman dobel.
//
// Jalankan sendiri: npm run cy:cleanup:batas
import { siapkan } from '../../../support/tahfidz';
import { batasData, bersihkanProgram, pulihkanPengaturan } from '../../../support/batas';

const PROGRAM = ['A', 'B', 'C', 'D', 'E', 'F'];

describe('Cleanup - Batas Tahfidz QA', () => {
  let fx;

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
    });
  });

  beforeEach(() => {
    siapkan();
  });

  PROGRAM.forEach((k) => {
    it(`Hapus riwayat berawalan "QA" milik siswa QA di Program ${k}`, () => {
      const p = fx.programs[k];
      cy.log(`Program ${p.nama} (#${p.id}), siswa #${fx.siswa.id}`);
      bersihkanProgram(fx, [p]);
    });
  });

  it('Pulihkan pengaturan Batas Tahfidz instansi QA', () => {
    pulihkanPengaturan(fx);
  });
});
