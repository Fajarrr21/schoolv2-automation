// Tahfidz > Capaian Multi Select — Penulisan capaian (kolom Capaian Hafalan di
// Detail Siswa) + Persentase.
// TC sheet: TC-081..088, 093. Data: PRG-SA (+ PRG-J/H/S & RS opsional).
//
// EXPECTED disusun dari data uji lewat formatCapaian() dengan pola
// fx.format.capaianPerSurat (default PRD "QS. {surat} ayat {ayat}", Q2). Selama
// V2 menulis "{surat} Ayat {ayat}", TC-081..086 merah sampai Q2 diputuskan.
//
// Satu ayat hanya boleh tercatat pada satu riwayat, jadi nomor ayat tiap TC
// digeser supaya tidak saling mengunci (pola rentang/koma tetap sama dengan TC
// manual, misal TC-082 memakai Taha 11-13, 17, 20 sebagai ganti 1-3, 7, 10).
import Form from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import TahfidzDetailPage from '../../../../../support/pageobjects/tahfidz/TahfidzDetailPage';
import { siapkan, bukaForm, bukaDetailSiswa, bersihkan, buatRiwayatSurah, penanda } from '../../../../../support/tahfidz';
import {
  stagingData, perluData, keys, keysToSurat, formatCapaian, formatPencapaian, compactNumbers, hariIni,
} from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Capaian Multi Select - Penulisan Capaian', () => {
  let fx;
  let S;
  let SA;
  let uniq;

  before(() => {
    cy.fixture('tahfidz').then((d) => {
      fx = d;
      S = stagingData(d);
      SA = S.programSurahAyat;
      uniq = penanda(d);
    });
    siapkan();
    cy.then(() => bersihkan(S, SA, fx));
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => {
      [SA, S.programBatasJuz, S.programBatasHalaman, S.programBatasSurah].forEach((p) => bersihkan(S, p, fx));
    });
  });

  /** Expected kolom Capaian Hafalan (list: maks 2 surat). */
  const capaianList = (ayat) =>
    formatCapaian(keysToSurat(ayat, fx.surah), { template: fx.format.capaianPerSurat, max: fx.format.maksSuratList });

  /** Buat riwayat PRG-SA lalu assert kolom Capaian Hafalan (setelah reload). */
  const ujiPenulisan = ({ surah, ayat }) => {
    const desk = uniq();
    buatRiwayatSurah(S, SA, { surah, ayat, deskripsi: desk, pesan: fx.pesan.tambahSukses });
    cy.reload();
    DetailSiswaPage.assertCell(desk, 'capaian', capaianList(ayat));
    return desk;
  };

  // =========================================================================
  describe('Persentase', () => {
    it('TC-093 : Persentase dihitung dari jumlah satuan ditandai dibagi total target', () => {
      const total = SA.target.reduce((n, s) => n + fx.surah[s].ayat, 0);
      const desk = uniq();
      buatRiwayatSurah(S, SA, {
        surah: [19, 20],
        ayat: [...keys(19, 1, 10), ...keys(20, 1, 10)],
        deskripsi: desk,
        pesan: fx.pesan.tambahSukses,
      });
      const expected = formatPencapaian(20, total, 'ayat', fx.format.pencapaian);
      cy.reload();
      DetailSiswaPage.assertCell(desk, 'pencapaian', expected);
      TahfidzDetailPage.visitAnggota(SA.id, S.siswa.nama);
      TahfidzDetailPage.pencapaianAnggota(S.siswa.id).should('eq', expected);

      // Riwayat ini dihapus lagi supaya ayatnya tidak mengunci TC berikutnya.
      bukaDetailSiswa(S, SA);
      DetailSiswaPage.hapus(desk, fx.pesan.hapusSukses);
    });
  });

  // =========================================================================
  describe('Batas Ayat', () => {
    it('TC-081 : Ayat berurutan ditulis sebagai rentang', () => {
      ujiPenulisan({ surah: [20], ayat: keys(20, 1, 10) });
    });

    it('TC-082 : Ayat loncat dipisah koma', () => {
      ujiPenulisan({ surah: [20], ayat: ['20:11', '20:12', '20:13', '20:17', '20:20'] });
    });

    it('TC-083 : Rentang hanya dipakai bila seluruh ayat pada rentang tercatat', () => {
      const desk = ujiPenulisan({ surah: [20], ayat: [...keys(20, 21, 25), ...keys(20, 27, 30)] });
      DetailSiswaPage.cell(desk, 'capaian').should('not.contain', '21-30');
    });

    it('TC-084 : Dua surat ditulis per surat dipisah koma', () => {
      ujiPenulisan({ surah: [19, 20], ayat: [...keys(19, 1, 3), ...keys(20, 130, 135)] });
    });

    it('TC-085 : Lebih dari dua surat menampilkan dua surat pertama lalu jumlah sisanya', () => {
      const desk = ujiPenulisan({
        surah: [78, 79, 80, 81],
        ayat: [...keys(78, 1, 2), ...keys(79, 1, 2), ...keys(80, 1, 2), ...keys(81, 1, 2)],
      });
      DetailSiswaPage.cell(desk, 'capaian').should('match', /\+2 surat$/);
    });

    it('TC-086 : Urutan surat pada penulisan mengikuti urutan mushaf', () => {
      // Taha dipilih & dicentang lebih dulu, baru Maryam.
      const desk = uniq();
      bukaForm(S, SA);
      Form.pilihStep('surah', [20]);
      Form.pilihStep('surah', [19]);
      Form.centangAyat(['20:40', '19:40']);
      Form.isiField({ tanggal: hariIni(), deskripsi: desk });
      Form.simpanSukses(fx.pesan.tambahSukses);
      cy.reload();
      DetailSiswaPage.assertCell(desk, 'capaian', capaianList(['20:40', '19:40']));
      DetailSiswaPage.cell(desk, 'capaian').then((t) => {
        expect(t.indexOf(fx.surah['19'].nama), 'Maryam sebelum Taha').to.be.lt(t.indexOf(fx.surah['20'].nama));
      });
    });

    it('TC-087 : Riwayat lama yang hanya memuat satu surat tetap tampil seperti sebelumnya', function () {
      const RS = S.siswaRiwayatLama || {};
      perluData(this, RS.tahfidzId && RS.memberId && RS.deskripsi, 'RS (staging.siswaRiwayatLama) belum diisi');
      DetailSiswaPage.visit(RS.tahfidzId, RS.memberId);
      DetailSiswaPage.cell(RS.deskripsi, 'capaian').should('not.be.empty').and('not.eq', '-');
      DetailSiswaPage.cell(RS.deskripsi, 'pencapaian').should('match', /^\d+(\.\d+)?% \(\d+ dari \d+ \w+\)$/);
      DetailSiswaPage.bukaEdit(RS.deskripsi);
      Form.elements.modal().should('be.visible');
      Form.batal();
    });
  });

  // =========================================================================
  describe('Batas Juz, Halaman, Surah', () => {
    /** Centang satuan pola loncat (ke-1, ke-2, ke-4; atau ke-1 & ke-3 bila < 4) lalu simpan. */
    const simpanLoncat = (prog, dropdown) => {
      const desk = uniq();
      bukaForm(S, prog);
      dropdown.forEach((s) => Form.nilaiOpsiStep(s).then((v) => {
        Form.pilihStep(s, v.slice(0, 1));
      }));
      return cy.get(M).then(($m) => {
        const bebas = Cypress.$.makeArray($m.find('[wire\\:key^="unit-"]'))
          .filter((el) => !Cypress.$(el).find('input').is(':disabled'))
          .map((el) => el.getAttribute('wire:key').slice('unit-'.length));
        expect(bebas.length, 'minimal 3 satuan bebas').to.be.gte(3);
        const pilih = bebas.length >= 4 ? [bebas[0], bebas[1], bebas[3]] : [bebas[0], bebas[2]];
        Form.centangAyat(pilih);
        Form.isiField({ tanggal: hariIni(), deskripsi: desk });
        Form.simpanSukses(fx.pesan.tambahSukses);
        return cy.wrap({ desk, pilih });
      });
    };

    it('TC-088 : Penulisan pada Batas Juz, Halaman, dan Surah mengikuti pola yang sama', function () {
      const J = S.programBatasJuz || {};
      const H = S.programBatasHalaman || {};
      const SS = S.programBatasSurah || {};
      perluData(this, J.id || H.id || SS.id, 'PRG-J/H/S belum diisi (Q8 juga belum dijawab)');
      if (J.id) {
        simpanLoncat(J, []).then(({ desk, pilih }) => {
          DetailSiswaPage.assertCell(desk, 'capaian', `Juz ${compactNumbers(pilih)}`);
        });
      }
      if (H.id) {
        simpanLoncat(H, ['juz']).then(({ desk }) => {
          DetailSiswaPage.cell(desk, 'capaian').should('match', /Halaman \d+(-\d+)?(, \d+(-\d+)?)+/);
        });
      }
      if (SS.id) {
        // Q8: bentuk rentang untuk Batas Surah belum diputuskan -> cukup assert
        // satuan tertulis per surat & satuan Pencapaian tetap "surah".
        simpanLoncat(SS, []).then(({ desk }) => {
          DetailSiswaPage.cell(desk, 'pencapaian').should('match', /surah\)$/);
        });
      }
    });
  });
});
