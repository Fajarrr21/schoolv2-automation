// Tahfidz > Capaian Multi Select — Tambah Riwayat (akses form, navigasi langkah,
// multi select Juz/Halaman/Surah, simpan).
// TC sheet: docs/test-cases/TC_Tahfidz_CapaianMultiSelect.xlsx (TC-001..022, 076..078).
//
// Data: PRG-A (programUtama, Jenis Juz Batas Ayat) & PRG-SA (programSurahAyat,
// Jenis Surah Batas Ayat). Riwayat yang dibuat bertanda Deskripsi QA<ts><seq> dan
// dihapus di after() + cypress/e2e/stagingv2/cleanup/cleanupTahfidz.cy.js.
import Form, { RiwayatProgresFormClass as F } from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import TahfidzDetailPage from '../../../../../support/pageobjects/tahfidz/TahfidzDetailPage';
import DetailSiswaPage from '../../../../../support/pageobjects/member/DetailSiswaPage';
import { siapkan, bukaForm, bersihkan, buatRiwayatSurah, penanda } from '../../../../../support/tahfidz';
import { stagingData, perluData, route, keys, hariIni } from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Capaian Multi Select - Tambah Riwayat', () => {
  let fx;
  let S;
  let A;
  let SA;
  let uniq;

  before(() => {
    cy.fixture('tahfidz').then((d) => {
      fx = d;
      S = stagingData(d, ['programUtama']);
      A = S.programUtama;
      SA = S.programSurahAyat;
      uniq = penanda(d);
    });
    siapkan();
    cy.then(() => {
      bersihkan(S, A, fx);
      bersihkan(S, SA, fx);
    });
  });

  beforeEach(() => {
    siapkan();
  });

  /** Test PRG-SA: di-skip (BLOCKED) selama staging.programSurahAyat.id kosong. */
  const butuhSA = (ctx) => perluData(ctx, SA && SA.id, 'BLOCKED: PRG-SA (staging.programSurahAyat.id) belum diisi');

  after(() => {
    siapkan();
    cy.then(() => {
      [A, SA, S.programBatasJuz, S.programBatasHalaman, S.programBatasSurah, S.programTargetTerbatas].forEach((p) => bersihkan(S, p, fx));
    });
  });

  // =========================================================================
  describe('Akses form', () => {
    it('TC-001 : Form Tambah Riwayat dapat dibuka dari Detail program lewat Aksi > Detail', () => {
      // Keputusan user Q1 (6 Okt 2026): menu "Tambah Riwayat" di Aksi list anggota
      // TIDAK wajib. Jalur yang diuji: Detail program > Aksi > Detail > Tambah Riwayat.
      TahfidzDetailPage.visitAnggota(A.id, S.siswa.nama).klikAksiAnggota(S.siswa.id, 'Detail');
      cy.location('pathname').should('eq', route(fx.routes.detailSiswa, { tahfidzId: A.id, memberId: S.siswa.id }));
      DetailSiswaPage.bukaTambah();
      Form.assertTerbuka('Tambah');
      Form.elements.labelCapaian().should('be.visible');
      Form.elements.stepLabel('juz').should('have.text', fx.label.pilihJuz);
    });

    it('TC-002 : Form Tambah Riwayat dari Detail Siswa menampilkan Capaian Hafalan multi select', () => {
      TahfidzDetailPage.visitAnggota(A.id, S.siswa.nama).klikNamaAnggota(S.siswa.id);
      cy.location('pathname').should('eq', route(fx.routes.detailSiswa, { tahfidzId: A.id, memberId: S.siswa.id }));
      DetailSiswaPage.bukaTambah();
      Form.elements.labelCapaian().should('be.visible');
      Form.elements.labelTanggal().should('be.visible');
      Form.elements.labelDeskripsi().should('be.visible');
      Form.elements.stepLabel('juz').should('have.text', fx.label.pilihJuz);
      Form.elements.btnSimpan().should('contain', fx.label.simpan);
      Form.pilihStep('juz', [16, 30]);
      Form.nilaiChip('juz').should('deep.eq', [16, 30]);
    });
  });

  // =========================================================================
  describe('Navigasi langkah', () => {
    it('TC-004 : Batas Ayat (Jenis Juz) - urutan langkah Juz, Halaman, Surat, Ayat', () => {
      bukaForm(S, A);
      Form.elements.step('juz').should('exist');
      cy.get(M).find('[wire\\:key^="step-halaman"], [wire\\:key^="step-surah"]').should('not.exist');
      Form.elements.daftar().should('contain', fx.pesan.lengkapiPilihan);

      Form.pilihStep('juz', [16]);
      Form.elements.stepLabel('halaman').should('have.text', fx.label.pilihHalaman);
      cy.get(M).find('[wire\\:key^="step-surah"]').should('not.exist');

      Form.pilihStep('halaman', [fx.mushaf.halamanMaryamTaha.value]);
      Form.elements.stepLabel('surah').should('have.text', fx.label.pilihSurah);
      Form.elements.daftar().should('contain', fx.pesan.lengkapiPilihan);

      Form.pilihStep('surah', [19]);
      cy.get(M).should(($m) => expect(F.daftarHeaders($m).map((h) => h.nama)).to.deep.eq(['Maryam']));
    });

    /**
     * Uji program Batas non-ayat (PRG-J / PRG-H / PRG-S): langkah yang tampil,
     * kata satuan pada section, 2 satuan tersimpan, satuan Pencapaian tidak berubah.
     */
    const ujiBatasNonAyat = (prog, { satuan, dropdown }) => {
      const desk = uniq();
      bukaForm(S, prog);
      ['juz', 'halaman', 'surah']
        .filter((s) => !dropdown.includes(s))
        .forEach((s) => cy.get(M).find(`[wire\\:key^="step-${s}"]`).should('not.exist'));
      dropdown.forEach((s) => {
        Form.nilaiOpsiStep(s).then((v) => {
          Form.pilihStep(s, v.slice(0, 2));
        });
      });
      Form.elements.labelTandai().should('contain', `Tandai ${satuan} yang sudah hafal`);
      cy.get(M).then(($m) => {
        const bebas = F.daftarKeys($m).filter((k) => !$m.find(`[wire\\:key="unit-${k}"] input`).is(':disabled'));
        expect(bebas.length, 'minimal 2 satuan bebas').to.be.gte(2);
        Form.centangAyat(bebas.slice(0, 2));
      });
      Form.assertJumlahTerpilih(2, satuan.toLowerCase());
      Form.isiField({ tanggal: hariIni(), deskripsi: desk });
      Form.simpanSukses(fx.pesan.tambahSukses);
      DetailSiswaPage.cell(desk, 'pencapaian').should('match', new RegExp(`dari \\d+ ${satuan.toLowerCase()}\\)$`));
    };

    it('TC-005 : Batas Juz - hanya langkah Juz, dapat dipilih lebih dari satu, satuan yang ditandai juz', function () {
      perluData(this, S.programBatasJuz && S.programBatasJuz.id, 'PRG-J (staging.programBatasJuz) belum diisi');
      ujiBatasNonAyat(S.programBatasJuz, { satuan: 'Juz', dropdown: [] });
    });

    it('TC-006 : Batas Halaman - langkah Juz lalu Halaman, satuan yang ditandai halaman', function () {
      perluData(this, S.programBatasHalaman && S.programBatasHalaman.id, 'PRG-H (staging.programBatasHalaman) belum diisi');
      ujiBatasNonAyat(S.programBatasHalaman, { satuan: 'Halaman', dropdown: ['juz'] });
    });

    it('TC-007 : Jenis Surah Batas Surah - hanya langkah Surat, Juz dan Halaman tidak tampil', function () {
      perluData(this, S.programBatasSurah && S.programBatasSurah.id, 'PRG-S (staging.programBatasSurah) belum diisi');
      ujiBatasNonAyat(S.programBatasSurah, { satuan: 'Surah', dropdown: [] });
    });

    it('TC-008 : Jenis Surah Batas Ayat - langkah Surat lalu Ayat, Juz dan Halaman tidak tampil', function () {
      butuhSA(this);
      bukaForm(S, SA);
      cy.get(M).find('[wire\\:key^="step-juz"], [wire\\:key^="step-halaman"]').should('not.exist');
      Form.elements.stepLabel('surah').should('have.text', fx.label.pilihSurah);
      Form.pilihStep('surah', [19, 20]);
      cy.get(M).should(($m) => expect(F.daftarHeaders($m).map((h) => h.nama)).to.deep.eq(['Maryam', 'Taha']));
    });
  });

  // =========================================================================
  describe('Multi select Juz, Halaman, Surat', () => {
    it('TC-009 : Pilih Juz dapat dicentang lebih dari satu', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [16, 30]);
      Form.nilaiChip('juz').should('deep.eq', [16, 30]);
      Form.elements.stepToggle('juz').should(($b) => expect($b.text().trim()).to.eq('2 Juz dipilih'));
      Form.bukaStep('juz');
      Form.elements.stepOpsi('juz', 16).should('be.checked');
      Form.elements.stepOpsi('juz', 30).should('be.checked');
    });

    it('TC-010 : Pilih Halaman dapat dicentang lebih dari satu', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [16]);
      Form.pilihStep('halaman', [302, 303, 304]);
      Form.nilaiChip('halaman').should('deep.eq', [302, 303, 304]);
      Form.elements.stepToggle('halaman').should(($b) => expect($b.text().trim()).to.eq('3 Halaman dipilih'));
    });

    it('TC-011 : Pilih Surat dapat dicentang lebih dari satu (Jenis Juz)', () => {
      // BUG-001: di program Jenis Juz step Pilih Surah hilang setelah 1 surah
      // dicentang, jadi centang kedua gagal menemukan step. Test sengaja
      // meng-assert perilaku yang BENAR (PRD/DoD S3) -> merah sampai diperbaiki.
      bukaForm(S, A);
      Form.pilihStep('juz', [16]);
      Form.pilihStep('halaman', [fx.mushaf.halamanMaryamTaha.value]);
      Form.pilihStep('surah', [19]);
      Form.pilihStep('surah', [20]);
      Form.nilaiChip('surah').should('deep.eq', [19, 20]);
      cy.get(M).should(($m) => expect(F.daftarHeaders($m).map((h) => h.nama)).to.deep.eq(['Maryam', 'Taha']));
    });

    it('TC-012 : Tidak ada batas jumlah pilihan pada Juz dan Halaman', () => {
      bukaForm(S, A);
      Form.nilaiOpsiStep('juz').then((semua) => {
        Form.pilihStep('juz', semua);
        Form.nilaiChip('juz').should('deep.eq', semua);
      });
      cy.get(M).should('not.contain.text', 'maksimal');

      // Halaman: semua halaman Juz 16 + Juz 30 (43 opsi) pada form baru.
      Form.batal();
      DetailSiswaPage.bukaTambah();
      Form.pilihStep('juz', [16, 30]);
      Form.nilaiOpsiStep('halaman').then((semua) => {
        Form.pilihStep('halaman', semua);
        Form.nilaiChip('halaman').should('have.length', semua.length);
      });
      cy.get(M).should('not.contain.text', 'maksimal');
    });

    it('TC-013 : Daftar Halaman berisi gabungan halaman dari seluruh juz terpilih', () => {
      const [a16, b16] = fx.mushaf.halamanJuz['16'];
      const [a30, b30] = fx.mushaf.halamanJuz['30'];
      bukaForm(S, A);
      Form.pilihStep('juz', [16, 30]);
      Form.nilaiOpsiStep('halaman').should((v) => {
        expect(v.length).to.eq(b16 - a16 + 1 + (b30 - a30 + 1));
        v.forEach((p) => expect((p >= a16 && p <= b16) || (p >= a30 && p <= b30), `halaman ${p} milik Juz 16/30`).to.eq(true));
      });
    });

    it('TC-014 : Daftar Surat berisi gabungan surat dari seluruh halaman terpilih', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [16, 30]);
      Form.pilihStep('halaman', [fx.mushaf.halamanMaryamTaha.value, fx.mushaf.halamanJuz30Awal.value]);
      Form.nilaiOpsiStep('surah').should('deep.eq', fx.mushaf.surahOpsiHal312dan582);
    });

    it('TC-015 : Pilihan Juz dibatasi Target Tahfidz program', function () {
      // Target #247 terkunci Juz 1-30, jadi dipakai program Jenis Juz bertarget
      // terbatas: QAAUTO C Juz Ayat #252 (Juz 29 + 30).
      const P = S.programTargetTerbatas;
      perluData(this, P && P.id, 'staging.programTargetTerbatas belum diisi');
      const luar = Array.from({ length: 30 }, (_, i) => i + 1).find((j) => !P.target.includes(j));
      bukaForm(S, P);
      Form.nilaiOpsiStep('juz').should('deep.eq', [...P.target].sort((a, b) => a - b));
      Form.cariStep('juz', String(luar));
      Form.bukaStep('juz');
      Form.elements.stepMenu('juz').find('.form-check-label').should(($l) => {
        Cypress.$.makeArray($l).forEach((el) => expect(el.textContent.trim()).not.to.eq(`Juz ${luar}`));
      });
    });

    it('TC-016 : Kolom pencarian pada dropdown Pilih Juz', () => {
      bukaForm(S, A);
      Form.elements.stepCari('juz').should('have.attr', 'placeholder', fx.placeholder.cariJuz);
      Form.cariStep('juz', '30');
      Form.bukaStep('juz');
      Form.elements.stepMenu('juz').find('.form-check-label').should(($l) => {
        expect(Cypress.$.makeArray($l).map((el) => el.textContent.trim())).to.deep.eq(['Juz 30']);
      });
    });

    it('TC-017 : Kolom pencarian pada dropdown Pilih Halaman', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [16]);
      Form.elements.stepCari('halaman').should('have.attr', 'placeholder', fx.placeholder.cariHalaman);
      Form.nilaiOpsiStep('halaman').then((semua) => {
        Form.cariStep('halaman', '11');
        Form.bukaStep('halaman');
        cy.get(M).should(($m) => {
          const opsi = Cypress.$.makeArray($m.find('input[wire\\:click^="toggleStepValue(\'halaman\',"]'));
          expect(opsi.length, 'hasil tersaring').to.be.within(1, semua.length - 1);
          opsi.forEach((el) => {
            const label = Cypress.$(el).siblings('.form-check-label').text();
            const value = el.getAttribute('wire:click');
            expect(label.includes('11') || value.includes('11'), `opsi "${label.trim()}" cocok dengan 11`).to.eq(true);
          });
        });
      });
    });

    it('TC-018 : Kolom pencarian pada dropdown Pilih Surat', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [30]);
      // Halaman terakhir Juz 30 (604, beberapa surat pendek) DULU, baru hal. 582
      // (An-Naba'). Kalau 582 dipilih duluan, An-Naba' (satu-satunya opsi) dipilih
      // otomatis dan opsi surah selanjutnya ikut tersaring -> step Pilih Surah
      // tidak pernah muncul lagi (pola kedua BUG-001, run 6 Okt 2026).
      Form.pilihStep('halaman', [fx.mushaf.halamanJuz['30'][1], fx.mushaf.halamanJuz30Awal.value]);
      Form.elements.stepCari('surah').should('have.attr', 'placeholder', fx.placeholder.cariSurah);
      Form.cariStep('surah', 'Naba');
      Form.bukaStep('surah');
      Form.elements.stepMenu('surah').find('.form-check-label').should(($l) => {
        expect(Cypress.$.makeArray($l).map((el) => el.textContent.trim())).to.deep.eq([fx.surah['78'].nama]);
      });
    });

    it('TC-019 : Pencarian dropdown tidak melepas pilihan yang sudah dicentang', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [16]);
      Form.cariStep('juz', '30');
      Form.pilihStep('juz', [30]);
      Form.cariStep('juz', '');
      Form.nilaiChip('juz').should('deep.eq', [16, 30]);
      Form.bukaStep('juz');
      Form.elements.stepOpsi('juz', 16).should('be.checked');
      Form.elements.stepOpsi('juz', 30).should('be.checked');
    });

    it('TC-020 : Melepas pilihan Surat dari chip menghapus ayat surat itu tanpa popup', function () {
      butuhSA(this);
      // Dijalankan di PRG-SA: di Jenis Juz chip surah tidak pernah tampil (BUG-001).
      bukaForm(S, SA);
      Form.pilihStep('surah', [19, 20]);
      Form.centangAyat(['19:1', '19:2', '20:1', '20:2']);
      Form.hapusChip('surah', 20);
      Form.elements.popup().should('not.exist');
      Form.nilaiChip('surah').should('deep.eq', [19]);
      Form.assertTerpilih(['19:1', '19:2']);
      cy.get(M).should(($m) => {
        expect(F.daftarHeaders($m).map((h) => h.nama)).to.deep.eq(['Maryam']);
        expect(F.daftarKeys($m).some((k) => k.startsWith('20:'))).to.eq(false);
      });
      Form.bukaStep('surah');
      Form.elements.stepOpsi('surah', 20).should('not.be.checked');
    });

    it('TC-021 : Hanya satu pilihan pada suatu langkah - dipilih otomatis dan langkah tidak ditampilkan', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [16]);
      Form.pilihStep('halaman', [fx.mushaf.halamanTahaSaja.value]);
      cy.get(M).find('[wire\\:key^="step-surah"]').should('not.exist');
      cy.get(M).should(($m) => expect(F.daftarHeaders($m).map((h) => h.nama)).to.deep.eq(['Taha']));
    });

    it('TC-022 : Melepas pilihan langkah sebelumnya (tanpa ayat terpilih) mengosongkan langkah sesudahnya tanpa popup', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [16, 30]);
      Form.pilihStep('halaman', [fx.mushaf.halamanMaryamTaha.value, fx.mushaf.halamanJuz30Awal.value]);
      Form.assertJumlahTerpilih(0);
      Form.klikStep('juz', 30);
      Form.elements.popup().should('not.exist');
      Form.nilaiChip('juz').should('deep.eq', [16]);
      Form.nilaiChip('halaman').should('deep.eq', [fx.mushaf.halamanMaryamTaha.value]);
      Form.nilaiOpsiStep('surah').should('not.include', 78);
    });
  });

  // =========================================================================
  describe('Simpan', () => {
    it('TC-076 : Menyimpan riwayat dengan ayat dari beberapa surat', function () {
      butuhSA(this);
      const desk = uniq();
      buatRiwayatSurah(S, SA, {
        surah: [19, 20],
        ayat: [...keys(19, 1, 10), ...keys(20, 1, 10)],
        deskripsi: desk,
        pesan: fx.pesan.tambahSukses,
      });
      cy.reload();
      DetailSiswaPage.assertRiwayatAda(desk);
      DetailSiswaPage.cell(desk, 'capaian').should('contain', fx.surah['19'].nama).and('contain', fx.surah['20'].nama);
      // Satu riwayat saja yang memuat kedua surat.
      DetailSiswaPage.elements.rows().filter(`:contains("${desk}")`).should('have.length', 1);
    });

    it('TC-077 : Simpan tanpa satuan yang ditandai menampilkan pesan error', () => {
      bukaForm(S, A);
      Form.pilihStep('juz', [16]);
      Form.pilihStep('halaman', [fx.mushaf.halamanMaryamTaha.value]);
      Form.pilihStep('surah', [19]);
      Form.isiField({ tanggal: hariIni(), deskripsi: uniq() });
      Form.simpan();
      Form.elements.modal().should('be.visible');
      Form.assertErrorValidasi(fx.pesan.minimalSatuan);
    });

    it('TC-078 : Tidak ada batas maksimal ayat dalam satu riwayat', function () {
      butuhSA(this);
      // Surat utuh yang belum tersentuh riwayat lain di spec ini ('Abasa, 42 ayat)
      // supaya Pilih Semua tidak terpotong ayat terkunci dari TC-076.
      const desk = uniq();
      const surat = 80;
      bukaForm(S, SA);
      Form.pilihStep('surah', [surat]);
      Form.pilihSemua();
      Form.assertJumlahTerpilih(fx.surah[surat].ayat);
      Form.isiField({ tanggal: hariIni(), deskripsi: desk });
      Form.simpanSukses(fx.pesan.tambahSukses);
      cy.contains('body', 'maksimal').should('not.exist');
      DetailSiswaPage.cell(desk, 'capaian').should('contain', `1-${fx.surah[surat].ayat}`);
    });
  });
});
