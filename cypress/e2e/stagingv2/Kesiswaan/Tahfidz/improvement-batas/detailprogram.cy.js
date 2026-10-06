// Kesiswaan > Tahfidz — Halaman Detail Program (tiket Improvement Tahfidz, V2).
// TC sheet: TC-IMT-040..056 (+065 Blocked: siswa kedua & notifikasi Tambah Anggota).
//
// Expected posisi terakhir & pencapaian DIHITUNG dari data uji + metode penomoran
// instansi QA (fixture batas.instansi.qa.awal.metode). Program B: Juz 2 + 3 = 41 halaman
// (halaman 62 milik Juz 3 & 4) — koreksi dari testcase manual (40).
// Catatan V2: "posisi terakhir" = satuan TERJAUH (urutan mushaf) dari kumulatif riwayat.
import ProgramTahfidzPage from '../../../../../support/pageobjects/tahfidz/ProgramTahfidzPage';
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import TahfidzDetailPage from '../../../../../support/pageobjects/tahfidz/TahfidzDetailPage';
import PengaturanBatasPage from '../../../../../support/pageobjects/pengaturan/PengaturanBatasPage';
import { siapkan } from '../../../../../support/tahfidz';
import {
  batasData, buatRiwayat, bersihkanProgram, pulihkanPengaturan, penanda, labelHalaman,
} from '../../../../../support/batas';
import { formatPencapaian, range } from '../../../../../support/helpers';

