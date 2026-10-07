// Pengaturan > Kesiswaan > Batas Tahfidz (tiket Improvement Tahfidz, V2).
// TC sheet: docs/test-cases/TC_Tahfidz_ImprovementBatas.xlsx — TC-IMT-007..027.
//
// DATA BERSAMA: pengaturan per instansi, tidak bisa dihapus.
// - Form TAMBAH tidak pernah disimpan (permanen). TC-IMT-016/018 = Manual.
// - Form EDIT hanya untuk instansi QA (batas.instansi.qa); nilai awal dipulihkan di after().
// - before() fail-fast bila pengaturan instansi QA sudah tidak sama dengan nilai awal
//   (supaya test tidak menimpa perubahan orang lain).
import PengaturanBatasPage, { PengaturanBatasPageClass as P } from '../../../../../support/pageobjects/pengaturan/PengaturanBatasPage';
import ProgramTahfidzPage from '../../../../../support/pageobjects/tahfidz/ProgramTahfidzPage';
import { siapkan } from '../../../../../support/tahfidz';
import { batasData, pulihkanPengaturan } from '../../../../../support/batas';
import { perluData } from '../../../../../support/helpers';

const M = '#modal-tahfidz-limit.show';
const BULAN = { Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6, Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12 };
const tgl = (s) => {
  const [d, b, y] = s.split(' ');
  return new Date(Number(y), BULAN[b] - 1, Number(d)).getTime();
};

