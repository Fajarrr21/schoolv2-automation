// Tahfidz > Capaian Multi Select — Pilih ayat (lepas pilihan, Daftar Ayat, Cari Ayat,
// Pilih Semua, Hapus Semua, Ayat Terpilih).
// TC sheet: TC-023..043, 058, 060..062, 064..069.
//
// Spec ini TIDAK menyimpan riwayat. before() tetap membersihkan riwayat QA
// supaya tidak ada ayat terkunci dari run sebelumnya.
import Form, { RiwayatProgresFormClass as F } from '../../../../../support/pageobjects/tahfidz/RiwayatProgresForm';
import { siapkan, bukaForm, bersihkan } from '../../../../../support/tahfidz';
import { stagingData, perluData, keys } from '../../../../../support/helpers';

const M = '#modal-progress.show';

describe('Tahfidz - Capaian Multi Select - Pilih Ayat', () => {
  let fx;
  let S;
  let A;
  let SA;
  let totalMaryamTaha;

  before(() => {
    cy.fixture('tahfidz').then((d) => {
      fx = d;
      S = stagingData(d, ['programUtama']);
      A = S.programUtama;
      SA = S.programSurahAyat;
      totalMaryamTaha = d.surah['19'].ayat + d.surah['20'].ayat;
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

  /** PRG-SA, Maryam + Taha terpilih. */
  const formMaryamTaha = () => {
    bukaForm(S, SA);
    Form.pilihStep('surah', [19, 20]);
  };

  /** PRG-A, Juz 16 + 30, halaman 312 + 582, surah Taha, 1 ayat Taha tercentang. */
  const formJuzDenganAyat = () => {
    bukaForm(S, A);
    Form.pilihStep('juz', [16, 30]);
    Form.pilihStep('halaman', [fx.mushaf.halamanMaryamTaha.value, fx.mushaf.halamanJuz30Awal.value]);
    Form.pilihStep('surah', [20]);
    cy.get(M).then(($m) => {
      const pertama = F.daftarKeys($m).find((k) => k.startsWith('20:'));
      Form.centangAyat(pertama);
      cy.wrap(pertama).as('ayatTaha');
    });
  };

  // =========================================================================
  describe('Lepas pilihan', () => {
    it('TC-023 : Melepas centang satu Surat dari dropdown langsung menghapus ayat surat itu tanpa popup', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.centangAyat([...keys(19, 1, 3), ...keys(20, 1, 3)]);
      Form.klikStep('surah', 19);
      Form.elements.popup().should('not.exist');
      Form.assertTerpilih(keys(20, 1, 3));
      cy.get(M).should(($m) => {
        expect(F.daftarHeaders($m).map((h) => h.nama)).to.deep.eq(['Taha']);
        expect(F.daftarKeys($m).some((k) => k.startsWith('19:'))).to.eq(false);
      });
    });

    it('TC-024 : Mencentang ulang surat yang dilepas menampilkan kelompoknya dalam keadaan belum tercentang', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.centangAyat([...keys(19, 1, 3), ...keys(20, 1, 3)]);
      Form.klikStep('surah', 19);
      Form.pilihStep('surah', [19]);
      cy.get(M).should(($m) => {
        expect(F.daftarHeaders($m).map((h) => h.nama)).to.deep.eq(['Maryam', 'Taha']);
        expect(F.daftarCheckedKeys($m).filter((k) => k.startsWith('19:'))).to.deep.eq([]);
      });
      Form.centangAyat('19:1');
      Form.assertTerpilih(['19:1', ...keys(20, 1, 3)]);
    });

    it('TC-025 : Melepas centang Juz saat ada ayat terpilih menampilkan popup Ganti Pilihan', () => {
      formJuzDenganAyat();
      Form.klikStep('juz', 16);
      Form.elements.popup().should('be.visible').within(() => {
        cy.get('h3').should('have.text', fx.label.popupGanti.judul);
        cy.get('p').should(($p) => expect($p.text().replace(/\s+/g, ' ').trim()).to.eq(fx.label.popupGanti.pesan));
      });
      Form.elements.gantiBatal().should('have.text', fx.label.popupGanti.batal);
      Form.elements.gantiOk().should('have.text', fx.label.popupGanti.ok);
    });

    it('TC-026 : Popup Ganti Pilihan > Batal mempertahankan juz dan ayat', () => {
      formJuzDenganAyat();
      Form.klikStep('juz', 16);
      Form.gantiPilihan('batal');
      Form.elements.popup().should('not.exist');
      Form.nilaiChip('juz').should('deep.eq', [16, 30]);
      cy.get('@ayatTaha').then((k) => {
        Form.assertTerpilih([k]);
      });
      // BUG-002: setelah Batal, checkbox Juz 16 tetap tidak tercentang padahal
      // pilihannya tidak berubah. Assert perilaku yang BENAR.
      Form.bukaStep('juz');
      Form.elements.stepOpsi('juz', 16).should('be.checked');
    });

    it('TC-027 : Popup Ganti Pilihan > Ganti melepas juz beserta halaman, surat, dan ayat di bawahnya', () => {
      formJuzDenganAyat();
      Form.klikStep('juz', 16);
      Form.gantiPilihan('ok');
      Form.nilaiChip('juz').should('deep.eq', [30]);
      Form.nilaiChip('halaman').should('deep.eq', [fx.mushaf.halamanJuz30Awal.value]);
      Form.assertJumlahTerpilih(0);
      Form.elements.terpilihBox().should('contain', fx.pesan.belumAdaAyat);
    });

    it('TC-028 : Melepas centang Halaman saat ada ayat terpilih menampilkan popup lalu Ganti menghapus ayatnya', () => {
      formJuzDenganAyat();
      Form.klikStep('halaman', fx.mushaf.halamanMaryamTaha.value);
      Form.elements.popup().should('be.visible').find('h3').should('have.text', fx.label.popupGanti.judul);
      Form.gantiPilihan('ok');
      Form.nilaiChip('halaman').should('deep.eq', [fx.mushaf.halamanJuz30Awal.value]);
      Form.nilaiChip('juz').should('deep.eq', [16, 30]);
      Form.assertJumlahTerpilih(0);
    });
  });

  // =========================================================================
  describe('Daftar Ayat', () => {
    it('TC-029 : Daftar Ayat hanya berisi ayat surat terpilih yang berada pada halaman terpilih', () => {
      const [a, b] = fx.mushaf.halamanMaryamTaha.maryamAyat;
      bukaForm(S, A);
      Form.pilihStep('juz', [16]);
      Form.pilihStep('halaman', [fx.mushaf.halamanMaryamTaha.value]);
      Form.pilihStep('surah', [19]);
      cy.get(M).should(($m) => expect(F.daftarKeys($m)).to.deep.eq(keys(19, a, b)));
    });

    it('TC-030 : Daftar Ayat dikelompokkan per surat dengan header nama surat dan seluruh kelompok terbuka', function () {
      butuhSA(this);
      formMaryamTaha();
      cy.get(M).should(($m) => {
        const h = F.daftarHeaders($m);
        expect(h.map((x) => x.nama)).to.deep.eq(['Maryam', 'Taha']);
        expect(h.map((x) => x.jumlah)).to.deep.eq([`${fx.surah['19'].ayat} ayat`, `${fx.surah['20'].ayat} ayat`]);
        // Terbuka tanpa diklik: ayat pertama kedua kelompok sudah ter-render.
        const k = F.daftarKeys($m);
        expect(k).to.include('19:1');
        expect(k).to.include('20:1');
      });
    });

    it('TC-031 : Daftar Ayat dimuat bertahap saat digulir', function () {
      butuhSA(this);
      // Q3: V2 memuat lanjutan lewat TOMBOL "Muat ayat berikutnya", bukan saat
      // digulir. PRD/DoD: dimuat ketika digulir mendekati kelompok berikutnya.
      // Test meng-assert bunyi PRD -> merah selama implementasi masih tombol.
      bukaForm(S, SA);
      Form.pilihStep('surah', [20]);
      cy.get(M).should(($m) => expect(F.daftarKeys($m)).to.have.length(fx.mushaf.pageSize));
      Form.elements.daftarScroll().scrollTo('bottom');
      cy.get(M, { timeout: 15000 }).should(($m) => {
        expect(F.daftarKeys($m).length, 'ayat bertambah setelah digulir').to.be.gt(fx.mushaf.pageSize);
      });
    });

    it('TC-032 : Tombol section belum dapat digunakan selama Daftar Ayat dimuat', function () {
      butuhSA(this);
      bukaForm(S, SA);
      Form.pilihStep('surah', [19]);
      // Perlambat response berikutnya (bukan cy.wait angka) supaya state loading terlihat.
      cy.intercept('POST', `**/livewire/message/${fx.livewire.memberDetail}`, (req) => {
        req.on('response', (res) => res.setDelay(2500));
      }).as('lwLambat');
      Form.bukaStep('surah');
      Form.elements.stepOpsi('surah', 20).click();
      Form.elements.loadingDaftar().should('be.visible').and('contain', fx.pesan.memuat);
      Form.elements.btnRentang().should('be.disabled');
      Form.elements.btnPilihSemua().should('be.disabled');
      cy.wait('@lwLambat');
      Form.elements.loadingDaftar().should('not.be.visible');
      Form.elements.btnPilihSemua().should('not.be.disabled');
    });

    it.skip('TC-033 : Daftar Ayat gagal dimuat (Manual: kegagalan disusun di server, tidak bisa dipicu dari browser)', () => {});
    it.skip('TC-034 : Coba Lagi setelah gagal dimuat (Manual: lanjutan TC-033)', () => {});
    it.skip('TC-035 : Pilihan yang tidak memuat ayat (Manual: butuh data khusus dari dev)', () => {});

    it('TC-036 : Mencentang dan melepas satu ayat tidak memengaruhi ayat lain', function () {
      butuhSA(this);
      bukaForm(S, SA);
      Form.pilihStep('surah', [20]);
      Form.centangAyat('20:5');
      cy.get(M).should(($m) => expect(F.daftarCheckedKeys($m)).to.deep.eq(['20:5']));
      Form.lepasAyat('20:5');
      cy.get(M).should(($m) => expect(F.daftarCheckedKeys($m)).to.deep.eq([]));
    });
  });

  // =========================================================================
  describe('Cari Ayat', () => {
    it('TC-037 : Placeholder Cari Ayat dan huruf tidak menyaring berdasarkan nama surat', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.elements.cariAyat().should('have.attr', 'placeholder', fx.placeholder.cariAyat);
      Form.cariAyat('Taha');
      Form.elements.daftar().should('contain', fx.pesan.ayatTidakDitemukan);
    });

    it('TC-038 : Hasil pencarian nomor ayat tetap dikelompokkan per surat', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.cariAyat('5');
      cy.get(M).should(($m) => {
        expect(F.daftarHeaders($m).map((h) => h.nama)).to.deep.eq(['Maryam', 'Taha']);
        const k = F.daftarKeys($m);
        expect(k).to.include('19:5');
        expect(k).to.include('20:5');
        // Setiap hasil memuat angka yang dicari (pencarian berdasarkan nomor ayat).
        k.forEach((x) => expect(x.split(':')[1]).to.contain('5'));
      });
    });

    it('TC-039 : Pencarian tanpa hasil menampilkan "Ayat tidak ditemukan."', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.cariAyat('999');
      Form.elements.daftar().should('contain', fx.pesan.ayatTidakDitemukan);
    });

    it('TC-040 : Menghapus kata kunci menampilkan kembali seluruh Daftar Ayat', function () {
      butuhSA(this);
      formMaryamTaha();
      cy.get(M).then(($m) => {
        const awal = F.daftarKeys($m);
        Form.cariAyat('5');
        Form.kosongkanCariAyat();
        cy.get(M).should(($n) => expect(F.daftarKeys($n)).to.deep.eq(awal));
      });
    });

    it('TC-041 : Pencarian tidak mengubah ayat yang sudah dipilih', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.centangAyat(keys(20, 1, 3));
      Form.cariAyat('10');
      Form.assertTerpilih(keys(20, 1, 3));
      Form.kosongkanCariAyat();
      Form.assertTerpilih(keys(20, 1, 3));
    });

    it('TC-042 : Label Pilih Semua Ayat berubah menjadi Pilih Semua Hasil saat kolom pencarian terisi', function () {
      butuhSA(this);
      formMaryamTaha();
      // .should(callback) supaya di-retry sampai morph Livewire selesai
      // (.invoke().then() tidak di-retry — run 6 Okt 2026).
      const labelHarus = (teks) =>
        Form.elements.btnPilihSemua().should(($b) => expect($b.text().trim()).to.eq(teks));
      labelHarus(fx.label.pilihSemua);
      Form.cariAyat('5');
      labelHarus(fx.label.pilihSemuaHasil);
      Form.kosongkanCariAyat();
      labelHarus(fx.label.pilihSemua);
    });

    it('TC-043 : Pilih Semua Hasil mencentang seluruh ayat hasil pencarian nomor ayat', function () {
      butuhSA(this);
      // Keputusan user Q4 (6 Okt 2026): pencarian "mengandung" BENAR. Kata kunci 5
      // -> seluruh ayat Maryam & Taha yang nomornya memuat angka 5 (5, 15, 25,
      // 50-59, ...). Pilih Semua Hasil mencentang semuanya (bukan hanya yang
      // ter-render), lalu pilihan tetap setelah kata kunci dihapus.
      const hasil = [19, 20].flatMap((s) =>
        keys(s, 1, fx.surah[s].ayat).filter((k) => k.split(':')[1].includes('5')),
      );
      formMaryamTaha();
      Form.cariAyat('5');
      Form.pilihSemua();
      Form.kosongkanCariAyat();
      Form.assertTerpilih(hasil);
      Form.assertJumlahTerpilih(hasil.length);
    });
  });

  // =========================================================================
  describe('Pilih Semua & Hapus Semua', () => {
    it('TC-058 : Pilih Semua Ayat mencentang seluruh ayat dari seluruh surat terpilih tanpa popup', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.pilihSemua();
      Form.elements.popup().should('not.exist');
      Form.assertJumlahTerpilih(totalMaryamTaha);
      cy.get(M).should(($m) => expect(F.terpilihKeys($m)).to.have.length(totalMaryamTaha));
    });

    it('TC-060 : Hapus Semua Ayat Terpilih tidak aktif ketika belum ada ayat dipilih', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.assertJumlahTerpilih(0);
      Form.elements.btnHapusSemua().should('be.disabled');
    });

    it('TC-061 : Klik Hapus Semua Ayat Terpilih menampilkan popup konfirmasi', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.centangAyat('19:1');
      Form.hapusSemua(null);
      Form.elements.popup().should('be.visible').within(() => {
        cy.get('h3').should('have.text', fx.label.popupHapusSemua.judul);
        cy.get('p').should(($p) => expect($p.text().replace(/\s+/g, ' ').trim()).to.eq(fx.label.popupHapusSemua.pesan));
      });
      Form.elements.hapusSemuaBatal().should('have.text', fx.label.popupHapusSemua.batal);
      Form.elements.hapusSemuaOk().should('have.text', fx.label.popupHapusSemua.ok);
    });

    it('TC-062 : Popup Hapus Semua > Batal mempertahankan ayat terpilih', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.centangAyat(['19:1', '20:1']);
      Form.hapusSemua('batal');
      Form.elements.popup().should('not.exist');
      Form.assertTerpilih(['19:1', '20:1']);
    });
  });

  // =========================================================================
  describe('Ayat Terpilih', () => {
    it('TC-064 : Kondisi awal Ayat Terpilih menampilkan "Belum ada ayat yang dipilih."', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.assertJumlahTerpilih(0);
      Form.elements.terpilihBox().should('contain', fx.pesan.belumAdaAyat);
    });

    it('TC-065 : Ayat Terpilih dikelompokkan per surat dan dijabarkan satu per satu', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.centangAyat([...keys(19, 1, 3), ...keys(20, 1, 2)]);
      Form.elements.terpilihBox().should(($b) => {
        const judul = Cypress.$.makeArray($b.find('.fs-8.fw-bold.text-muted')).map((e) => e.textContent.trim());
        expect(judul).to.deep.eq(['Maryam', 'Taha']);
        const item = Cypress.$.makeArray($b.find('.badge.bg-light > span')).map((e) => e.textContent.trim());
        expect(item).to.deep.eq(['Ayat 1', 'Ayat 2', 'Ayat 3', 'Ayat 1', 'Ayat 2']);
      });
    });

    it('TC-066 : Ayat Terpilih diurutkan mengikuti urutan mushaf, bukan urutan pemilihan', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.centangAyat(['20:10', '20:2', '19:50']);
      Form.assertTerpilih(['19:50', '20:2', '20:10']);
    });

    it('TC-067 : Ayat Terpilih menampilkan jumlah total dan jumlah per surat', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.terapkanRentang('19:1', '19:10');
      Form.terapkanRentang('20:1', '20:10');
      Form.assertJumlahTerpilih(20);
      Form.elements.terpilihBadgeSurat().should(($b) => {
        expect(Cypress.$.makeArray($b).map((e) => e.textContent.trim())).to.deep.eq(['Maryam 10', 'Taha 10']);
      });
    });

    it('TC-068 : Menghapus satu ayat dari Ayat Terpilih ikut melepas centangnya di Daftar Ayat', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.centangAyat(keys(19, 1, 3));
      Form.hapusTerpilih('19:2');
      Form.assertTerpilih(['19:1', '19:3']);
      Form.assertJumlahTerpilih(2);
      Form.elements.unitCheckbox('19:2').should('not.be.checked');
    });

    it('TC-069 : Area Ayat Terpilih tinggi tetap, dapat digulir, dan tombol Simpan tetap terjangkau', function () {
      butuhSA(this);
      formMaryamTaha();
      Form.pilihSemua();
      Form.elements.terpilihScroll().should(($d) => {
        expect($d.css('overflow-y')).to.eq('auto');
        expect($d[0].scrollHeight, 'isi melebihi area').to.be.gt($d[0].clientHeight);
      });
      Form.elements.terpilihScroll().invoke('outerHeight').should('be.lte', 120);
      Form.elements.btnSimpan().scrollIntoView().should('be.visible').and('not.be.disabled');
    });
  });

  // TC-063 (Hapus Semua + ayat terkunci) ada di ayatterkunci.cy.js.
});
