// Kesiswaan > Tahfidz — Form Tambah Riwayat Progres per Batas Tahfidz (tiket Improvement, V2).
// TC sheet: TC-IMT-072..092.
//
// Perilaku V2 (source origin/staging, MemberDetail.php + TahfidzUnit.php):
// - Langkah = TahfidzUnit::steps(jenis, batas). Langkah TERAKHIR selalu jadi daftar
//   centang ("Tandai <Batas> yang sudah hafal"), langkah sebelumnya jadi dropdown.
// - Dropdown yang pilihannya tinggal satu dipilih otomatis dan disembunyikan.
// - Label halaman memakai metode instansi; value tetap nomor mushaf absolut.
//   Per juz + lebih dari satu juz dipilih -> label "Juz 2 - Halaman 1".
// Expected pencapaian dihitung dari data uji (formatPencapaian), bukan disalin dari layar.
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import Form, { RiwayatProgresFormClass } from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import { siapkan } from '../../../../../support/tahfidz';
import {
  batasData, buatRiwayat, bersihkanProgram, pulihkanPengaturan, penanda,
  bukaFormRiwayat, capaianHalaman, denganMetode,
} from '../../../../../support/batas';
import { formatPencapaian, range, hariIni, fill } from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Form Tambah Riwayat (Batas Tahfidz)', () => {
  let fx;
  let P;
  let uniq;

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
      P = d.programs;
      uniq = penanda(d);
    });
    siapkan();
    cy.then(() => bersihkanProgram(fx, ['A', 'B', 'C', 'D', 'E', 'F'].map((k) => P[k])));
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => {
      bersihkanProgram(fx, ['A', 'B', 'C', 'D', 'E', 'F'].map((k) => P[k]));
      pulihkanPengaturan(fx);
    });
  });

  // ------------------------------------------------------------------ baca state form (sinkron)
  /** Nama langkah dropdown yang tampil, urut DOM (wire:key "step-juz-3" -> "juz"). */
  const langkahTampil = () =>
    cy.get(M).then(($m) =>
      // Sejak deploy a9e3c84c opsi dropdown juga ber-wire:key "step-option-..." -> dikecualikan.
      Cypress.$.makeArray($m.find('[wire\\:key^="step-"]:not([wire\\:key^="step-option-"])')).map((el) => el.getAttribute('wire:key').split('-')[1]),
    );
  /** Label opsi dropdown sebuah langkah, urut DOM. */
  const labelOpsi = (step) =>
    Form.elements.stepOpsiSemua(step).then(($i) =>
      Cypress.$.makeArray($i).map((el) => Cypress.$(el).siblings('.form-check-label').text().trim()),
    );
  /** Label item Daftar Satuan (langkah terakhir), urut DOM. */
  const labelSatuan = () =>
    cy.get(M).then(($m) =>
      Cypress.$.makeArray($m.find('[wire\\:key^="unit-"] .form-check-label')).map((el) => el.textContent.trim()),
    );
  const kunciSatuan = () => cy.get(M).then(($m) => RiwayatProgresFormClass.daftarKeys($m));
  const tandai = (step) =>
    Form.elements.labelTandai().should(($l) => expect($l.text().replace(/\s+/g, ' ').trim()).to.eq(fill(fx.riwayat.tandai, { step })));
  const str = (arr) => arr.map(String);

  // =========================================================================
  describe('Langkah pemilihan sesuai Jenis dan Batas Tahfidz', () => {
    it('TC-IMT-072 : Langkah pemilihan Jenis Jus Batas Juz', () => {
      bukaFormRiwayat(fx, P.A);
      langkahTampil().should('deep.eq', []); // Juz = langkah terakhir -> daftar centang
      tandai('Juz');
      kunciSatuan().should('deep.eq', str(P.A.target));
      labelSatuan().should('deep.eq', P.A.target.map((j) => `Juz ${j}`));
      Form.batal();
    });

    it('TC-IMT-073 : Langkah pemilihan Jenis Jus Batas Halaman', () => {
      bukaFormRiwayat(fx, P.B);
      langkahTampil().should('deep.eq', ['juz']);
      Form.nilaiOpsiStep('juz').should('deep.eq', P.B.target);
      Form.pilihStep('juz', [2]);
      langkahTampil().should('deep.eq', ['juz']);
      tandai('Halaman');
      Form.batal();
    });

    it('TC-IMT-074 : Langkah pemilihan Jenis Jus Batas Ayat', () => {
      bukaFormRiwayat(fx, P.C);
      langkahTampil().should('deep.eq', ['juz']);
      Form.pilihStep('juz', [30]);
      langkahTampil().should('deep.eq', ['juz', 'halaman']);
      Form.pilihStep('halaman', [604]);
      langkahTampil().should('deep.eq', ['juz', 'halaman', 'surah']);
      Form.pilihStep('surah', [114]);
      tandai('Ayat');
      kunciSatuan().should('deep.eq', range(1, 6).map((a) => `114:${a}`));
      Form.batal();
    });

    it('TC-IMT-075 : Langkah pemilihan Jenis Surah Batas Surah', () => {
      bukaFormRiwayat(fx, P.D);
      langkahTampil().should('deep.eq', []); // Surah = langkah terakhir -> daftar centang
      tandai('Surah');
      kunciSatuan().should('deep.eq', str(P.D.target));
      labelSatuan().should('deep.eq', P.D.target.map((s) => fx.surah[s]));
      Form.batal();
    });

    it('TC-IMT-076 : Langkah pemilihan Jenis Surah Batas Ayat', () => {
      bukaFormRiwayat(fx, P.E);
      langkahTampil().should('deep.eq', ['surah']);
      Form.nilaiOpsiStep('surah').should('deep.eq', P.E.target);
      Form.pilihStep('surah', [78]);
      langkahTampil().should('deep.eq', ['surah']);
      tandai('Ayat');
      Form.batal();
    });
  });

  // =========================================================================
  describe('Penyaringan pilihan', () => {
    it('TC-IMT-077 : Memilih Juz menyaring pilihan Halaman', () => {
      const [a2, b2] = fx.mushaf.juz['2'];
      const [a3, b3] = fx.mushaf.juz['3'];
      bukaFormRiwayat(fx, P.B);
      Form.pilihStep('juz', [2]);
      kunciSatuan().should('deep.eq', str(range(a2, b2)));
      Form.klikStep('juz', 2); // lepas Juz 2 (belum ada halaman ditandai -> tanpa popup)
      Form.pilihStep('juz', [3]);
      kunciSatuan().should('deep.eq', str(range(a3, b3)));
      Form.batal();
    });

    it('TC-IMT-078 : Memilih Halaman menyaring pilihan Surah', () => {
      bukaFormRiwayat(fx, P.C);
      Form.pilihStep('juz', [30]).pilihStep('halaman', [604]);
      Form.nilaiOpsiStep('surah').should('deep.eq', fx.mushaf.halaman604Surah);
      labelOpsi('surah').should('deep.eq', fx.mushaf.halaman604Surah.map((s) => fx.surah[s]));
      Form.batal();
    });

    it('TC-IMT-079 : Memilih Surah menyaring pilihan Ayat', () => {
      bukaFormRiwayat(fx, P.C);
      Form.pilihStep('juz', [30]).pilihStep('halaman', [604]).pilihStep('surah', [113]);
      kunciSatuan().should('deep.eq', range(1, fx.mushaf.alFalaqAyat).map((a) => `113:${a}`));
      Form.batal();
    });

    it('TC-IMT-080 : Langkah dengan satu pilihan terpilih otomatis', () => {
      const [a, b] = fx.mushaf.juz['30'];
      bukaFormRiwayat(fx, P.F);
      langkahTampil().should('deep.eq', []); // Juz 30 auto-pilih, Halaman = daftar centang
      tandai('Halaman');
      kunciSatuan().should('deep.eq', str(range(a, b)));
      Form.batal();
    });

    it('TC-IMT-081 : Satuan di luar target tidak dapat dipilih', () => {
      bukaFormRiwayat(fx, P.A);
      kunciSatuan().should((k) => {
        range(1, 25).forEach((j) => expect(k, `Juz ${j} di luar target`).not.to.include(String(j)));
        expect(k).to.deep.eq(str(P.A.target));
      });
      Form.batal();
    });

    it('TC-IMT-082 : Mengubah pilihan langkah sebelumnya mengosongkan langkah sesudahnya', () => {
      bukaFormRiwayat(fx, P.C);
      Form.pilihStep('juz', [30]).pilihStep('halaman', [604]).pilihStep('surah', [113]);
      Form.nilaiChip('surah').should('deep.eq', [113]);
      // Ganti halaman: tambah 603 lalu lepas 604 (belum ada ayat ditandai -> tanpa popup).
      Form.pilihStep('halaman', [603]);
      Form.klikStep('halaman', 604);
      Form.tutupStep('halaman');
      Form.nilaiChip('halaman').should('deep.eq', [603]);
      Form.nilaiChip('surah').should('deep.eq', []);
      Form.nilaiOpsiStep('surah').should((s) => {
        expect(s.length, 'daftar surah halaman 603').to.be.gt(0);
        fx.mushaf.halaman604Surah.forEach((x) => expect(s, `surah ${x} hanya di halaman 604`).not.to.include(x));
      });
      kunciSatuan().should('deep.eq', []);
      cy.contains(M, fx.riwayat.lengkapiPilihan).should('be.visible');
      Form.batal();
    });
  });

  // =========================================================================
  describe('Metode penomoran halaman', () => {
    it('TC-IMT-083 : Metode Nomor halaman mushaf (1 sampai 604)', () => {
      const [a, b] = fx.mushaf.juz['30'];
      denganMetode(fx, 'mushaf', () => {
        bukaFormRiwayat(fx, P.F);
        labelSatuan().should('deep.eq', range(a, b).map((p) => `Halaman ${p}`));
        Form.batal();
      });
    });

    it('TC-IMT-084 : Metode Halaman dimulai dari 1 pada setiap juz', () => {
      const n = (j) => fx.mushaf.juz[j][1] - fx.mushaf.juz[j][0] + 1;
      denganMetode(fx, 'per_juz', () => {
        bukaFormRiwayat(fx, P.F);
        labelSatuan().should('deep.eq', range(1, n('30')).map((p) => `Halaman ${p}`));
        Form.batal();

        bukaFormRiwayat(fx, P.B);
        Form.pilihStep('juz', [2]);
        labelSatuan().should('deep.eq', range(1, n('2')).map((p) => `Halaman ${p}`));
        Form.pilihStep('juz', [3]);
        // Lebih dari satu juz -> nama juz ikut disebut supaya "Halaman 1" tidak kembar.
        labelSatuan().should('deep.eq', [
          ...range(1, n('2')).map((p) => `Juz 2 - Halaman ${p}`),
          ...range(1, n('3')).map((p) => `Juz 3 - Halaman ${p}`),
        ]);
        Form.batal();
      });
    });

    it('TC-IMT-085 : Metode halaman juga berlaku pada langkah Halaman di Batas Ayat', () => {
      const n = fx.mushaf.juz['30'][1] - fx.mushaf.juz['30'][0] + 1;
      denganMetode(fx, 'per_juz', () => {
        bukaFormRiwayat(fx, P.C);
        Form.pilihStep('juz', [30]);
        Form.bukaStep('halaman');
        labelOpsi('halaman').should('deep.eq', range(1, n).map((p) => `Halaman ${p}`));
        Form.tutupStep('halaman');
        Form.batal();
      });
    });
  });

  // =========================================================================
  describe('Menandai satuan', () => {
    it('TC-IMT-086 : Satuan yang ditandai mengikuti Batas Tahfidz', () => {
      bukaFormRiwayat(fx, P.A);
      Form.centangAyat(['26', '27']).assertJumlahTerpilih(2, 'juz');
      Form.batal();

      bukaFormRiwayat(fx, P.B);
      Form.pilihStep('juz', [2]);
      Form.centangAyat(['22', '23']).assertJumlahTerpilih(2, 'halaman');
      Form.batal();

      bukaFormRiwayat(fx, P.D);
      Form.centangAyat(['78', '79']).assertJumlahTerpilih(2, 'surah');
      Form.batal();

      bukaFormRiwayat(fx, P.E);
      Form.pilihStep('surah', [78]);
      Form.centangAyat(['78:1', '78:2']).assertJumlahTerpilih(2, 'ayat');
      Form.batal();
    });

    it('TC-IMT-087 : Simpan tanpa menandai satuan', () => {
      const desk = uniq();
      bukaFormRiwayat(fx, P.A);
      Form.isiField({ tanggal: hariIni(), deskripsi: desk });
      Form.simpan();
      Form.assertErrorValidasi(fx.riwayat.minimalSatuan);
      Form.elements.modal().should('be.visible');
      Form.batal();
      DetailSiswaPage.tampilkanSemua().assertRiwayatTidakAda(desk);
    });
  });

  // =========================================================================
  describe('Simpan riwayat dan pencapaian', () => {
    it('TC-IMT-089 : Simpan riwayat dan persentase sesuai Batas Juz', () => {
      const desk = buatRiwayat(fx, P.A, { units: ['26', '27', '28'], deskripsi: uniq() });
      DetailSiswaPage.assertCell(desk, 'capaian', 'Juz 26-28');
      DetailSiswaPage.assertCell(desk, 'pencapaian', formatPencapaian(3, P.A.total, P.A.satuan));
    });

    it('TC-IMT-088 : Satuan dari riwayat sebelumnya tampil tercentang', () => {
      // Lanjutan TC-IMT-089: Juz 26-28 sudah tercatat.
      bukaFormRiwayat(fx, P.A);
      ['26', '27', '28'].forEach((k) => {
        Form.elements.unitCheckbox(k).should('be.checked').and('be.disabled');
        Form.elements.unitLock(k).should('exist');
      });
      Form.elements.unitCheckbox('29').should('not.be.checked').and('be.enabled');
      Form.batal();
    });

    it('TC-IMT-090 : Simpan riwayat dan persentase sesuai Batas Halaman', () => {
      const metode = fx.instansi.qa.awal.metode;
      const hal = [...range(22, 27), ...range(42, 45)];
      bersihkanProgram(fx, [P.B]);
      const desk = buatRiwayat(fx, P.B, { pilih: { juz: [2, 3] }, units: str(hal), deskripsi: uniq() });
      DetailSiswaPage.assertCell(desk, 'capaian', capaianHalaman(fx, hal, metode, P.B.target));
      DetailSiswaPage.assertCell(desk, 'pencapaian', formatPencapaian(10, P.B.total, P.B.satuan));
    });

    it('TC-IMT-092 : Hafalan tidak berurutan tetap dihitung apa adanya', () => {
      const metode = fx.instansi.qa.awal.metode;
      const hal = [22, 25, 30];
      bersihkanProgram(fx, [P.B]);
      const desk = buatRiwayat(fx, P.B, { pilih: { juz: [2] }, units: str(hal), deskripsi: uniq() });
      DetailSiswaPage.assertCell(desk, 'capaian', capaianHalaman(fx, hal, metode, P.B.target));
      DetailSiswaPage.assertCell(desk, 'pencapaian', formatPencapaian(3, P.B.total, P.B.satuan));
      cy.wrap(formatPencapaian(3, P.B.total, P.B.satuan)).should('eq', '7.32% (3 dari 41 halaman)');
    });

    it('TC-IMT-091 : Simpan riwayat dan persentase sesuai Batas Surah dan Batas Ayat', () => {
      const dD = buatRiwayat(fx, P.D, { units: ['78', '79'], deskripsi: uniq() });
      DetailSiswaPage.assertCell(dD, 'capaian', `${fx.surah['78']}, ${fx.surah['79']}`);
      DetailSiswaPage.assertCell(dD, 'pencapaian', formatPencapaian(2, P.D.total, P.D.satuan));

      const ayat = range(14, 20).map((a) => `78:${a}`);
      const dE = buatRiwayat(fx, P.E, { pilih: { surah: [78] }, units: ayat, deskripsi: uniq() });
      DetailSiswaPage.assertCell(dE, 'pencapaian', formatPencapaian(7, P.E.total, P.E.satuan));
    });
  });
});

