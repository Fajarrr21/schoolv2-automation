// DetailSiswaPage — halaman Detail Siswa Tahfidz
// /student-affairs/tahfidz/detail/{tahfidzId}/member/{memberId}
// (grafik, tabel Riwayat Progress, tombol Excel & Tambah Riwayat, modal form),
// plus tab Tahfidz di Anggota > Siswa > Detail (/member/student/detail/{memberId})
// untuk verifikasi capaian per program.
//
// VERIFIED lewat element analysis #2 (6 Okt 2026). Pembagian halaman = usulan Q10
// (belum dijawab user): bila diputuskan lain, cukup pindahkan method, selector tetap.
import { rx, route } from '../../helpers';
import RiwayatProgresForm from '../tahfidz/RiwayatProgresForm';

const ROUTE = '/student-affairs/tahfidz/detail/{tahfidzId}/member/{memberId}';
const ROUTE_ANGGOTA = '/member/student/detail/{memberId}';
const LW_TABLE = 'student-affairs.tahfidz.datatable.progress-history-datatable';
const TABLE = 'table.rappasoft-datatable';
const ROW = `${TABLE} tbody tr`;
const KOL = { deskripsi: 2, capaian: 3, pencapaian: 4 };
const LW_ANGGOTA = 'member.detail-member.index';
const PESAN_FOTO = 'Berhasil ubah foto !';

class DetailSiswaPage {
  elements = {
    cardDataSiswa: () => cy.contains('.card .card-label', rx('Data Siswa')).closest('.card'),
    chart: () => cy.get('#chart-tahfidz-progress'),
    btnTambah: () => cy.get('button[wire\\:click="modalForm"]'),
    btnExcel: () => cy.get('button[wire\\:click="$emit(\'export_table_tahfidz_progress_history\')"]'),
    perPage: () => cy.get('select#perPage'),
    cari: () => cy.get(`${TABLE}`).closest('[wire\\:id]').find('input[wire\\:model="filters.search"]'),
    tabel: () => cy.get(TABLE),
    headers: () => cy.get(`${TABLE} thead th`),
    rows: () => cy.get(ROW),
    kosong: () => cy.get(`${ROW} td[colspan]`),
    row: (deskripsi) => cy.contains(ROW, deskripsi),
    // Modal hapus — selalu ada di DOM; terbuka = .show
    modalHapus: () => cy.get('#modal-progress-delete.show', { timeout: 15000 }),
    btnHapusOk: () => cy.get('#modal-progress-delete.show .modal-footer button[type="submit"]'),

    // Tab Tahfidz di Anggota > Detail Siswa (verified F)
    tabTahfidzPane: () => cy.get('#kt_tab_pane_tahfidz'),
    // Tab "Tahfidz" di daftar tab detail siswa (verified EA#2-F: teks tab "Tahfidz",
    // pane #kt_tab_pane_tahfidz). Dicari lewat teks persis, bukan href tebakan.
    tabTahfidzLink: () => cy.contains('a[data-bs-toggle="tab"], a[href^="#kt_tab_pane"]', rx('Tahfidz')),
    anggotaRow: (tahfidzId) => cy.get(`#kt_tab_pane_tahfidz tr[wire\\:key="table-row-${tahfidzId}"]`),
  };

  /** Alias datatable riwayat (dipakai export & re-render). */
  interceptTable() {
    cy.intercept('POST', `**/livewire/message/${LW_TABLE}`).as('lwTabel');
    return this;
  }

  visit(tahfidzId, memberId) {
    cy.visitRelative(route(ROUTE, { tahfidzId, memberId }));
    this.elements.btnTambah().should('be.visible');
    return this;
  }

  /** Klik Tambah Riwayat -> modal Tambah terbuka. */
  bukaTambah() {
    this.elements.btnTambah().click();
    cy.wait('@lwSiswa');
    cy.livewireIdle();
    RiwayatProgresForm.assertTerbuka('Tambah');
    return this;
  }