describe('Pengaturan Kesiswaan - Batas Tahfidz', () => {
  let fx;
  let QA;

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
      QA = d.instansi.qa;
    });
    siapkan();
    cy.then(() => {
      PengaturanBatasPage.visit();
      // Fail-fast: jangan menimpa perubahan orang lain.
      PengaturanBatasPage.elements.row(QA.nama).find('td').eq(1).should(($td) => {
        expect($td.text().trim(), `Batas Tahfidz ${QA.nama} masih nilai awal (cek manual bila beda)`).to.eq(fx.pengaturan.opsiBatas[QA.awal.batas]);
      });
    });
  });

  beforeEach(() => {
    siapkan();
  });

  // Koneksi SELALU dipulihkan, juga bila test offline gagal di tengah jalan.
  afterEach(() => {
    offline(false);
  });

  after(() => {
    siapkan();
    cy.then(() => pulihkanPengaturan(fx));
  });

  /**
   * Browser offline/online sungguhan (Chrome DevTools Protocol). Fix BUG-015 (deploy a9e3c84c)
   * memakai `wire:offline`, yang hanya bereaksi pada event offline browser, bukan request gagal.
   */
  // Run 7 Okt 2026: emulasi offline CDP tidak mengubah navigator.onLine di iframe AUT, jadi
  // event offline/online dikirim langsung ke window app (yang didengar Livewire untuk wire:offline).
  const offline = (aktif) => {
    cy.window({ log: false }).then((w) => {
      w.dispatchEvent(new w.Event(aktif ? 'offline' : 'online'));
    });
  };

  /** Instansi pertama yang masih tersedia di dropdown form Tambah (belum punya pengaturan). */
  const instansiTersedia = () =>
    PengaturanBatasPage.elements.instansiSelect().find('option').then(($o) => {
      const opsi = Cypress.$.makeArray($o).filter((o) => o.value);
      expect(opsi.length, 'masih ada instansi tanpa pengaturan').to.be.gt(0);
      return opsi[0].value;
    });

  // =========================================================================
  describe('List pengaturan', () => {
    it('TC-IMT-007 : Kolom dan urutan list pengaturan', () => {
      PengaturanBatasPage.visit();
      PengaturanBatasPage.elements.headers().should(($th) => {
        const h = Cypress.$.makeArray($th).map((e) => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
        expect(h).to.deep.eq(fx.pengaturan.kolom);
      });
      cy.get('table.rappasoft-datatable').should(($t) => {
        const rows = P.barisData($t);
        expect(rows.length).to.be.gte(2);
        const waktu = rows.map((r) => tgl(r[3]));
        expect(waktu, 'Dibuat Pada terbaru -> terlama').to.deep.eq([...waktu].sort((a, b) => b - a));
      });
    });

    it('TC-IMT-008 : List kosong ketika tidak ada data (filter/pencarian tanpa hasil)', () => {
      PengaturanBatasPage.visit().cari('zzzz-tidak-ada');
      PengaturanBatasPage.elements.kosong().should('contain', fx.pengaturan.tabelKosong);
    });

    it('TC-IMT-009 : Filter Instansi dan filter Batas Tahfidz', () => {
      PengaturanBatasPage.visit().bukaFilter();
      PengaturanBatasPage.elements.filterBatas().should(($s) => {
        expect(Cypress.$.makeArray($s.find('option')).map((o) => o.value)).to.deep.eq(['', 'juz', 'halaman', 'surah', 'ayat']);
      });
      PengaturanBatasPage.elements.filterInstansi().find('option').should('contain', QA.nama);
      PengaturanBatasPage.pilihFilter(PengaturanBatasPage.elements.filterBatas, 'surah');
      cy.get('table.rappasoft-datatable').should(($t) => {
        const rows = P.barisData($t);
        expect(rows.length).to.be.gte(1);
        rows.forEach((r) => expect(r[1]).to.eq('Surah'));
      });
      // Kombinasi tanpa data: instansi QA (Ayat) + Batas Juz.
      PengaturanBatasPage.pilihFilter(PengaturanBatasPage.elements.filterInstansi, QA.office);
      PengaturanBatasPage.pilihFilter(PengaturanBatasPage.elements.filterBatas, 'juz');
      PengaturanBatasPage.elements.kosong().should('contain', fx.pengaturan.tabelKosong);
    });

    it('TC-IMT-010 : Pencarian berdasarkan nama instansi', () => {
      PengaturanBatasPage.visit().cari('Digital Indonesia+');
      cy.get('table.rappasoft-datatable').should(($t) => {
        const rows = P.barisData($t);
        expect(rows.map((r) => r[0])).to.include(QA.nama);
        rows.forEach((r) => expect(r[0]).to.contain('Digital Indonesia+'));
      });
      PengaturanBatasPage.cari('zzzz-tidak-ada');
      PengaturanBatasPage.elements.kosong().should('contain', fx.pengaturan.tabelKosong);
    });

    it('TC-IMT-011 : Filter dan pencarian tetap saat pindah halaman', function () {
      PengaturanBatasPage.visit();
      cy.get('table.rappasoft-datatable').then(($t) => {
        const jumlah = P.barisData($t).length;
        perluData(this, jumlah > 10, `Hanya ${jumlah} pengaturan di staging; pagination butuh > 10 baris`);
      });
    });

    it('TC-IMT-012 : List gagal dimuat', () => {
      // Koneksi putus = browser offline (emulasi Chrome), lalu dipulihkan.
      PengaturanBatasPage.visit();
      offline(true);
      cy.contains(fx.pengaturan.pesanGagalMuat).should('be.visible');
      cy.contains('button', fx.pengaturan.btnCobaLagi).should('be.visible');
      // PRD langkah 2: pulihkan koneksi, LALU klik Coba Lagi -> list dimuat.
      offline(false);
      cy.intercept('POST', `**/livewire/message/${fx.livewire.pengaturanTabel}`).as('lwTabelPulih');
      cy.contains('button', fx.pengaturan.btnCobaLagi).should('be.visible').click();
      cy.wait('@lwTabelPulih').its('response.statusCode').should('eq', 200);
      PengaturanBatasPage.elements.row(QA.nama).should('be.visible');
    });
  });

  // =========================================================================
  describe('Form Tambah (tidak pernah disimpan)', () => {
    it('TC-IMT-013 : Isi dan nilai awal form Tambah Batas Tahfidz', () => {
      PengaturanBatasPage.visit();
      cy.get('table.rappasoft-datatable').then(($t) => {
        const punya = P.barisData($t).map((r) => r[0]);
        PengaturanBatasPage.bukaTambah();
        PengaturanBatasPage.elements.judulModal().should('have.text', fx.pengaturan.judulTambah);
        PengaturanBatasPage.elements.instansiSelect().should(($s) => {
          const opsi = Cypress.$.makeArray($s.find('option')).filter((o) => o.value).map((o) => o.textContent.trim());
          opsi.forEach((n) => expect(punya, `${n} belum punya pengaturan`).not.to.include(n));
        });
        PengaturanBatasPage.elements.batasSelect().should('have.value', 'halaman');
        PengaturanBatasPage.elements.metodeSelect().should('have.value', 'mushaf');
        PengaturanBatasPage.elements.batasSelect().siblings('.form-text').should(($d) => expect($d.text().replace(/\s+/g, ' ').trim()).to.eq(fx.pengaturan.helperBatas));
        PengaturanBatasPage.elements.metodeSelect().siblings('.form-text').should(($d) => expect($d.text().replace(/\s+/g, ' ').trim()).to.eq(fx.pengaturan.helperMetode));
        PengaturanBatasPage.batal();
      });
    });

    it('TC-IMT-014 : Opsi Batas Tahfidz Juz, Halaman, Surah, Ayat dapat dipilih', () => {
      PengaturanBatasPage.visit().bukaTambah();
      PengaturanBatasPage.elements.batasSelect().should(($s) => {
        expect(Cypress.$.makeArray($s.find('option')).map((o) => o.value)).to.deep.eq(['juz', 'halaman', 'surah', 'ayat']);
      });
      ['juz', 'halaman', 'surah', 'ayat'].forEach((v) => {
        PengaturanBatasPage.elements.batasSelect().select(v).should('have.value', v);
      });
      PengaturanBatasPage.batal();
    });

    it('TC-IMT-015 : Field Metode Perhitungan Halaman tampil pada setiap pilihan Batas Tahfidz', () => {
      PengaturanBatasPage.visit().bukaTambah();
      ['halaman', 'juz', 'surah', 'ayat'].forEach((v) => {
        PengaturanBatasPage.elements.batasSelect().select(v);
        PengaturanBatasPage.elements.metodeSelect().should('be.visible').and(($s) => {
          expect(Cypress.$.makeArray($s.find('option')).map((o) => o.value)).to.deep.eq(['mushaf', 'per_juz']);
        });
        cy.contains(`${M} label.required`, 'Metode Perhitungan Halaman').should('exist');
      });
      PengaturanBatasPage.batal();
    });

    it('TC-IMT-017 : Tombol Simpan nonaktif sebelum Instansi dipilih', () => {
      // PRD: "Tombol Simpan tidak dapat digunakan hingga instansi dipilih." Hanya
      // di-assert, TIDAK diklik (form tambah tidak pernah disimpan).
      PengaturanBatasPage.visit().bukaTambah();
      PengaturanBatasPage.elements.instansiSelect().should('have.value', '');
      PengaturanBatasPage.elements.btnSimpan().should('be.disabled');
    });

    // TC-IMT-019 dipindah ke hakakses.cy.js: akun QA BT hanya punya SMP Digital Indonesia+
    // (sudah berpengaturan) -> kondisi "seluruh instansi sudah punya" tercapai tanpa data baru.

    it('TC-IMT-020 : Batal pada form Tambah tidak menyimpan data', () => {
      PengaturanBatasPage.visit();
      cy.get('table.rappasoft-datatable').then(($t) => {
        const sebelum = P.barisData($t);
        PengaturanBatasPage.bukaTambah();
        PengaturanBatasPage.elements.instansiSelect().find('option').eq(1).then(($o) => {
          PengaturanBatasPage.pilihInstansi($o.val());
        });
        PengaturanBatasPage.elements.batasSelect().select('juz');
        PengaturanBatasPage.elements.metodeSelect().select('per_juz');
        PengaturanBatasPage.batal();
        cy.reload();
        cy.get('table.rappasoft-datatable').should(($t2) => expect(P.barisData($t2)).to.deep.eq(sebelum));
      });
    });

    it('TC-IMT-021 : Gagal simpan karena koneksi', () => {
      // AMAN (berlapis): browser offline DAN semua request komponen form digagalkan
      // (forceNetworkError) sebelum klik Simpan -> tidak ada yang sampai ke server.
      // Bagian "klik Simpan berkali-kali" butuh simpan sungguhan (permanen) -> tidak diuji.
      PengaturanBatasPage.visit().bukaTambah();
      instansiTersedia().then((office) => {
        PengaturanBatasPage.pilihInstansi(office);
      });
      PengaturanBatasPage.elements.batasSelect().select('juz');
      PengaturanBatasPage.elements.metodeSelect().select('per_juz');
      cy.intercept('POST', `**/livewire/message/${fx.livewire.pengaturan}`, { forceNetworkError: true }).as('lwSimpanPutus');
      offline(true);
      // Fix a9e3c84c: selama offline Simpan nonaktif (x-buttons.submit wire:offline.attr="disabled")
      // dan pesan gagal simpan tampil di modal -> klik tidak mungkin, double submit tercegah.
      PengaturanBatasPage.elements.btnSimpan().should('be.disabled');
      cy.contains(M, fx.pengaturan.pesanGagalSimpan).should('be.visible');
      PengaturanBatasPage.elements.batasSelect().should('have.value', 'juz');
      PengaturanBatasPage.elements.metodeSelect().should('have.value', 'per_juz');
      offline(false);
      PengaturanBatasPage.batal();
    });

    it('TC-IMT-022 : Sesi berakhir saat menyimpan', () => {
      // Sesi berakhir = LOGOUT sungguhan di server (setara "logout di tab lain") saat form terbuka.
      // INSIDEN run 7 Okt 2026: versi lama memakai cy.clearCookies(), sesi ternyata tetap hidup dan
      // Simpan MENYIMPAN pengaturan permanen. Sekarang sesi dipastikan mati DULU (GET /home
      // dialihkan ke login) sebelum Simpan diklik; kalau tidak mati, test berhenti sebelum klik.
      PengaturanBatasPage.visit().bukaTambah();
      instansiTersedia().then((office) => {
        PengaturanBatasPage.pilihInstansi(office);
      });
      cy.window().then((w) => {
        const meta = w.document.querySelector('meta[name="csrf-token"]');
        const token = w.livewire_token || (meta && meta.content);
        expect(token, 'token CSRF halaman').to.be.a('string').and.not.be.empty;
        cy.request({ method: 'POST', url: '/logout', form: true, body: { _token: token }, failOnStatusCode: false });
      });
      cy.request({ url: '/home', followRedirect: false, failOnStatusCode: false }).then((res) => {
        expect(res.status, 'sesi sudah berakhir (redirect)').to.be.oneOf([301, 302]);
        expect(res.redirectedToUrl || '', 'diarahkan ke login').to.contain(Cypress.expose('appLogin'));
      });
      PengaturanBatasPage.elements.btnSimpan().click();
      cy.location('pathname', { timeout: 20000 }).should('eq', Cypress.expose('appLogin'));
      cy.contains(fx.pengaturan.pesanSesiBerakhir).should('be.visible');
    });
  });

  // =========================================================================
  describe('Form Edit (instansi QA, dipulihkan)', () => {
    it('TC-IMT-023 : Edit pengaturan Batas Tahfidz', () => {
      PengaturanBatasPage.visit().bukaEdit(QA.nama);
      PengaturanBatasPage.elements.instansiDisabled().should('have.value', QA.nama).and('be.disabled');
      PengaturanBatasPage.elements.batasSelect().select('halaman');
      PengaturanBatasPage.elements.metodeSelect().select('mushaf');
      PengaturanBatasPage.simpanEdit(fx.pengaturan.pesanEdit);
      cy.reload();
      PengaturanBatasPage.assertBaris(QA.nama, 'Halaman', fx.pengaturan.opsiMetode.mushaf);
      pulihkanPengaturan(fx);
      PengaturanBatasPage.visit().assertBaris(QA.nama, fx.pengaturan.opsiBatas[QA.awal.batas], fx.pengaturan.opsiMetode[QA.awal.metode]);
    });

    it('TC-IMT-024 : Batal pada form Edit tidak mengubah nilai', () => {
      PengaturanBatasPage.visit().bukaEdit(QA.nama);
      PengaturanBatasPage.elements.batasSelect().select('juz');
      PengaturanBatasPage.batal();
      cy.reload();
      PengaturanBatasPage.assertBaris(QA.nama, fx.pengaturan.opsiBatas[QA.awal.batas], fx.pengaturan.opsiMetode[QA.awal.metode]);
    });

    it('TC-IMT-026 : Pengaturan antar instansi tidak saling memengaruhi', () => {
      const Y = fx.instansi.denganHalaman;
      PengaturanBatasPage.visit();
      cy.get('table.rappasoft-datatable').then(($t) => {
        const lain = P.barisData($t).filter((r) => r[0] !== QA.nama);
        PengaturanBatasPage.bukaEdit(QA.nama);
        PengaturanBatasPage.elements.batasSelect().select('juz');
        PengaturanBatasPage.simpanEdit(fx.pengaturan.pesanEdit);
        cy.reload();
        cy.get('table.rappasoft-datatable').should(($t2) => {
          expect(P.barisData($t2).filter((r) => r[0] !== QA.nama)).to.deep.eq(lain);
        });
      });
      // Default form Tambah Tahfidz instansi Y tetap mengikuti pengaturan Y.
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(Y.nama).pilihJenis('juz');
      ProgramTahfidzPage.nilaiBatas().should('eq', Y.batas);
      ProgramTahfidzPage.batal();
      pulihkanPengaturan(fx);
    });

    it('TC-IMT-027 : Instansi tanpa pengaturan memakai nilai bawaan sistem (Halaman)', function () {
      const X = fx.instansi.tanpaPengaturan.nama;
      PengaturanBatasPage.visit();
      cy.get('table.rappasoft-datatable').then(($t) => {
        perluData(this, !P.barisData($t).some((r) => r[0] === X),
          `${X} sudah punya pengaturan (insiden TC-IMT-022 run 7 Okt 2026) — hapus barisnya lewat DB`);
      });
      ProgramTahfidzPage.visit().bukaTambah().pilihInstansi(fx.instansi.tanpaPengaturan.nama).pilihJenis('juz');
      ProgramTahfidzPage.nilaiBatas().should('eq', 'halaman');
      ProgramTahfidzPage.batal();
    });
  });

  // =========================================================================
  // Keputusan D1 (user/dev 6 Okt 2026): boleh MENYIMPAN pengaturan untuk satu instansi
  // yang belum punya pengaturan; barisnya dihapus dev lewat DB sesudah testing.
  // - Dijalankan sesudah TC-IMT-027 (yang butuh SMP Islam Terpadu Purwokerto tanpa pengaturan).
  // - Instansi yang dipakai dicatat di STATE (di-commit) supaya jelas baris mana yang dihapus,
  //   dan run berikutnya TIDAK membuat pengaturan baru lagi selama baris itu masih ada.
  describe('Simpan pengaturan instansi baru (D1, dihapus lewat DB)', () => {
    const STATE = 'docs/test-data/pengaturan-baru.json';
    let Y = null; // { nama, office, tanggal }

    it('TC-IMT-016 : Simpan pengaturan baru berhasil', function () {
      cy.task('readTextFile', { filePath: STATE }).then((txt) => {
        const lama = txt ? JSON.parse(txt) : null;
        PengaturanBatasPage.visit();
        cy.get('table.rappasoft-datatable').then(($t) => {
          if (lama && P.barisData($t).some((r) => r[0] === lama.nama)) {
            Y = lama;
            perluData(this, false, `${lama.nama} sudah punya pengaturan dari run ${lama.tanggal}; hapus barisnya lewat DB untuk mengulang TC-IMT-016`);
          }
        });
        PengaturanBatasPage.bukaTambah();
        PengaturanBatasPage.elements.instansiSelect().find('option').then(($o) => {
          const opsi = Cypress.$.makeArray($o).filter((o) => o.value).map((o) => ({ nama: o.textContent.trim(), office: o.value }));
          const pilih = (lama && opsi.find((o) => o.nama === lama.nama))
            || opsi.find((o) => o.nama !== fx.instansi.tanpaPengaturan.nama)
            || opsi[0];
          expect(pilih, 'ada instansi tanpa pengaturan').to.exist;
          Y = { ...pilih, tanggal: new Date().toISOString().slice(0, 10) };
          // Catat SEBELUM simpan: bila run terputus sesudah simpan, baris tetap terlacak.
          cy.writeFile(STATE, { ...Y, _catatan: 'Pengaturan Batas Tahfidz dibuat TC-IMT-016 (keputusan D1). Hapus baris tahfidz_settings instansi ini lewat DB sesudah testing.' });
          PengaturanBatasPage.pilihInstansi(Y.office);
        });
        PengaturanBatasPage.elements.batasSelect().select('ayat');
        PengaturanBatasPage.elements.metodeSelect().select('per_juz');
        PengaturanBatasPage.simpanEdit(fx.pengaturan.pesanSimpan);
        cy.reload();
        cy.get('table.rappasoft-datatable').should(($t) => {
          expect(P.barisData($t)[0], 'pengaturan baru tampil paling atas').to.deep.include.members([
            Y.nama, fx.pengaturan.opsiBatas.ayat, fx.pengaturan.opsiMetode.per_juz,
          ]);
        });
      });
    });

    it('TC-IMT-018 : Instansi yang sudah punya pengaturan tidak dapat ditambah lagi', function () {
      perluData(this, !!Y, 'Butuh instansi dari TC-IMT-016');
      PengaturanBatasPage.visit().bukaTambah();
      PengaturanBatasPage.elements.instansiSelect().find('option').should(($o) => {
        const nama = Cypress.$.makeArray($o).map((o) => o.textContent.trim());
        expect(nama, 'instansi QA (sudah punya) tidak ditawarkan').not.to.include(QA.nama);
        expect(nama, `${Y.nama} (baru disimpan) tidak ditawarkan`).not.to.include(Y.nama);
      });
      // Tab kedua yang dibuka SEBELUM Y disimpan masih punya opsi Y -> disimulasikan dengan
      // menyisipkan opsi itu, lalu Simpan harus ditolak server.
      PengaturanBatasPage.elements.instansiSelect().then(($s) => {
        $s.append(Cypress.$('<option>').val(Y.office).text(Y.nama));
      });
      PengaturanBatasPage.pilihInstansi(Y.office);
      PengaturanBatasPage.elements.batasSelect().select('juz');
      cy.aliasLivewireMethod(fx.livewire.pengaturan, 'submit_tahfidz_limit', 'lwSimpanDobel');
      PengaturanBatasPage.elements.btnSimpan().click();
      cy.wait('@lwSimpanDobel', { timeout: 30000 });
      cy.livewireIdle();
      cy.contains(M, fx.pengaturan.pesanUnik).should('be.visible');
      PengaturanBatasPage.batal();
      cy.reload();
      cy.get('table.rappasoft-datatable').should(($t) => {
        const baris = P.barisData($t).filter((r) => r[0] === Y.nama);
        expect(baris.length, `${Y.nama} tetap satu pengaturan`).to.eq(1);
        expect(baris[0][1], 'nilai tidak tertimpa').to.eq(fx.pengaturan.opsiBatas.ayat);
      });
    });
  });
});
