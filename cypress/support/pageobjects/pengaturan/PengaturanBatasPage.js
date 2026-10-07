// PengaturanBatasPage — Pengaturan > Kesiswaan > Batas Tahfidz
// /setting/student-affairs/tahfidz-limit
//
// VERIFIED element analysis #3 (6 Okt 2026, bagian G) + source origin/staging
// (Setting/StudentAffairs/TahfidzLimit/Index.php, index.blade.php, table-row.blade.php).
//
// PENTING (data bersama): pengaturan berlaku PER INSTANSI dan TIDAK BISA DIHAPUS.
// - JANGAN pernah menyimpan form TAMBAH (membuat pengaturan baru = permanen).
// - Form EDIT hanya untuk instansi QA (fixture batas.instansi.qa), dan nilai
//   awalnya WAJIB dikembalikan (pulihkan()) di after() + cleanup.
import { rx } from '../../helpers';

const ROUTE = '/setting/student-affairs/tahfidz-limit';
const LW = 'setting.student-affairs.tahfidz-limit.index';
const LW_TABEL = 'setting.student-affairs.tahfidz-limit.datatable';
const M = '#modal-tahfidz-limit.show';
const TABLE = 'table.rappasoft-datatable';

class PengaturanBatasPage {
  elements = {
    judulCard: () => cy.contains('h3.card-title', rx('Daftar Batas Tahfidz')),
    btnTambah: () => cy.contains('button', /Tambah Batas Tahfidz/),
    teksSemuaPunya: () => cy.get('.card-toolbar .text-muted'),
    headers: () => cy.get(`${TABLE} thead th`),
    rows: () => cy.get(`${TABLE} tbody tr`),
    kosong: () => cy.get(`${TABLE} tbody td[colspan]`),
    row: (instansi) => cy.contains(`${TABLE} tbody tr`, instansi),
    cari: () => cy.get(`${TABLE}`).closest('[wire\\:id]').find('input[wire\\:model="filters.search"]'),
    btnFilter: () => cy.get(`${TABLE}`).closest('[wire\\:id]').contains('button', /Filter/),
    filterInstansi: () => cy.get('select#filter-instansi'),
    filterBatas: () => cy.get('select#filter-batas_tahfidz'),
    perPage: () => cy.get('select#perPage'),

    modal: () => cy.get(M, { timeout: 15000 }),
    judulModal: () => cy.get(`${M} .modal-header h2`),
    // Sejak deploy a9e3c84c (7 Okt 2026, fix BUG-014) select Instansi = wire:model (live),
    // sebelumnya wire:model.defer. Keduanya diterima.
    instansiSelect: () => cy.get(`${M} select[wire\\:model="office"], ${M} select[wire\\:model\\.defer="office"]`),
    instansiDisabled: () => cy.get(`${M} input[type="text"][disabled]`),
    batasSelect: () => cy.get(`${M} select[wire\\:model\\.defer="tahfidz_limit"]`),
    metodeSelect: () => cy.get(`${M} select[wire\\:model\\.defer="page_numbering_method"]`),
    helperOf: (sel) => cy.get(`${M} ${sel}`).siblings('.form-text'),
    btnBatal: () => cy.get(`${M} .modal-footer button[wire\\:click="reset_field"]`),
    btnSimpan: () => cy.get(`${M} .modal-footer button[type="submit"]`),
  };

  intercept() {
    cy.intercept('POST', `**/livewire/message/${LW}`).as('lwPengaturan');
    cy.intercept('POST', `**/livewire/message/${LW_TABEL}`).as('lwPengaturanTabel');
    return this;
  }

  visit() {
    this.intercept();
    cy.visitRelative(ROUTE);
    this.elements.judulCard().should('be.visible');
    return this;
  }

  /** Nilai baris [Instansi, Batas, Metode, Dibuat Pada] (sinkron, dipakai di .should(cb)). */
  static barisData($table) {
    return Cypress.$.makeArray($table.find('tbody tr'))
      .filter((tr) => !Cypress.$(tr).find('td[colspan]').length)
      .map((tr) => Cypress.$(tr).find('td').toArray().slice(0, 4).map((td) => td.textContent.replace(/\s+/g, ' ').trim()));
  }

  bukaFilter() {
    this.elements.btnFilter().click();
    cy.get('ul.dropdown-menu.show[role="menu"]').should('be.visible');
    return this;
  }

