// Tahfidz > Capaian Multi Select — Ayat terkunci (satu ayat hanya tercatat pada
// satu riwayat, commit 228d96e9).
// TC sheet: TC-056, 057, 059, 063, 070..074 (TC-079 manual).
//
// Data: PRG-SA. before() membuat riwayat pengunci (Deskripsi QA...):
//   RL = Maryam 1-5 + Maryam 97   (kondisi "RL" di TC manual)
//   RN = An-Naba' 1-40 (seluruh surat terkunci, TC-072/074)
// after() menghapusnya lagi. Riwayat yang tertinggal MENGUNCI ayatnya untuk run
// berikutnya -> kalau run terputus, jalankan npm run cy:cleanup:tahfidz.
import Form, { RiwayatProgresFormClass as F } from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import { siapkan, bukaForm, bersihkan, buatRiwayatSurah, penanda } from '../../../../../support/tahfidz';
import { stagingData, keys, fill } from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Capaian Multi Select - Ayat Terkunci', () => {
  let fx;
  let S;
  let SA;
  let terkunciMaryam;

  before(() => {
    cy.fixture('tahfidz').then((d) => {
      fx = d;
      S = stagingData(d);
      SA = S.programSurahAyat;
      terkunciMaryam = [...keys(19, 1, 5), '19:97'];
    });
    siapkan();
    cy.then(() => {
      const uniq = penanda(fx);
      bersihkan(S, SA, fx);
      buatRiwayatSurah(S, SA, { surah: [19], ayat: terkunciMaryam, deskripsi: uniq(), pesan: fx.pesan.tambahSukses });
      buatRiwayatSurah(S, SA, {
        surah: [78],
        ayat: keys(78, 1, fx.surah['78'].ayat),
        deskripsi: uniq(),
        pesan: fx.pesan.tambahSukses,
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

  const formMaryamTaha = () => {
    bukaForm(S, SA);
    Form.pilihStep('surah', [19, 20]);
  };

  // =========================================================================
  describe('Tampilan ayat terkunci', () => {
    it('TC-070 : Ayat yang tercatat pada riwayat lain tampil tercentang dan terkunci', () => {
      bukaForm(S, SA);
      Form.pilihStep('surah', [19]);
      Form.muatSampaiTampil('19:97'); // ayat > 60 dirender lewat "Muat ayat berikutnya"
      terkunciMaryam.forEach((k) => {
        Form.elements.unitCheckbox(k).should('be.checked').and('be.disabled');
        Form.elements.unitLock(k).should('have.attr', 'title', fx.pesan.sudahTercatat);
      });
      // Ayat bebas di sebelahnya tetap bisa diubah.
      Form.elements.unitCheckbox('19:6').should('not.be.checked').and('not.be.disabled');
    });

    it('TC-071 : Status terkunci berlaku per ayat per surat', () => {
      formMaryamTaha();
      keys(20, 1, 5).forEach((k) => {
        Form.elements.unitCheckbox(k).should('not.be.checked').and('not.be.disabled');
      });
      Form.centangAyat('20:1');
      Form.assertTerpilih(['20:1']);
    });

    it('TC-072 : Surat yang seluruh ayatnya terkunci tetap tampil pada pilihan surat', () => {
      bukaForm(S, SA);
      Form.bukaStep('surah');
      Form.elements.stepOpsi('surah', 78).should('exist').and('not.be.disabled');
      Form.pilihStep('surah', [78]);
      cy.get(M).should(($m) => {
        const k = F.daftarKeys($m);
        expect(k.length).to.be.gt(0);
        k.forEach((x) => expect($m.find(`[wire\\:key="unit-${x}"] input`).is(':disabled'), `${x} terkunci`).to.eq(true));
      });
    });

    it('TC-073 : Ayat terkunci tidak tampil pada Ayat Terpilih', () => {
      bukaForm(S, SA);
      Form.pilihStep('surah', [19]);
      Form.assertJumlahTerpilih(0);
      Form.centangAyat('19:6');
      Form.assertTerpilih(['19:6']);
      Form.assertJumlahTerpilih(1);
    });

    it('TC-074 : Seluruh ayat pada pilihan sudah tercatat - keterangan tampil dan tombol section tidak aktif', () => {
      bukaForm(S, SA);
      Form.pilihStep('surah', [78]);
      Form.elements.daftar().should('contain', fx.pesan.semuaTerkunci);
      Form.elements.btnRentang().should('be.disabled');
      Form.elements.btnPilihSemua().should('be.disabled');
      Form.elements.btnHapusSemua().should('be.disabled');
    });
  });

  // =========================================================================
  describe('Ayat terkunci pada rentang, Pilih Semua, Hapus Semua', () => {
    it('TC-056 : Rentang menyeberang surat melewati ayat terkunci beserta keterangan jumlah', () => {
      formMaryamTaha();
      Form.terapkanRentang('19:95', '20:3');
      Form.elements.keteranganRentang().should(($d) => {
        expect($d.text().trim()).to.eq(fill(fx.pesan.rentangDilewati, { n: 6, m: 1 }));
      });
      Form.assertTerpilih(['19:95', '19:96', '19:98', ...keys(20, 1, 3)]);
    });

    it('TC-057 : Seluruh isi rentang sudah tercatat pada riwayat lain', () => {
      formMaryamTaha();
      Form.terapkanRentang('19:1', '19:5');
      Form.elements.keteranganRentang().should(($d) => expect($d.text().trim()).to.eq(fx.pesan.rentangSemuaTerkunci));
      Form.assertJumlahTerpilih(0);
    });

    it('TC-059 : Pilih Semua Ayat tidak mengubah ayat terkunci', () => {
      formMaryamTaha();
      Form.pilihSemua();
      const total = fx.surah['19'].ayat + fx.surah['20'].ayat - terkunciMaryam.length;
      Form.assertJumlahTerpilih(total);
      cy.get(M).should(($m) => {
        const t = F.terpilihKeys($m);
        terkunciMaryam.forEach((k) => expect(t).not.to.include(k));
      });
      Form.muatSampaiTampil('19:97');
      terkunciMaryam.forEach((k) => Form.elements.unitCheckbox(k).should('be.checked').and('be.disabled'));
    });

    it('TC-063 : Popup Hapus Semua > Hapus Semua melepas seluruh ayat terpilih, ayat terkunci tetap terkunci', () => {
      formMaryamTaha();
      Form.centangAyat(['19:6', '20:1']);
      Form.hapusSemua('ok');
      Form.assertJumlahTerpilih(0);
      Form.elements.terpilihBox().should('contain', fx.pesan.belumAdaAyat);
      Form.muatSampaiTampil('19:97');
      terkunciMaryam.forEach((k) => Form.elements.unitCheckbox(k).should('be.checked').and('be.disabled'));
      Form.elements.unitCheckbox('19:6').should('not.be.checked');
    });

    it.skip('TC-079 : Pemeriksaan ayat terkunci dijalankan ulang saat Simpan (Manual: butuh dua sesi admin bersamaan)', () => {});
  });
});
