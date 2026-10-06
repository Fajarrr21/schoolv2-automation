// Kesiswaan > Tahfidz — Filter Batas Tahfidz di Detail Program (tiket Improvement, V2).
// TC sheet: TC-IMT-057..064.
//
// Satu anggota QA cukup: nilai = posisi terakhirnya -> tampil; nilai lain -> kosong.
// before() membuat riwayat (Deskripsi QA...) supaya posisi terakhir diketahui:
//   A: Juz 26, 27, 28            -> posisi terakhir Juz 28
//   B: halaman mushaf 42-45      -> Juz 3, halaman mushaf 45
//   C: Juz 30, hal 604, An-Nas 1-6 -> Juz 30, hal 604, Surah 114, Ayat 6
//   D: An-Naba', An-Nazi'at       -> Surah An-Nazi'at (79)
// Request filter WAJIB 200 (element analysis #3 menemukan HTTP 500 intermiten).
import TahfidzDetailPage from '../../../../../support/pageobjects/tahfidz/TahfidzDetailPage';
import { siapkan } from '../../../../../support/tahfidz';
import { batasData, buatRiwayat, bersihkanProgram, penanda } from '../../../../../support/batas';
import { range } from '../../../../../support/helpers';

describe('Tahfidz - Filter Batas Tahfidz (Detail Program)', () => {
  let fx;
  let P;
  let S;

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
      P = d.programs;
      S = d.siswa;
    });
    siapkan();
    cy.then(() => {
      const uniq = penanda(fx);
      bersihkanProgram(fx, [P.A, P.B, P.C, P.D]);
      buatRiwayat(fx, P.A, { units: ['26', '27', '28'], deskripsi: uniq() });
      buatRiwayat(fx, P.B, { pilih: { juz: [3] }, units: range(42, 45).map(String), deskripsi: uniq() });
      buatRiwayat(fx, P.C, {
        pilih: { juz: [30], halaman: [604], surah: [114] },
        units: range(1, 6).map((a) => `114:${a}`),
        deskripsi: uniq(),
      });
      buatRiwayat(fx, P.D, { units: ['78', '79'], deskripsi: uniq() });
    });
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => bersihkanProgram(fx, [P.A, P.B, P.C, P.D]));
  });

  const buka = (program) => TahfidzDetailPage.visit(program.id).bukaFilter();
  const harusTampil = () => TahfidzDetailPage.anggotaTampil().should('include', S.id);
  const harusKosong = () => {
    TahfidzDetailPage.anggotaTampil().should('not.include', S.id);
    cy.get('table.rappasoft-datatable tbody').should('contain', 'Tidak ada data yang ditemukan');
  };
  const opsiFilter = (step) =>
    TahfidzDetailPage.filterSelect(step).then(($s) =>
      Cypress.$.makeArray($s.find('option')).map((o) => o.value).filter(Boolean).map(Number),
    );

  it('TC-IMT-057 : Filter Batas Tahfidz pada program Batas Juz', () => {
    buka(P.A);
    TahfidzDetailPage.labelFilter().should('deep.eq', ['Juz']);
    opsiFilter('juz').should('deep.eq', P.A.target);
    TahfidzDetailPage.pilihFilterBatas('juz', 28);
    harusTampil();
  });

  it('TC-IMT-058 : Filter Batas Tahfidz pada program Batas Halaman (Juz lalu Halaman)', () => {
    const [a, b] = fx.mushaf.juz['3'];
    buka(P.B);
    TahfidzDetailPage.labelFilter().should('deep.eq', ['Juz']);
    TahfidzDetailPage.pilihFilterBatas('juz', 3);
    TahfidzDetailPage.labelFilter().should('deep.eq', ['Juz', 'Halaman']);
    opsiFilter('halaman').should((v) => {
      expect(v.length).to.eq(b - a + 1);
      v.forEach((p) => expect(p, 'halaman milik Juz 3').to.be.within(a, b));
    });
    TahfidzDetailPage.pilihFilterBatas('halaman', 45);
    harusTampil();
  });

  it('TC-IMT-059 : Filter Batas Tahfidz pada program Batas Surah', () => {
    buka(P.D);
    TahfidzDetailPage.labelFilter().should('deep.eq', ['Surah']);
    TahfidzDetailPage.pilihFilterBatas('surah', 79);
    harusTampil();
  });

  it('TC-IMT-060 : Filter Batas Tahfidz pada program Batas Ayat (Juz > Halaman > Surah > Ayat)', () => {
    buka(P.C);
    TahfidzDetailPage.pilihFilterBatas('juz', 30);
    TahfidzDetailPage.pilihFilterBatas('halaman', 604);
    opsiFilter('surah').should('deep.eq', fx.mushaf.halaman604Surah);
    TahfidzDetailPage.pilihFilterBatas('surah', 114);
    TahfidzDetailPage.labelFilter().should('deep.eq', ['Juz', 'Halaman', 'Surah', 'Ayat']);
    TahfidzDetailPage.pilihFilterBatas('ayat', 6);
    harusTampil();
  });

  it('TC-IMT-061 : Filter memakai nilai posisi terakhir, bukan riwayat lama', () => {
    // Aisyah pernah menandai Juz 27, tetapi posisi terakhirnya Juz 28.
    buka(P.A);
    TahfidzDetailPage.pilihFilterBatas('juz', 27);
    harusKosong();
  });

  it('TC-IMT-062 : Tingkat filter dengan satu pilihan terpilih otomatis dan dilewati', () => {
    // PRD Detail Tahfidz, Filter c. Program F target hanya Juz 30 -> tingkat Juz
    // dilewati, langsung Halaman. EA#3: V2 tetap menampilkan filter Juz (calon bug).
    buka(P.F);
    TahfidzDetailPage.labelFilter().should('not.include', 'Juz').and('include', 'Halaman');
  });

  it('TC-IMT-063 : Filter tanpa hasil dan mengosongkan filter', () => {
    buka(P.A);
    TahfidzDetailPage.pilihFilterBatas('juz', 29);
    harusKosong();
    TahfidzDetailPage.pilihFilterBatas('juz', '');
    harusTampil();
  });

  it('TC-IMT-064 : Export mengikuti filter yang diterapkan', () => {
    buka(P.A);
    TahfidzDetailPage.pilihFilterBatas('juz', 28);
    harusTampil();
    cy.task('clearDownloads');
    cy.get('button[wire\\:click="$emit(\'export_table\')"]').click();
    cy.task('waitDownload', { ext: '.xlsx', timeout: 30000 }, { timeout: 40000 })
      .should('not.be.null')
      .then((file) => cy.task('readSheet', { filePath: file, header: 1 }))
      .then((aoa) => {
        const teks = JSON.stringify(aoa);
        expect(teks, 'file export memuat anggota hasil filter').to.contain(S.nama);
      });
  });
});
