// Pengaturan > Kesiswaan > Batas Tahfidz — hak akses per jenis pengguna (tiket Improvement, V2).
// TC sheet: TC-IMT-001..005 (006 = observasi form lewat extension, lihat BUG-016).
//
// Akun QA (dibuat 6 Okt 2026 lewat extension, jenis pengguna "QA BT ..."):
//   cypress.env.json -> creds.staging.roles.{semua, tanpa, lihat, lihatTambah, lihatUbah}
//   Akun belum diisi -> TC ditandai Blocked (bukan error).
// Fakta V2 (laporan extension + source origin/staging):
// - Form Jenis Pengguna hanya punya checkbox on/off "Pengaturan > Kesiswaan > Batas Tahfidz",
//   TANPA aksi Lihat/Tambah/Ubah -> akun lihat/lihatTambah/lihatUbah identik dengan "semua".
//   TC-003..005 meng-assert PRD supaya tetap merah sampai aksi granular dibuat (BUG-016).
// - Sidebar memakai MiddlewareMenuAccess::canSubmenu(..., 'student-affairs-tahfidz-limit'),
//   tetapi route hanya `permission:setting,student-affairs` (izin modul Kesiswaan).
// Hanya MEMBACA: tidak ada form yang disimpan.
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import PengaturanBatasPage from '../../../../../support/pageobjects/pengaturan/PengaturanBatasPage';
import { batasData } from '../../../../../support/batas';
import { perluData } from '../../../../../support/helpers';

const LINK = 'a[href$="/setting/student-affairs/tahfidz-limit"]';

describe('Pengaturan Kesiswaan - Batas Tahfidz - Hak Akses', () => {
  let fx;
  let QA;

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
      QA = d.instansi.qa;
    });
  });

  /** Login sebagai akun QA; akun belum diisi -> TC Blocked. */
  const masukSebagai = (ctx, role) => {
    LoginPage.loginSebagai(role, (alasan) => perluData(ctx, false, alasan));
  };

  /** Menu sidebar Batas Tahfidz ada di DOM (menu Pengaturan berupa popup, jadi cek exist). */
  const menuAda = (ada) => {
    cy.visitRelative('/home');
    cy.get('body').should(($b) => {
      expect($b.find(LINK).length > 0, `submenu Batas Tahfidz ${ada ? 'tampil' : 'tidak tampil'}`).to.eq(ada);
    });
  };

  /** Item menu Aksi baris instansi QA (kosong bila tombol Aksi tidak ada). */
  const aksiBarisQA = () => {
    PengaturanBatasPage.elements.row(QA.nama).then(($tr) => {
      const $btn = $tr.find('td:last-child button');
      if (!$btn.length) return;
      cy.wrap($btn).click();
      PengaturanBatasPage.elements.row(QA.nama).find('.menu.show').should('be.visible');
    });
    return PengaturanBatasPage.elements.row(QA.nama).then(($tr) =>
      Cypress.$.makeArray($tr.find('.menu.show a.menu-link')).map((a) => a.textContent.trim()),
    );
  };

  it('TC-IMT-001 : Akses menu Batas Tahfidz dengan hak akses Semua', function () {
    masukSebagai(this, 'semua');
    menuAda(true);
    PengaturanBatasPage.visit();
    PengaturanBatasPage.elements.btnTambah().should('be.visible');
    aksiBarisQA().should('include', 'Edit');
  });

  it('TC-IMT-002 : Menu tidak tampil untuk jenis pengguna tanpa hak akses Batas Tahfidz', function () {
    masukSebagai(this, 'tanpa');
    menuAda(false);
    // Akses langsung lewat URL juga harus ditolak (izin halaman = izin menu).
    cy.visitRelative('/setting/student-affairs/tahfidz-limit', { failOnStatusCode: false });
    cy.get('body').should(($b) => {
      expect($b.find('h3.card-title:contains("Daftar Batas Tahfidz")').length, 'halaman Batas Tahfidz tidak bisa dibuka lewat URL').to.eq(0);
    });
  });

  it('TC-IMT-019 : Seluruh instansi sudah memiliki pengaturan', function () {
    // Akun QA BT Semua hanya punya instansi SMP Digital Indonesia+ yang sudah berpengaturan.
    masukSebagai(this, 'semua');
    PengaturanBatasPage.visit();
    PengaturanBatasPage.elements.btnTambah().should('be.disabled');
    PengaturanBatasPage.elements.teksSemuaPunya().should('contain', fx.pengaturan.pesanSemuaPunya);
  });

  it('TC-IMT-003 : Hak akses hanya Lihat membuat list bersifat hanya-baca', function () {
    masukSebagai(this, 'lihat');
    PengaturanBatasPage.visit();
    PengaturanBatasPage.elements.row(QA.nama).should('be.visible');
    cy.get('body').should(($b) => expect($b.find('button:contains("Tambah Batas Tahfidz")').length, 'tombol Tambah tidak tampil').to.eq(0));
    aksiBarisQA().should('not.include', 'Edit');
  });

  it('TC-IMT-004 : Hak akses Lihat + Tambah tanpa Ubah', function () {
    masukSebagai(this, 'lihatTambah');
    PengaturanBatasPage.visit();
    PengaturanBatasPage.elements.btnTambah().should('be.visible');
    aksiBarisQA().should('not.include', 'Edit');
  });

  it('TC-IMT-005 : Hak akses Lihat + Ubah tanpa Tambah', function () {
    masukSebagai(this, 'lihatUbah');
    PengaturanBatasPage.visit();
    cy.get('body').should(($b) => expect($b.find('button:contains("Tambah Batas Tahfidz")').length, 'tombol Tambah tidak tampil').to.eq(0));
    aksiBarisQA().should('include', 'Edit');
  });
});