describe('Tahfidz - Detail Program (Batas Tahfidz)', () => {
  let fx;
  let P;
  let S;
  let S2;
  let metode;
  let uniq;

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
      P = d.programs;
      S = d.siswa;
      S2 = d.siswa2;
      metode = d.instansi.qa.awal.metode;
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

  const FOTO = 'cypress/fixtures/foto-siswa-qa.jpg';
  const lihat = (program) => TahfidzDetailPage.visitAnggota(program.id, S.nama);

  // =========================================================================
  describe('Akses halaman detail program', () => {
    it('TC-IMT-040 : Buka detail program dengan klik Nama Program', () => {
      ProgramTahfidzPage.visit().bukaDetailLewatNama(P.A.id, P.A.nama);
      TahfidzDetailPage.elements.namaProgram().should('have.text', P.A.nama);
    });

    it('TC-IMT-041 : Buka detail program lewat Aksi > Detail', () => {
      ProgramTahfidzPage.visit().bukaDetailLewatAksi(P.A.id, P.A.nama);
      TahfidzDetailPage.elements.namaProgram().should('have.text', P.A.nama);
    });

    it('TC-IMT-042 : Nama program tampil sebagai tautan dengan efek hover', () => {
      ProgramTahfidzPage.visit().cariProgram(P.A.nama);
      ProgramTahfidzPage.elements.namaLink(P.A.id)
        .should('have.attr', 'href').and('match', new RegExp(`/student-affairs/tahfidz/detail/${P.A.id}$`));
      ProgramTahfidzPage.elements.namaLink(P.A.id).should('have.class', 'text-hover-primary');
    });

    it('TC-IMT-043 : Klik tombol Aksi tidak membuka detail', () => {
      ProgramTahfidzPage.visit().cariProgram(P.A.nama);
      ProgramTahfidzPage.elements.checkboxBaris().should('have.length', 0); // V2: list tanpa checkbox
      ProgramTahfidzPage.elements.aksiBtn(P.A.id).click();
      ProgramTahfidzPage.elements.aksiMenu(P.A.id).should('be.visible');
      cy.location('pathname').should('eq', '/student-affairs/tahfidz');
    });

    it('TC-IMT-045 : Informasi program menampilkan Batas Tahfidz', () => {
      TahfidzDetailPage.visit(P.C.id);
      cy.contains('.card.shadow-sm.mb-5 p', 'Batas Tahfidz:').find('.badge').should(($b) => expect($b.text().trim()).to.eq('Ayat'));
    });
  });

  // =========================================================================
  describe('Foto anggota', () => {
    // Foto dummy (cypress/fixtures/foto-siswa-qa.jpg) diunggah ke siswa QA untuk TC-046/048
    // lalu DIKEMBALIKAN ke avatar otomatis (keputusan D4). Urutan: 047 (avatar) -> 046 -> 048.
    after(() => {
      siapkan();
      cy.then(() => {
        DetailSiswaPage.kembalikanFoto(S.id);
      });
    });

    it('TC-IMT-047 : Anggota tanpa foto menampilkan inisial', () => {
      // V2: siswa tanpa foto menyimpan URL avatar otomatis (Helpers::getAvatar ->
      // ui-avatars.com, gambar berisi inisial), bukan null. Run 6 Okt 2026: baris Aisyah
      // merender <img> ui-avatars "AS" dan span inisial display:none. Keduanya = inisial.
      const inisial = S.nama.split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
      lihat(P.A);
      cy.get(`tr[wire\\:key="table-row-${S.id}"] a.symbol`).should('have.class', 'symbol-circle').and(($a) => {
        const $span = $a.find('.symbol-label');
        const $img = $a.find('img');
        if ($span.is(':visible')) {
          expect($span.text().trim(), 'inisial (span)').to.eq(inisial);
        } else {
          expect($img.is(':visible'), 'avatar tampil').to.eq(true);
          const src = new URL($img.attr('src'));
          expect(src.hostname, 'avatar otomatis (bukan foto)').to.eq('ui-avatars.com');
          expect(src.searchParams.get('name'), 'avatar dibuat dari nama').to.eq(S.nama.toUpperCase());
        }
      });
    });

    it('TC-IMT-046 : Foto anggota pada kolom Nama', () => {
      const baris = `tr[wire\\:key="table-row-${S.id}"]`;
      lihat(P.A);
      cy.get(baris).invoke('outerHeight').then((tinggiAwal) => {
        DetailSiswaPage.unggahFoto(S.id, FOTO);
        lihat(P.A);
        cy.get(`${baris} a.symbol`).should('have.class', 'symbol-circle').and('have.class', 'symbol-35px');
        cy.get(`${baris} a.symbol img`).should('be.visible').and(($img) => {
          expect(new URL($img.attr('src')).hostname, 'foto unggahan (bukan avatar otomatis)').not.to.eq('ui-avatars.com');
          expect($img[0].naturalWidth, 'foto termuat').to.be.gt(0);
        });
        cy.get(baris).invoke('outerHeight').should((t) => expect(t, 'tinggi baris tidak bertambah').to.be.closeTo(tinggiAwal, 1));
      });
    });

    it('TC-IMT-048 : Foto gagal dimuat menampilkan inisial', () => {
      const baris = `tr[wire\\:key="table-row-${S.id}"]`;
      const inisial = S.nama.split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
      lihat(P.A);
      cy.get(`${baris} a.symbol img`).invoke('attr', 'src').then((src) => {
        const path = new URL(src, Cypress.config('baseUrl')).pathname;
        // Matikan cache browser supaya gambar benar-benar diminta lagi, lalu gagalkan (404).
        cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Network.setCacheDisabled', params: { cacheDisabled: true } }));
        cy.intercept({ method: 'GET', url: new RegExp(Cypress._.escapeRegExp(path)) }, { statusCode: 404, body: '' }).as('fotoGagal');
        lihat(P.A);
        cy.wait('@fotoGagal');
      });
      cy.get(`${baris} a.symbol img`).should('not.be.visible');
      cy.get(`${baris} a.symbol .symbol-label`).should('be.visible').and(($s) => expect($s.text().trim()).to.eq(inisial));
      cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Network.setCacheDisabled', params: { cacheDisabled: false } }));
    });
  });

  // =========================================================================
  describe('Kolom Batas Tahfidz dan Pencapaian', () => {
    it('TC-IMT-054 : Anggota tanpa riwayat menampilkan "-" dan 0% beserta pecahannya', () => {
      lihat(P.F);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', '-');
      TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(0, P.F.total, P.F.satuan));
    });

    it('TC-IMT-049 : Jenis Jus Batas Juz', () => {
      buatRiwayat(fx, P.A, { units: ['26', '27', '28'], deskripsi: uniq() });
      lihat(P.A);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', 'Juz 28');
      TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(3, P.A.total, P.A.satuan));
    });

    it('TC-IMT-050 : Jenis Jus Batas Halaman', () => {
      const hal = [...range(22, 27), ...range(42, 45)]; // 10 halaman, terakhir mushaf 45 (Juz 3)
      buatRiwayat(fx, P.B, { pilih: { juz: [2, 3] }, units: hal.map(String), deskripsi: uniq() });
      lihat(P.B);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', `Juz 3, Halaman ${labelHalaman(fx, 45, 3, metode)}`);
      TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(10, P.B.total, P.B.satuan));
    });

    it('TC-IMT-055 : Kolom Batas Tahfidz ikut berubah setelah riwayat baru', () => {
      buatRiwayat(fx, P.B, { pilih: { juz: [3] }, units: ['50'], deskripsi: uniq() });
      lihat(P.B);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', `Juz 3, Halaman ${labelHalaman(fx, 50, 3, metode)}`);
      TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(11, P.B.total, P.B.satuan));
    });

    it('TC-IMT-051 : Jenis Jus Batas Ayat', () => {
      const ayat = range(1, 6).map((a) => `114:${a}`);
      buatRiwayat(fx, P.C, { pilih: { juz: [30], halaman: [604], surah: [114] }, units: ayat, deskripsi: uniq() });
      lihat(P.C);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', `Juz 30, Halaman ${labelHalaman(fx, 604, 30, metode)}, Surah ${fx.surah['114']}, Ayat 6`);
      TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(6, P.C.total, P.C.satuan));
    });

    it('TC-IMT-052 : Jenis Surah Batas Surah', () => {
      // Data disesuaikan: target 78-82 tidak punya surah sebelum An-Naba', jadi 2 surah
      // = An-Naba' + An-Nazi'at -> posisi terakhir (satuan terjauh) An-Nazi'at.
      buatRiwayat(fx, P.D, { units: ['78', '79'], deskripsi: uniq() });
      lihat(P.D);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', `Surah ${fx.surah['79']}`);
      TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(2, P.D.total, P.D.satuan));
    });

    it('TC-IMT-053 : Jenis Surah Batas Ayat', () => {
      const ayat = range(14, 20).map((a) => `78:${a}`); // 7 ayat, terakhir An-Naba' 20
      buatRiwayat(fx, P.E, { pilih: { surah: [78] }, units: ayat, deskripsi: uniq() });
      lihat(P.E);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', `Surah ${fx.surah['78']}, Ayat 20`);
      TahfidzDetailPage.pencapaianAnggota(S.id).should('eq', formatPencapaian(7, P.E.total, P.E.satuan));
    });

    it('TC-IMT-056 : Penomoran halaman kolom Batas Tahfidz mengikuti metode instansi', () => {
      buatRiwayat(fx, P.F, { units: ['582'], deskripsi: uniq() });
      lihat(P.F);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', `Juz 30, Halaman ${labelHalaman(fx, 582, 30, metode)}`);
      const lain = metode === 'mushaf' ? 'per_juz' : 'mushaf';
      PengaturanBatasPage.ubah(fx.instansi.qa.nama, { metode: lain }, fx.pengaturan.pesanEdit);
      lihat(P.F);
      TahfidzDetailPage.batasAnggota(S.id).should('eq', `Juz 30, Halaman ${labelHalaman(fx, 582, 30, lain)}`);
      pulihkanPengaturan(fx);
    });
  });

  describe('Anggota baru (siswa kedua, keputusan D3)', () => {
    let nama2;

    // Keanggotaan siswa kedua SELALU dihapus lagi (hapus anggota tidak mengirim notifikasi).
    after(() => {
      siapkan();
      cy.then(() => {
        if (!nama2) return;
        TahfidzDetailPage.visit(P.B.id);
        TahfidzDetailPage.elements.cari().clear().type(nama2);
        cy.get('table.rappasoft-datatable tbody').then(($b) => {
          if ($b.find(`tr[wire\\:key="table-row-${S2.id}"]`).length) TahfidzDetailPage.hapusAnggota(S2.id);
        });
      });
    });

    it('TC-IMT-065 : Anggota baru mengikuti Batas Tahfidz program', () => {
      cy.visitRelative(`/member/student/detail/${S2.id}`);
      cy.get('p.text-gray-900.fs-1.fw-bolder').invoke('text').then((t) => {
        nama2 = t.trim();
        expect(nama2, 'nama siswa kedua').not.to.eq('');
      });
      // Pre-condition: Program B sudah punya riwayat.
      // Halaman 41 (akhir Juz 2) tidak dipakai TC lain di spec ini (050/055 = 22-27, 42-45, 50).
      buatRiwayat(fx, P.B, { pilih: { juz: [2] }, units: ['41'], deskripsi: uniq() });
      cy.then(() => {
        TahfidzDetailPage.visit(P.B.id);
        TahfidzDetailPage.elements.cari().clear().type(nama2);
        cy.get('table.rappasoft-datatable tbody').should(($b) => {
          expect($b.find(`tr[wire\\:key="table-row-${S2.id}"]`).length, `${nama2} belum anggota Program B`).to.eq(0);
        });
        TahfidzDetailPage.visit(P.B.id).tambahAnggota(nama2);
        TahfidzDetailPage.cariAnggota(nama2);
        TahfidzDetailPage.batasAnggota(S2.id).should('eq', '-');
        TahfidzDetailPage.pencapaianAnggota(S2.id).should('eq', formatPencapaian(0, P.B.total, P.B.satuan));
        TahfidzDetailPage.elements.batasTahfidz().should(($b) => expect($b.text().trim()).to.eq('Halaman'));
      });
    });
  });
});
