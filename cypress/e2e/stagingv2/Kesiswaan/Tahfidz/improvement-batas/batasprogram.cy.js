// Kesiswaan > Tahfidz — Batas Tahfidz pada form program (tiket Improvement Tahfidz, V2).
// TC sheet: TC-IMT-028..037 (033 = N/A V2, 034 & 038 = Manual, 039 = N/A V2).
//
// Form TAMBAH program TIDAK PERNAH disimpan (create mengirim notifikasi "Tahfidz Baru").
// Form EDIT disimpan hanya untuk Program A QA (#249) dan Batas Tahfidz-nya dikembalikan
// ke "juz" di after(). Pengaturan instansi QA yang diubah TC-IMT-035 dipulihkan.
import ProgramTahfidzPage from '../../../../../support/pageobjects/tahfidz/ProgramTahfidzPage';
import TahfidzDetailPage from '../../../../../support/pageobjects/tahfidz/TahfidzDetailPage';
import PengaturanBatasPage from '../../../../../support/pageobjects/pengaturan/PengaturanBatasPage';
import Form from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import { siapkan } from '../../../../../support/tahfidz';
import { batasData, bukaFormRiwayat, buatRiwayat, bersihkanProgram, pulihkanPengaturan, penanda } from '../../../../../support/batas';

const M = '#modal-tahfidz.show';
const opsi = ($s) => Cypress.$.makeArray($s.find('option')).map((o) => o.value);

