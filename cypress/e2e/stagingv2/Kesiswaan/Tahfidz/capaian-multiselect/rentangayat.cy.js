// Tahfidz > Capaian Multi Select — Pilih Rentang Ayat.
// TC sheet: TC-044..055. Data: PRG-SA (Jenis Surah Batas Ayat), Maryam + Taha.
// Rentang lintas surat diuji di PRG-SA karena di Jenis Juz surat kedua tidak
// bisa dipilih (BUG-001). Spec ini TIDAK menyimpan riwayat.
import Form, { RiwayatProgresFormClass as F } from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import { siapkan, bukaForm, bersihkan } from '../../../../../support/tahfidz';
import { stagingData, keys } from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Capaian Multi Select - Pilih Rentang Ayat', () => {
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

  const formMaryamTaha = () => {
    bukaForm(S, SA);
    Form.pilihStep('surah', [19, 20]);
  };

  /** Opsi <select> (tanpa placeholder) -> [{value, label}]. */
  const opsi = ($sel) =>
    Cypress.$.makeArray($sel.find('option'))
      .filter((o) => o.value !== '')
      .map((o) => ({ value: o.value, label: o.textContent.trim() }));

  // =========================================================================
  describe('Panel rentang', () => {
    it('TC-044 : Pilih Rentang Ayat menampilkan panel berisi Dari Ayat, Sampai Ayat, dan Terapkan', () => {
      formMaryamTaha();
      Form.bukaRentang();
      Form.elements.dari().should('be.visible');
      Form.elements.sampai().should('be.visible');
      Form.elements.terapkan().should('be.visible').and('contain', fx.label.terapkan);
      cy.contains(`${M} label`, fx.label.dariAyat).should('be.visible');
      cy.contains(`${M} label`, fx.label.sampaiAyat).should('be.visible');
    });

    it('TC-045 : Pilihan Dari Ayat menyebut nama surat dan berisi seluruh ayat surat terpilih', () => {
      formMaryamTaha();
      Form.bukaRentang();
      Form.elements.dari().should(($s) => {
        const o = opsi($s);
        expect(o).to.have.length(fx.surah['19'].ayat + fx.surah['20'].ayat);
        o.forEach((x) => expect(x.label).to.match(/^(Maryam|Taha) - Ayat \d+$/));
        expect(o[0].label).to.eq('Maryam - Ayat 1');
        expect(o.map((x) => x.label)).to.include('Taha - Ayat 5');
      });
    });

    it('TC-046 : Sampai Ayat belum dapat dipilih sebelum Dari Ayat diisi dan Terapkan tidak aktif', () => {
      formMaryamTaha();
      Form.bukaRentang();
      Form.elements.sampai().should('be.disabled');
      Form.elements.terapkan().should('be.disabled');
    });

    it('TC-047 : Pilihan Sampai Ayat dimulai satu ayat setelah Dari Ayat mengikuti urutan mushaf', () => {
      formMaryamTaha();
      Form.bukaRentang().pilihDari('20:5');
      Form.elements.sampai().should(($s) => {
        const v = opsi($s).map((x) => x.value);
        expect(v[0]).to.eq('20:6');
        expect(v).not.to.include('20:5');
        expect(v.some((x) => x.startsWith('19:'))).to.eq(false);
      });
    });
  });

  // =========================================================================
  describe('Terapkan rentang', () => {
    it('TC-048 : Terapkan rentang dalam satu surat', () => {
      formMaryamTaha();
      Form.terapkanRentang('20:1', '20:10');
      Form.assertTerpilih(keys(20, 1, 10));
      Form.assertJumlahTerpilih(10);
      cy.get(M).should(($m) => expect(F.daftarCheckedKeys($m)).to.deep.eq(keys(20, 1, 10)));
    });

    it('TC-049 : Rentang menyeberang surat mengikuti urutan mushaf', () => {
      formMaryamTaha();
      Form.terapkanRentang('19:95', '20:3');
      Form.assertTerpilih([...keys(19, 95, 98), ...keys(20, 1, 3)]);
      Form.assertJumlahTerpilih(7);
    });

    it('TC-050 : Mengubah Dari Ayat sehingga rentang tidak sah mengosongkan Sampai Ayat', () => {
      formMaryamTaha();
      Form.bukaRentang().pilihDari('20:5').pilihSampai('20:8');
      Form.pilihDari('20:10');
      Form.elements.sampai().should('have.value', '');
      Form.elements.terapkan().should('be.disabled');
    });

    it('TC-051 : Nilai rentang tetap tampil setelah Terapkan dan setelah panel dibuka lagi', () => {
      formMaryamTaha();
      Form.terapkanRentang('20:1', '20:10');
      Form.elements.dari().should('have.value', '20:1');
      Form.elements.sampai().should('have.value', '20:10');
      Form.tutupRentang();
      Form.bukaRentang();
      Form.elements.dari().should('have.value', '20:1');
      Form.elements.sampai().should('have.value', '20:10');
    });

    it('TC-052 : Terapkan tidak aktif bila rentang sama persis dengan yang barusan diterapkan', () => {
      formMaryamTaha();
      Form.terapkanRentang('20:1', '20:10');
      Form.elements.terapkan().should('be.disabled');
      Form.pilihSampai('20:15');
      Form.elements.terapkan().should('not.be.disabled');
    });

    it('TC-053 : Rentang kedua menambah pilihan, tidak menimpa', () => {
      formMaryamTaha();
      Form.terapkanRentang('20:1', '20:10');
      Form.terapkanRentang('20:20', '20:25');
      Form.assertTerpilih([...keys(20, 1, 10), ...keys(20, 20, 25)]);
      Form.assertJumlahTerpilih(16);
    });
  });

  // =========================================================================
  describe('Reset isian rentang', () => {
    it('TC-054 : Isian rentang kosong kembali setelah pilihan Surat diubah', () => {
      formMaryamTaha();
      Form.terapkanRentang('20:1', '20:10');
      Form.pilihStep('surah', [78]);
      Form.bukaRentang();
      Form.elements.dari().should('have.value', '');
      Form.elements.sampai().should('have.value', '');
    });

    it('TC-055 : Isian rentang kosong kembali setelah form ditutup lalu dibuka', () => {
      formMaryamTaha();
      Form.terapkanRentang('20:1', '20:10');
      Form.batal();
      DetailSiswaPage.bukaTambah();
      Form.pilihStep('surah', [19, 20]);
      Form.bukaRentang();
      Form.elements.dari().should('have.value', '');
      Form.elements.sampai().should('have.value', '');
      Form.assertJumlahTerpilih(0);
    });
  });
});
