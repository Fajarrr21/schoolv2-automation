// Kesiswaan > Tahfidz — Edit, list, export, dan hapus Riwayat Progres per Batas Tahfidz
// (tiket Improvement, V2). TC sheet: TC-IMT-093..098.
//
// before() membuat riwayat QA:
//   RA = Program A, Juz 26-28            (diedit TC-095 menjadi 26-29)
//   RB = Program B, Juz 2 halaman 22-24
//   RD = Program D, An-Naba' + An-Nazi'at
// Kolom Capaian Hafalan list = achievement_display_short; export = achievement_display.
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import Form, { RiwayatProgresFormClass } from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import TahfidzDetailPage from '../../../../../support/pageobjects/tahfidz/TahfidzDetailPage';
import { siapkan } from '../../../../../support/tahfidz';
import {
  batasData, buatRiwayat, bersihkanProgram, penanda, bukaSiswa, bukaFormRiwayat, capaianHalaman, editRiwayat,
} from '../../../../../support/batas';
import { formatPencapaian } from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Edit, List, Export, Hapus Riwayat (Batas Tahfidz)', () => {
  let fx;
  let P;
  let S;
  let uniq;
  const R = {};
  const HAL_B = [22, 23, 24];

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
      P = d.programs;
      S = d.siswa;
      uniq = penanda(d);
    });
    siapkan();
    cy.then(() => {
      bersihkanProgram(fx, [P.A, P.B, P.D]);
      R.A = buatRiwayat(fx, P.A, { units: ['26', '27', '28'], deskripsi: uniq() });
      R.B = buatRiwayat(fx, P.B, { pilih: { juz: [2] }, units: HAL_B.map(String), deskripsi: uniq() });
      R.D = buatRiwayat(fx, P.D, { units: ['78', '79'], deskripsi: uniq() });
    });
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => bersihkanProgram(fx, [P.A, P.B, P.D]));
  });

  const bukaEdit = (program, deskripsi) => {
    bukaSiswa(fx, program);
    DetailSiswaPage.tampilkanSemua().bukaEdit(deskripsi);
  };

  /** Export Excel Detail Siswa -> { header, col(nama), row(deskripsi) }. */
  const exportSheet = (program) => {
    const K = fx.riwayat.kolomExport;
    bukaSiswa(fx, program);
    return DetailSiswaPage.exportExcel()
      .then((file) => cy.task('readSheet', { filePath: file, header: 1 }))
      .then((aoa) => {
        const hIdx = aoa.findIndex((r) => r.map((c) => String(c).trim()).includes(K.capaian));
        expect(hIdx, 'header export ditemukan').to.be.gte(0);
        const header = aoa[hIdx].map((c) => String(c).trim());
        const rows = aoa.slice(hIdx + 1);
        const col = (nama) => header.indexOf(nama);
        const row = (desk) => rows.find((r) => String(r[col(K.deskripsi)]).trim() === desk);
        return { header, col, row };
      });
  };

  it('TC-IMT-093 : Form edit mengikuti Batas Tahfidz program', () => {
    bukaEdit(P.B, R.B);
    Form.elements.step('juz').should('exist');
    cy.get(M).find('[wire\\:key^="step-halaman"], [wire\\:key^="step-surah"]').should('not.exist');
    Form.nilaiChip('juz').should('deep.eq', [2]);
    Form.elements.labelTandai().should('contain', 'Tandai Halaman');
    Form.assertTerpilih(HAL_B.map(String));
    Form.elements.deskripsi().should('have.value', R.B);
    Form.batal();
  });

  it('TC-IMT-094 : Data pada form edit mengikuti target anggota', () => {
    bukaEdit(P.A, R.A);
    cy.get(M).should(($m) => {
      expect(RiwayatProgresFormClass.daftarKeys($m)).to.deep.eq(P.A.target.map(String));
    });
    Form.assertTerpilih(['26', '27', '28']);
    Form.batal();
  });

  it('TC-IMT-095 : Simpan perubahan riwayat', () => {
    editRiwayat(fx, P.A, R.A, { tambah: ['29'] });
    DetailSiswaPage.assertCell(R.A, 'capaian', 'Juz 26-29');
    DetailSiswaPage.assertCell(R.A, 'pencapaian', formatPencapaian(4, P.A.total, P.A.satuan));
    TahfidzDetailPage.visitAnggota(P.A.id, S.nama);
    TahfidzDetailPage.batasAnggota(S.id).should('eq', 'Juz 29');
    TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(4, P.A.total, P.A.satuan));
  });

  it('TC-IMT-096 : Kolom Capaian Hafalan dan Pencapaian pada list riwayat', () => {
    const metode = fx.instansi.qa.awal.metode;
    bukaSiswa(fx, P.A);
    DetailSiswaPage.tampilkanSemua();
    DetailSiswaPage.assertCell(R.A, 'capaian', 'Juz 26-29');
    DetailSiswaPage.assertCell(R.A, 'pencapaian', formatPencapaian(4, P.A.total, P.A.satuan));

    bukaSiswa(fx, P.B);
    DetailSiswaPage.tampilkanSemua();
    DetailSiswaPage.assertCell(R.B, 'capaian', capaianHalaman(fx, HAL_B, metode, P.B.target));
    DetailSiswaPage.assertCell(R.B, 'pencapaian', formatPencapaian(HAL_B.length, P.B.total, P.B.satuan));

    bukaSiswa(fx, P.D);
    DetailSiswaPage.tampilkanSemua();
    DetailSiswaPage.assertCell(R.D, 'capaian', `${fx.surah['78']}, ${fx.surah['79']}`);
    DetailSiswaPage.assertCell(R.D, 'pencapaian', formatPencapaian(2, P.D.total, P.D.satuan));
  });

  it('TC-IMT-097 : Export riwayat memuat Capaian Hafalan dan Pencapaian', () => {
    const K = fx.riwayat.kolomExport;
    exportSheet(P.A).then(({ header, col, row }) => {
      const iTgl = header.findIndex((h) => h.startsWith(K.tanggalRiwayatPrefix));
      expect(iTgl, 'kolom Tanggal Riwayat ada').to.be.gte(0);
      expect(header[iTgl + 1]).to.eq(K.capaian);
      const r = row(R.A);
      expect(r, `baris ${R.A} ada di export`).to.exist;
      expect(String(r[col(K.capaian)]).trim()).to.eq('Juz 26-29');
      expect(String(r[col(K.pencapaian)]).trim()).to.eq(formatPencapaian(4, P.A.total, P.A.satuan));
    });
  });

  it('TC-IMT-098 : Hapus riwayat menghitung ulang persentase', () => {
    // Pre-condition TC: 2 riwayat (total 4 juz). R.A dikembalikan ke 26-28, lalu R2 = Juz 29.
    editRiwayat(fx, P.A, R.A, { lepas: ['29'] });
    const r2 = buatRiwayat(fx, P.A, { units: ['29'], deskripsi: uniq() });
    DetailSiswaPage.assertCell(r2, 'pencapaian', formatPencapaian(4, P.A.total, P.A.satuan));
    // Keputusan dev B1 (6 Okt 2026): kumulatif diurutkan tanggal lalu id -> riwayat yang
    // dibuat lebih dulu di tanggal yang sama TIDAK ikut menghitung r2 (BUG-009).
    DetailSiswaPage.assertCell(R.A, 'pencapaian', formatPencapaian(3, P.A.total, P.A.satuan));

    DetailSiswaPage.tampilkanSemua().hapus(r2, fx.riwayat.pesanHapus);
    DetailSiswaPage.assertRiwayatTidakAda(r2);
    DetailSiswaPage.assertCell(R.A, 'pencapaian', formatPencapaian(3, P.A.total, P.A.satuan));

    TahfidzDetailPage.visitAnggota(P.A.id, S.nama);
    TahfidzDetailPage.batasAnggota(S.id).should('eq', 'Juz 28');
    TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(3, P.A.total, P.A.satuan));

    // Juz 29 bisa dipilih lagi.
    bukaFormRiwayat(fx, P.A);
    Form.elements.unitCheckbox('29').should('not.be.checked').and('be.enabled');
    Form.elements.unitLock('29').should('not.exist');
    Form.batal();
  });
});

