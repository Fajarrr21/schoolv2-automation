// Kesiswaan > Tahfidz — Halaman Detail Anggota & tab Tahfidz Detail Siswa
// (tiket Improvement Tahfidz, V2). TC sheet: TC-IMT-066..071, 099, 100 (070 = Manual).
import TahfidzDetailPage from '../../../../../support/pageobjects/tahfidz/TahfidzDetailPage';
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import { siapkan } from '../../../../../support/tahfidz';
import { batasData, buatRiwayat, bersihkanProgram, penanda, labelHalaman } from '../../../../../support/batas';
import { formatPencapaian, range, route } from '../../../../../support/helpers';

describe('Tahfidz - Detail Anggota (Batas Tahfidz)', () => {
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
    cy.then(() => bersihkanProgram(fx, [P.B, P.F]));
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => bersihkanProgram(fx, [P.B, P.F]));
  });

  const urlSiswa = (program) => route(fx.routes.detailSiswa, { tahfidzId: program.id, memberId: S.id });

  it('TC-IMT-066 : Buka detail anggota dengan klik Nama Anggota', () => {
    TahfidzDetailPage.visitAnggota(P.A.id, S.nama).klikNamaAnggota(S.id);
    cy.location('pathname').should('eq', urlSiswa(P.A));
    DetailSiswaPage.elements.cardDataSiswa().should('contain', S.nama);
  });

  it('TC-IMT-067 : Buka detail anggota dengan klik foto anggota', () => {
    TahfidzDetailPage.visitAnggota(P.A.id, S.nama).klikFotoAnggota(S.id);
    cy.location('pathname').should('eq', urlSiswa(P.A));
  });

  it('TC-IMT-068 : Buka detail anggota lewat Aksi > Detail', () => {
    TahfidzDetailPage.visitAnggota(P.A.id, S.nama).klikAksiAnggota(S.id, 'Detail');
    cy.location('pathname').should('eq', urlSiswa(P.A));
  });

  it('TC-IMT-069 : Nama anggota tampil sebagai tautan dengan efek hover', () => {
    TahfidzDetailPage.visitAnggota(P.A.id, S.nama);
    TahfidzDetailPage.elements.memberNama(S.id)
      .should('have.attr', 'href').and('match', new RegExp(`/member/${S.id}$`));
    TahfidzDetailPage.elements.memberNama(S.id).should('have.class', 'text-hover-primary');
  });

  it('TC-IMT-071 : Data Siswa menampilkan Batas Tahfidz', () => {
    // PRD Detail Siswa, Data Siswa poin 7. EA#2 & EA#3: card V2 tidak memuat
    // Batas Tahfidz (calon bug).
    DetailSiswaPage.visit(P.B.id, S.id);
    DetailSiswaPage.elements.cardDataSiswa().should(($c) => {
      const teks = $c.text().replace(/\s+/g, ' ');
      expect(teks, 'Data Siswa menyebut Batas Tahfidz').to.match(/Batas( Tahfidz)?:?\s*Halaman/i);
    });
  });

  it('TC-IMT-100 : Kolom Capaian tab Tahfidz untuk program tanpa riwayat', () => {
    DetailSiswaPage.visitAnggota(S.id);
    DetailSiswaPage.elements.anggotaRow(P.F.id).find('.mb-1.fw-bold').should(($d) => expect($d.text().trim()).to.eq('-'));
    DetailSiswaPage.anggotaCapaian(P.F.id).should('eq', formatPencapaian(0, P.F.total, P.F.satuan));
  });

  it('TC-IMT-099 : Kolom Capaian pada tab Tahfidz detail siswa', () => {
    const hal = [...range(22, 27), ...range(42, 45)]; // 10 halaman, terakhir mushaf 45
    buatRiwayat(fx, P.B, { pilih: { juz: [2, 3] }, units: hal.map(String), deskripsi: penanda(fx)() });
    DetailSiswaPage.visitAnggota(S.id);
    const metode = fx.instansi.qa.awal.metode;
    DetailSiswaPage.elements.anggotaRow(P.B.id).find('.mb-1.fw-bold')
      .should(($d) => expect($d.text().trim()).to.eq(`Juz 3, Halaman ${labelHalaman(fx, 45, 3, metode)}`));
    DetailSiswaPage.anggotaCapaian(P.B.id).should('eq', formatPencapaian(10, P.B.total, P.B.satuan));
  });
});
