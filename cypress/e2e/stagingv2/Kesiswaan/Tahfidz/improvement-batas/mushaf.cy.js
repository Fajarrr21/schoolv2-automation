// Kesiswaan > Tahfidz — Perilaku umum: master data Mushaf Madinah & metode penomoran
// (tiket Improvement, V2). TC sheet: TC-IMT-101, 102, 105 (103, 104 = Manual).
//
// - TC-101 memakai Program U #247 (target Juz 1-30, Batas Ayat) — hanya membuka form,
//   tidak menyimpan. Value opsi halaman = nomor mushaf absolut (tidak tergantung metode).
// - TC-102: data disesuaikan — program QA Jenis Surah Batas Ayat (E) bertarget
//   Al-Mulk + An-Naba' (tidak ada Al-Baqarah) -> dicek An-Naba' 40 ayat & Al-Mulk 30 ayat.
// - TC-105 mengubah metode instansi QA lalu MENGEMBALIKANNYA (after + akhir test).
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import Form, { RiwayatProgresFormClass } from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import PengaturanBatasPage from '../../../../../support/pageobjects/pengaturan/PengaturanBatasPage';
import { siapkan } from '../../../../../support/tahfidz';
import {
  batasData, buatRiwayat, bersihkanProgram, pulihkanPengaturan, penanda, bukaSiswa, bukaFormRiwayat, capaianHalaman,
} from '../../../../../support/batas';
import { range } from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Mushaf Madinah & Metode Penomoran', () => {
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
    cy.then(() => bersihkanProgram(fx, [P.F]));
  });

  beforeEach(() => {
    siapkan();
  });

  after(() => {
    siapkan();
    cy.then(() => {
      bersihkanProgram(fx, [P.F]);
      pulihkanPengaturan(fx);
    });
  });

  it('TC-IMT-101 : Master data halaman mengacu Mushaf Madinah', () => {
    const [a1, b1] = fx.mushaf.juz['1'];
    const [a30, b30] = fx.mushaf.juz['30'];
    bukaFormRiwayat(fx, P.U);
    Form.pilihStep('juz', [1]);
    Form.nilaiOpsiStep('halaman').should('deep.eq', range(a1, b1));
    Form.klikStep('juz', 1); // lepas (belum ada ayat ditandai -> tanpa popup)
    Form.pilihStep('juz', [30]);
    Form.nilaiOpsiStep('halaman').should((v) => {
      expect(v).to.deep.eq(range(a30, b30));
      expect(v[v.length - 1], 'halaman terakhir mushaf').to.eq(fx.mushaf.totalHalaman);
    });
    Form.batal();
  });

  it('TC-IMT-102 : Master data surah dan ayat mengacu Mushaf Madinah', () => {
    // Jumlah ayat per surat = header kelompok Daftar Ayat ("40 ayat").
    bukaFormRiwayat(fx, P.E);
    Form.pilihStep('surah', [67, 78]);
    cy.get(M).should(($m) => {
      expect(RiwayatProgresFormClass.daftarHeaders($m)).to.deep.eq([
        { nama: fx.surah['67'], jumlah: '30 ayat' },
        { nama: fx.surah['78'], jumlah: '40 ayat' },
      ]);
    });
    Form.batal();

    // Juz 30 memuat 37 surah (An-Naba' s.d. An-Nas): pilih seluruh halaman Juz 30.
    const [a30, b30] = fx.mushaf.juz['30'];
    bukaFormRiwayat(fx, P.C);
    Form.pilihStep('juz', [30]);
    Form.pilihStep('halaman', range(a30, b30));
    Form.nilaiOpsiStep('surah').should('deep.eq', range(78, 114));
    Form.nilaiOpsiStep('surah').its('length').should('eq', fx.mushaf.juz30JumlahSurah);
    Form.batal();
  });

  it('TC-IMT-105 : Ubah metode halaman tidak mengubah riwayat yang sudah tersimpan', () => {
    // PRD Perilaku Umum: riwayat lama tetap menampilkan nomor halaman saat dibuat.
    // Source V2: achievement_display memformat ulang dengan metode SAAT INI -> calon bug.
    const awal = fx.instansi.qa.awal.metode;
    const lain = awal === 'mushaf' ? 'per_juz' : 'mushaf';
    const lama = buatRiwayat(fx, P.F, { units: ['582'], deskripsi: uniq() });
    const teksLama = capaianHalaman(fx, [582], awal, P.F.target);
    DetailSiswaPage.assertCell(lama, 'capaian', teksLama);

    PengaturanBatasPage.ubah(fx.instansi.qa.nama, { metode: lain }, fx.pengaturan.pesanEdit);
    const baru = buatRiwayat(fx, P.F, { units: ['583'], deskripsi: uniq() });
    DetailSiswaPage.tampilkanSemua();
    // Riwayat baru memakai penomoran yang baru.
    DetailSiswaPage.assertCell(baru, 'capaian', capaianHalaman(fx, [583], lain, P.F.target));
    // Riwayat lama tetap seperti saat dibuat.
    DetailSiswaPage.assertCell(lama, 'capaian', teksLama);

    pulihkanPengaturan(fx);
    bukaSiswa(fx, P.F);
  });
});