describe('Tahfidz - Batas Tahfidz pada Program', () => {
  let fx;
  let A;
  let B;
  let QA;

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
      ({ A, B } = d.programs);
      QA = d.instansi.qa;
    });
    siapkan();
    cy.then(() => bersihkanProgram(fx, [A, B]));
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => {
      bersihkanProgram(fx, [A, B]);
      // Kembalikan Batas Program A ke "juz" bila sempat berubah.
      ProgramTahfidzPage.visit().bukaEdit(A.id, A.nama);
      cy.get(M).then(($m) => {
        const v = $m.find('select[wire\\:model\\.defer="tahfidz_limit"]').val();
        if (v && v !== A.batas) {
          ProgramTahfidzPage.elements.batasSelect().select(A.batas);
          ProgramTahfidzPage.simpanEdit(fx.program.pesanEdit);
        } else {
          ProgramTahfidzPage.batal();
        }
      });
      pulihkanPengaturan(fx);
    });
  });

  // =========================================================================
  describe('Form Tambah program (tidak disimpan)', () => {
    it('TC-IMT-028 : Field Batas Tahfidz terisi otomatis dari pengaturan instansi', () => {
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(QA.nama).pilihJenis('juz');
      ProgramTahfidzPage.nilaiBatas().should('eq', QA.awal.batas);
      ProgramTahfidzPage.elements.batasHelper().should(($d) => expect($d.text().trim()).to.eq(fx.program.helperBatas));
      cy.contains(`${M} label.required`, 'Batas Tahfidz').should('exist');
      ProgramTahfidzPage.batal();
    });

    it('TC-IMT-029 : Pilihan Batas Tahfidz untuk Jenis Jus hanya Juz, Halaman, Ayat', () => {
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(QA.nama).pilihJenis('juz');
      ProgramTahfidzPage.elements.batasSelect().should(($s) => expect(opsi($s)).to.deep.eq(fx.program.opsiJenisJuz));
      ProgramTahfidzPage.batal();
    });

    it('TC-IMT-030 : Pilihan Batas Tahfidz untuk Jenis Surah hanya Surah dan Ayat', () => {
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(QA.nama).pilihJenis('surah');
      ProgramTahfidzPage.elements.batasSelect().should(($s) => expect(opsi($s)).to.deep.eq(fx.program.opsiJenisSurah));
      ProgramTahfidzPage.batal();
    });

    it('TC-IMT-031 : Nilai default instansi tidak tersedia untuk Jenis yang dipilih', () => {
      // Instansi berpengaturan Surah + Jenis Jus -> Halaman.
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(fx.instansi.denganSurah.nama).pilihJenis('juz');
      ProgramTahfidzPage.nilaiBatas().should('eq', 'halaman');
      ProgramTahfidzPage.batal();
      // Instansi berpengaturan Halaman + Jenis Surah -> Surah.
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(fx.instansi.denganHalaman.nama).pilihJenis('surah');
      ProgramTahfidzPage.nilaiBatas().should('eq', 'surah');
      ProgramTahfidzPage.batal();
    });

    it('TC-IMT-032 : Mengganti Jenis Tahfidz setelah Batas Tahfidz dipilih', () => {
      // PRD Tambah Tahfidz, Validasi b: nilai yang tidak tersedia diganti Surah (Jenis
      // Surah) DAN tampil keterangan. Source V2: flash 'info' tidak dirender oleh
      // x-alert.notification + nilai diganti default instansi -> calon bug.
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(QA.nama).pilihJenis('juz');
      ProgramTahfidzPage.elements.batasSelect().select('halaman');
      ProgramTahfidzPage.pilihJenis('surah');
      ProgramTahfidzPage.nilaiBatas().should('eq', 'surah');
      cy.contains(M, fx.program.pesanDisesuaikan).should('be.visible');
    });
  });

  // =========================================================================
  describe('Pengaturan instansi & program yang sudah ada', () => {
    it('TC-IMT-035 : Ubah pengaturan instansi tidak mengubah program yang sudah ada', () => {
      PengaturanBatasPage.ubah(QA.nama, { batas: 'juz' }, fx.pengaturan.pesanEdit);
      // P1 = Program B (Batas Halaman, belum ada riwayat) tetap Halaman.
      TahfidzDetailPage.visit(B.id);
      TahfidzDetailPage.elements.batasTahfidz().should(($b) => expect($b.text().trim()).to.eq('Halaman'));
      bukaFormRiwayat(fx, B);
      Form.elements.stepLabel('juz').should('have.text', 'Pilih Juz');
      Form.elements.labelTandai().should('contain', 'Tandai Halaman yang sudah hafal');
      Form.batal();
      // P2 = program baru (form Tambah, tidak disimpan) terisi default baru: Juz.
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(QA.nama).pilihJenis('juz');
      ProgramTahfidzPage.nilaiBatas().should('eq', 'juz');
      ProgramTahfidzPage.batal();
      pulihkanPengaturan(fx);
    });

    it('TC-IMT-036 : Edit Batas Tahfidz program yang belum punya riwayat', () => {
      ProgramTahfidzPage.visit().bukaEdit(A.id, A.nama);
      ProgramTahfidzPage.elements.batasSelect().should(($s) => expect(opsi($s)).to.deep.eq(fx.program.opsiJenisJuz));
      ProgramTahfidzPage.elements.batasSelect().select('halaman');
      ProgramTahfidzPage.simpanEdit(fx.program.pesanEdit);
      bukaFormRiwayat(fx, A);
      Form.elements.stepLabel('juz').should('have.text', 'Pilih Juz');
      Form.elements.labelTandai().should('contain', 'Tandai Halaman yang sudah hafal');
      Form.batal();
      // Kembalikan.
      ProgramTahfidzPage.ubahBatasProgram(A, A.batas, fx.program.pesanEdit);
      TahfidzDetailPage.visit(A.id);
      TahfidzDetailPage.elements.batasTahfidz().should(($b) => expect($b.text().trim()).to.eq('Juz'));
    });

    it('TC-IMT-037 : Batas Tahfidz terkunci setelah program punya riwayat', () => {
      const desk = penanda(fx)();
      buatRiwayat(fx, A, { units: ['26'], deskripsi: desk });
      ProgramTahfidzPage.visit().bukaEdit(A.id, A.nama);
      ProgramTahfidzPage.elements.batasTerkunci().should('be.disabled').and('have.value', 'Juz');
      cy.contains(`${M} .form-text`, fx.program.pesanTerkunci).should('be.visible');
      cy.get(`${M} input[wire\\:model\\.defer="name"]`).should('not.be.disabled');
      cy.get(`${M} textarea[wire\\:model\\.defer="description"], ${M} input[wire\\:model\\.defer="description"]`).should('not.be.disabled');
      ProgramTahfidzPage.batal();
      bersihkanProgram(fx, [A]);
    });
  });
});
