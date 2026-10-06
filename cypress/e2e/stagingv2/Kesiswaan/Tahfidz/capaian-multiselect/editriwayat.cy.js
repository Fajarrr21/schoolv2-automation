// Tahfidz > Capaian Multi Select — Edit Riwayat.
// TC sheet: TC-003, 075, 080. Data: PRG-SA.
// before() membuat 3 riwayat QA:
//   RA = Maryam 1-5             (riwayat LAIN, pengunci untuk TC-075)
//   RB = Taha 1-5               (riwayat yang diedit di TC-075 & TC-080)
//   RC = Maryam 20-22 + Taha 20-22 (riwayat 2 surat untuk TC-003)
import Form, { RiwayatProgresFormClass as F } from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import { siapkan, bukaDetailSiswa, bersihkan, buatRiwayatSurah, penanda } from '../../../../../support/tahfidz';
import { stagingData, keys } from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Capaian Multi Select - Edit Riwayat', () => {
  let fx;
  let S;
  let SA;
  const R = {};

  before(() => {
    cy.fixture('tahfidz').then((d) => {
      fx = d;
      S = stagingData(d);
      SA = S.programSurahAyat;
    });
    siapkan();
    cy.then(() => {
      const uniq = penanda(fx);
      const ok = fx.pesan.tambahSukses;
      bersihkan(S, SA, fx);
      R.A = buatRiwayatSurah(S, SA, { surah: [19], ayat: keys(19, 1, 5), deskripsi: uniq(), pesan: ok });
      R.B = buatRiwayatSurah(S, SA, { surah: [20], ayat: keys(20, 1, 5), deskripsi: uniq(), pesan: ok });
      R.C = buatRiwayatSurah(S, SA, {
        surah: [19, 20],
        ayat: [...keys(19, 20, 22), ...keys(20, 20, 22)],
        deskripsi: uniq(),
        pesan: ok,
      });
    });
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => bersihkan(S, SA, fx));
  });

  it('TC-003 : Form Edit Riwayat memuat pilihan riwayat yang diedit dalam mode multi select', () => {
    bukaDetailSiswa(S, SA);
    DetailSiswaPage.bukaEdit(R.C);
    Form.nilaiChip('surah').should('deep.eq', [19, 20]);
    const milik = [...keys(19, 20, 22), ...keys(20, 20, 22)];
    Form.assertTerpilih(milik);
    milik.forEach((k) => Form.elements.unitCheckbox(k).should('be.checked').and('not.be.disabled'));
    Form.elements.deskripsi().should('have.value', R.C);
  });

  it('TC-075 : Form Edit hanya membuka ayat milik riwayat yang sedang diubah', () => {
    bukaDetailSiswa(S, SA);
    DetailSiswaPage.bukaEdit(R.B);
    Form.pilihStep('surah', [19]);
    keys(20, 1, 5).forEach((k) => Form.elements.unitCheckbox(k).should('be.checked').and('not.be.disabled'));
    keys(19, 1, 5).forEach((k) => Form.elements.unitCheckbox(k).should('be.checked').and('be.disabled'));
    // Ayat milik riwayat ini bisa dilepas.
    Form.lepasAyat('20:5');
    Form.assertTerpilih(keys(20, 1, 4));
    Form.batal();
  });

  it('TC-080 : Edit riwayat dengan menambah surat', () => {
    bukaDetailSiswa(S, SA);
    DetailSiswaPage.bukaEdit(R.B);
    Form.pilihStep('surah', [19]);
    Form.terapkanRentang('19:10', '19:12');
    Form.assertTerpilih([...keys(19, 10, 12), ...keys(20, 1, 5)]);
    Form.simpanSukses(fx.pesan.editSukses);

    cy.reload();
    DetailSiswaPage.cell(R.B, 'capaian').should('contain', fx.surah['19'].nama).and('contain', fx.surah['20'].nama);
    DetailSiswaPage.bukaEdit(R.B);
    Form.assertTerpilih([...keys(19, 10, 12), ...keys(20, 1, 5)]);
    cy.get(M).should(($m) => expect(F.daftarHeaders($m).map((h) => h.nama)).to.include.members(['Maryam', 'Taha']));
    Form.batal();
  });
});