  // ------------------------------------------------------------------ Tabel riwayat
  /** Tampilkan semua baris (per page 1000) supaya baris QA tidak tersembunyi di halaman 2. */
  tampilkanSemua() {
    this.interceptTable();
    this.elements.perPage().then(($s) => {
      if ($s.val() !== '1000') {
        cy.wrap($s).select('1000');
        cy.wait('@lwTabel');
        cy.livewireIdle();
      }
    });
    return this;
  }

  /** Buka menu Aksi (Alpine) pada baris riwayat, lalu klik item (Edit / Hapus). */
  aksi(deskripsi, item) {
    this.elements.row(deskripsi).find('td:last-child button').click();
    this.elements.row(deskripsi).find('.menu.show a.menu-link').contains(rx(item)).click();
    cy.wait('@lwSiswa');
    cy.livewireIdle();
    return this;
  }

  bukaEdit(deskripsi) {
    this.aksi(deskripsi, 'Edit');
    RiwayatProgresForm.assertTerbuka('Edit');
    return this;
  }

  hapus(deskripsi, pesan) {
    this.aksi(deskripsi, 'Hapus');
    this.elements.modalHapus().should('be.visible');
    cy.modalStabil('#modal-progress-delete');
    // Alias khusus request method "delete" (lihat cy.aliasLivewireMethod).
    cy.aliasLivewireMethod('student-affairs.tahfidz.member-detail', 'delete', 'lwDelete');
    this.elements.btnHapusOk().click();
    cy.wait('@lwDelete', { timeout: 30000 }).then((i) => {
      cy.assertNotifDiResponse(i, '{"event":"modal-hide","data":{"modal":"modal-progress-delete"}}');
      if (pesan) cy.assertNotifDiResponse(i, pesan);
    });
    cy.livewireIdle();
    cy.get('#modal-progress-delete.show', { timeout: 30000 }).should('not.exist');
    return this;
  }

  /** Teks sel (0-based) baris riwayat berdasarkan deskripsi. */
  cell(deskripsi, kolom) {
    const idx = typeof kolom === 'number' ? kolom : KOL[kolom];
    return this.elements.row(deskripsi).find('td').eq(idx).invoke('text').then((t) => t.replace(/\s+/g, ' ').trim());
  }

  assertCell(deskripsi, kolom, expected) {
    const idx = typeof kolom === 'number' ? kolom : KOL[kolom];
    this.elements.row(deskripsi).find('td').eq(idx).should(($td) => {
      expect($td.text().replace(/\s+/g, ' ').trim()).to.eq(expected);
    });
    return this;
  }

  assertRiwayatAda(deskripsi) {
    this.elements.row(deskripsi).should('exist');
    return this;
  }

  assertRiwayatTidakAda(deskripsi) {
    cy.get(TABLE).should(($t) => {
      const ada = Cypress.$.makeArray($t.find('tbody tr')).some(
        (tr) => Cypress.$(tr).find('td').eq(KOL.deskripsi).text().trim() === deskripsi,
      );
      expect(ada, `riwayat "${deskripsi}" sudah tidak ada`).to.eq(false);
    });
    return this;
  }

  /**
   * Hapus SEMUA riwayat yang kolom Deskripsi-nya diawali prefix (default "QA").
   * Column-scoped (bukan includes seluruh baris). Dipakai cleanup & setup spec.
   * Halaman harus sudah di-visit ke Detail Siswa QA.
   */
  bersihkanRiwayatQA(prefix = 'QA', pesan, sisa = 200) {
    this.tampilkanSemua();
    cy.get(TABLE).then(($t) => {
      const target = Cypress.$.makeArray($t.find('tbody tr'))
        .map((tr) => Cypress.$(tr).find('td').eq(KOL.deskripsi).text().trim())
        .find((d) => d.startsWith(prefix));
      if (!target) {
        cy.log(`Tidak ada riwayat berawalan "${prefix}" lagi`);
        return;
      }
      if (sisa <= 0) throw new Error('Cleanup berhenti: terlalu banyak iterasi.');
      cy.log(`Hapus riwayat QA: ${target}`);
      this.hapus(target, pesan);
      this.assertRiwayatTidakAda(target);
      this.bersihkanRiwayatQA(prefix, pesan, sisa - 1);
    });
    return this;
  }

