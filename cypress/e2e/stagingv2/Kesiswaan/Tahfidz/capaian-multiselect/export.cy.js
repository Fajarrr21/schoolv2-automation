// Tahfidz > Capaian Multi Select — Export Riwayat Progress (Excel di Detail Siswa).
// TC sheet: TC-089..092. Data: PRG-SA.
// before() membuat 2 riwayat QA:
//   R1 = Maryam 1-5 + Taha 1-3, 7, 10        (TC-091)
//   R2 = An-Naba', An-Nazi'at, 'Abasa, At-Takwir ayat 1-2   (TC-090, 4 surat)
// Isi file dibaca lewat cy.task('readSheet', { header: 1 }) -> array of array.
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import { siapkan, bukaDetailSiswa, bersihkan, buatRiwayatSurah, penanda } from '../../../../../support/tahfidz';
import { stagingData, keys, keysToSurat, formatCapaian } from '../../../../../support/helpers';

describe('Tahfidz - Capaian Multi Select - Export Riwayat', () => {
  let fx;
  let S;
  let SA;
  const R = {};
  const AYAT1 = [...keys(19, 1, 5), '20:1', '20:2', '20:3', '20:7', '20:10'];
  const AYAT2 = [...keys(78, 1, 2), ...keys(79, 1, 2), ...keys(80, 1, 2), ...keys(81, 1, 2)];

  before(() => {
    cy.fixture('tahfidz').then((d) => {
      fx = d;
      S = stagingData(d);
      SA = S.programSurahAyat;
    });
    siapkan();
    cy.then(() => {
      const uniq = penanda(fx);
      bersihkan(S, SA, fx);
      R.R1 = buatRiwayatSurah(S, SA, { surah: [19, 20], ayat: AYAT1, deskripsi: uniq(), pesan: fx.pesan.tambahSukses });
      R.R2 = buatRiwayatSurah(S, SA, { surah: [78, 79, 80, 81], ayat: AYAT2, deskripsi: uniq(), pesan: fx.pesan.tambahSukses });
    });
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => bersihkan(S, SA, fx));
  });

  /** Export lalu kembalikan { header, rows, col(nama), row(deskripsi) }. */
  const exportSheet = () => {
    bukaDetailSiswa(S, SA);
    return DetailSiswaPage.exportExcel()
      .then((file) => cy.task('readSheet', { filePath: file, header: 1 }))
      .then((aoa) => {
        // Baris header = baris pertama yang memuat "Capaian Hafalan".
        const hIdx = aoa.findIndex((r) => r.map((c) => String(c).trim()).includes(fx.label.kolomExport.capaian));
        expect(hIdx, 'header export ditemukan').to.be.gte(0);
        const header = aoa[hIdx].map((c) => String(c).trim());
        const rows = aoa.slice(hIdx + 1);
        const col = (nama) => header.indexOf(nama);
        const row = (desk) => rows.find((r) => String(r[col(fx.label.kolomExport.deskripsi)]).trim() === desk);
        return { header, rows, col, row };
      });
  };

  it('TC-089 : Kolom Capaian Hafalan ada pada file export tepat setelah kolom Tanggal Riwayat', () => {
    // Q9: header V2 "Tanggal Riwayat" (PRD "Tanggal Riwayat Tahfidz") -> dicocokkan lewat awalan.
    exportSheet().then(({ header }) => {
      const iTgl = header.findIndex((h) => h.startsWith(fx.label.kolomExport.tanggalRiwayatPrefix));
      expect(iTgl, 'kolom Tanggal Riwayat ada').to.be.gte(0);
      expect(header[iTgl + 1]).to.eq(fx.label.kolomExport.capaian);
    });
  });

  it('TC-090 : Riwayat lebih dari dua surat ditulis lengkap pada export', () => {
    const lengkap = formatCapaian(keysToSurat(AYAT2, fx.surah), { template: fx.format.capaianPerSurat });
    exportSheet().then(({ col, row }) => {
      const r = row(R.R2);
      expect(r, `baris ${R.R2} ada di export`).to.exist;
      const cap = String(r[col(fx.label.kolomExport.capaian)]).trim();
      expect(cap).not.to.match(/\+\d+ surat/);
      expect(cap).to.eq(lengkap);
    });
  });

  it('TC-091 : Penulisan rentang dan ayat loncat pada export sama dengan list', () => {
    const expected = formatCapaian(keysToSurat(AYAT1, fx.surah), { template: fx.format.capaianPerSurat });
    exportSheet().then(({ col, row }) => {
      const cap = String(row(R.R1)[col(fx.label.kolomExport.capaian)]).trim();
      expect(cap).to.eq(expected);
      DetailSiswaPage.cell(R.R1, 'capaian').should('eq', cap);
    });
  });

  it('TC-092 : Kolom Pencapaian pada export ditulis beserta pecahannya', () => {
    exportSheet().then(({ col, row }) => {
      [R.R1, R.R2].forEach((d) => {
        const p = String(row(d)[col(fx.label.kolomExport.pencapaian)]).trim();
        expect(p).to.match(/^\d+(\.\d{2})?% \(\d+ dari \d+ ayat\)$/);
      });
    });
  });
});
