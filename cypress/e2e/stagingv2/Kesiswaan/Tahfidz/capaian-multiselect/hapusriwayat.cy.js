// Tahfidz > Capaian Multi Select — Hapus Riwayat (ayat kembali tersedia +
// persentase dihitung ulang).
// TC sheet: TC-094. Data: PRG-SA. Persistence diverifikasi lewat reload, di
// Detail Siswa, Detail program, dan tab Tahfidz Anggota.
import Form from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import TahfidzDetailPage from '../../../../../support/pageobjects/tahfidz/TahfidzDetailPage';
import { siapkan, bukaDetailSiswa, bersihkan, buatRiwayatSurah, penanda } from '../../../../../support/tahfidz';
import { stagingData, keys, formatPencapaian } from '../../../../../support/helpers';

describe('Tahfidz - Capaian Multi Select - Hapus Riwayat', () => {
  let fx;
  let S;
  let SA;

  before(() => {
    cy.fixture('tahfidz').then((d) => {
      fx = d;
      S = stagingData(d);
      SA = S.programSurahAyat;
    });
    siapkan();
    cy.then(() => bersihkan(S, SA, fx));
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => bersihkan(S, SA, fx));
  });

  it('TC-094 : Menghapus riwayat multi surat membuka kembali ayatnya dan menghitung ulang persentase', () => {
    const total = SA.target.reduce((n, s) => n + fx.surah[s].ayat, 0);
    const ayat = [...keys(19, 1, 10), ...keys(20, 1, 10)];
    const desk = penanda(fx)();

    buatRiwayatSurah(S, SA, { surah: [19, 20], ayat, deskripsi: desk, pesan: fx.pesan.tambahSukses });
    TahfidzDetailPage.visitAnggota(SA.id, S.siswa.nama);
    TahfidzDetailPage.pencapaianAnggota(S.siswa.id).should('eq', formatPencapaian(20, total, 'ayat', fx.format.pencapaian));

    bukaDetailSiswa(S, SA);
    DetailSiswaPage.hapus(desk, fx.pesan.hapusSukses);
    cy.reload();
    DetailSiswaPage.assertRiwayatTidakAda(desk);

    // Ayat terbuka kembali.
    DetailSiswaPage.bukaTambah();
    Form.pilihStep('surah', [19, 20]);
    ayat.forEach((k) => Form.elements.unitCheckbox(k).should('not.be.checked').and('not.be.disabled'));
    Form.batal();

    // Persentase dihitung ulang (tidak ada riwayat lain di program QA ini).
    const nol = formatPencapaian(0, total, 'ayat', fx.format.pencapaian);
    TahfidzDetailPage.visitAnggota(SA.id, S.siswa.nama);
    TahfidzDetailPage.pencapaianAnggota(S.siswa.id).should('eq', nol);
    DetailSiswaPage.visitAnggota(S.siswa.id);
    DetailSiswaPage.anggotaCapaian(SA.id).should('eq', nol);
  });
});