  pilihFilter(selectGetter, value) {
    // Panel filter (Alpine) bisa tertutup setelah tabel re-render -> buka lagi bila perlu.
    cy.get('body').then(($b) => {
      if (!$b.find('ul.dropdown-menu.show[role="menu"]').length) this.bukaFilter();
    });
    selectGetter().select(value);
    cy.wait('@lwPengaturanTabel');
    cy.livewireIdle();
    return this;
  }

  cari(keyword) {
    this.elements.cari().clear();
    if (keyword) this.elements.cari().type(keyword);
    cy.wait('@lwPengaturanTabel');
    cy.livewireIdle();
    return this;
  }

  bukaTambah() {
    this.elements.btnTambah().click();
    cy.wait('@lwPengaturan');
    cy.livewireIdle();
    cy.modalStabil('#modal-tahfidz-limit');
    return this;
  }

  bukaEdit(instansi) {
    this.elements.row(instansi).find('td:last-child button').click();
    this.elements.row(instansi).find('.menu.show a.menu-link').contains(rx('Edit')).click();
    cy.wait('@lwPengaturan');
    cy.livewireIdle();
    cy.modalStabil('#modal-tahfidz-limit');
    this.elements.judulModal().should('have.text', 'Edit Batas Tahfidz');
    return this;
  }

  /** Pilih Instansi di form Tambah. wire:model live -> tunggu request & morph selesai. */
  pilihInstansi(nilai) {
    this.elements.instansiSelect().select(nilai);
    cy.livewireIdle();
    return this;
  }

  batal() {
    this.elements.btnBatal().click();
    cy.get(M).should('not.exist');
    return this;
  }

  /**
   * Simpan form EDIT (instansi QA saja). Menunggu request method
   * "submit_tahfidz_limit" lalu memastikan pesan sukses ada di response.
   */
  simpanEdit(pesan) {
    cy.aliasLivewireMethod(LW, 'submit_tahfidz_limit', 'lwSimpanBatas');
    this.elements.btnSimpan().click();
    cy.wait('@lwSimpanBatas', { timeout: 30000 }).then((i) => {
      cy.assertNotifDiResponse(i, '{"event":"modal-hide","data":{"modal":"modal-tahfidz-limit"}}');
      if (pesan) cy.assertNotifDiResponse(i, pesan);
    });
    cy.livewireIdle();
    cy.get(M).should('not.exist');
    return this;
  }

  /** Ubah pengaturan instansi QA lewat form Edit lalu simpan. */
  ubah(instansi, { batas, metode }, pesan) {
    this.visit().bukaEdit(instansi);
    if (batas) this.elements.batasSelect().select(batas);
    if (metode) this.elements.metodeSelect().select(metode);
    this.simpanEdit(pesan);
    return this;
  }

  /**
   * Kembalikan pengaturan instansi QA ke nilai awal (fixture). Aman dipanggil
   * berulang: kalau nilainya sudah sama, form ditutup tanpa menyimpan.
   */
  pulihkan(qa, pesan) {
    this.visit();
    this.elements.row(qa.nama).should('exist');
    this.bukaEdit(qa.nama);
    cy.get(M).then(($m) => {
      const b = $m.find('select[wire\\:model\\.defer="tahfidz_limit"]').val();
      const mt = $m.find('select[wire\\:model\\.defer="page_numbering_method"]').val();
      if (b === qa.awal.batas && mt === qa.awal.metode) {
        cy.log('Pengaturan instansi QA sudah sesuai nilai awal');
        this.batal();
        return;
      }
      this.elements.batasSelect().select(qa.awal.batas);
      this.elements.metodeSelect().select(qa.awal.metode);
      this.simpanEdit(pesan);
    });
    return this;
  }

  /** Assert baris instansi = nilai tertentu (setelah reload). */
  assertBaris(instansi, labelBatas, labelMetode) {
    this.elements.row(instansi).find('td').eq(1).should(($td) => expect($td.text().trim()).to.eq(labelBatas));
    if (labelMetode !== undefined) {
      this.elements.row(instansi).find('td').eq(2).should(($td) => expect($td.text().trim()).to.eq(labelMetode));
    }
    return this;
  }
}

export default new PengaturanBatasPage();
export { PengaturanBatasPage as PengaturanBatasPageClass };