  // ------------------------------------------------------------------ Export
  /** Klik Excel -> path file .xlsx terbaru di cypress/downloads. */
  exportExcel() {
    cy.task('clearDownloads');
    this.interceptTable();
    this.elements.btnExcel().click();
    cy.wait('@lwTabel');
    cy.livewireIdle();
    return cy
      .task('waitDownload', { ext: '.xlsx', timeout: 30000 }, { timeout: 40000 })
      .should('not.be.null');
  }

  // ------------------------------------------------------------------ Tab Anggota
  visitAnggota(memberId) {
    cy.visitRelative(route(ROUTE_ANGGOTA, { memberId }));
    // Tab dibuka lewat link Bootstrap; pane-nya verified, link-nya (?)
    this.elements.tabTahfidzLink().click();
    this.elements.tabTahfidzPane().should('be.visible');
    return this;
  }

  // ------------------------------------------------------------------ Foto siswa (Anggota > Detail)
  // Crosschecked source origin/staging: resources/views/member/detail-member/index.blade.php
  // (<form wire:submit.prevent="edit_image">, input file wire:model.defer="image",
  // tombol Hapus wire:click="remove_image", Simpan = x-buttons.submit target edit_image).
  // MemberRepository::edit_image: file -> upload S3; null -> URL avatar otomatis (ui-avatars).
  fotoForm() {
    return cy.get('form[wire\\:submit\\.prevent="edit_image"]');
  }

  simpanFoto() {
    cy.aliasLivewireMethod(LW_ANGGOTA, 'edit_image', 'lwFoto');
    this.fotoForm().find('button[type="submit"]').click();
    cy.wait('@lwFoto', { timeout: 30000 }).then((i) => cy.assertNotifDiResponse(i, PESAN_FOTO));
    cy.livewireIdle();
    return this;
  }

  /** Unggah foto (fixture) untuk siswa lalu simpan. */
  unggahFoto(memberId, fixturePath) {
    cy.visitRelative(route(ROUTE_ANGGOTA, { memberId }));
    this.fotoForm().find('input[type="file"]').selectFile(fixturePath);
    // Upload sementara Livewire selesai -> tombol Simpan muncul (image != avatar).
    this.fotoForm().find('button[type="submit"]', { timeout: 30000 }).should('be.visible');
    cy.livewireIdle();
    return this.simpanFoto();
  }

  /** Kembalikan foto ke avatar otomatis (Hapus lalu Simpan). Aman bila sudah avatar. */
  kembalikanFoto(memberId) {
    cy.visitRelative(route(ROUTE_ANGGOTA, { memberId }));
    this.fotoForm().then(($f) => {
      if (!$f.find('[wire\\:click="remove_image"]').length) {
        cy.log('Foto siswa sudah avatar otomatis');
        return;
      }
      cy.wrap($f).find('[wire\\:click="remove_image"]').click();
      cy.livewireIdle();
      this.simpanFoto();
    });
    return this;
  }

  /** "0% (0 dari 6236 ayat)" pada tab Tahfidz Anggota untuk program tertentu. */
  anggotaCapaian(tahfidzId) {
    return this.elements
      .anggotaRow(tahfidzId)
      .find('span.fw-bold.fs-7.text-nowrap')
      .invoke('text')
      .then((t) => t.replace(/\s+/g, ' ').trim());
  }
}

export default new DetailSiswaPage();
