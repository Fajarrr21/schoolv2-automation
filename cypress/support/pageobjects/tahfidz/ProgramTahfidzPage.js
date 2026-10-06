// ProgramTahfidzPage — Kesiswaan > Tahfidz (list program + modal Tambah/Edit program)
// /student-affairs/tahfidz
//
// VERIFIED element analysis #1 (B) & #3 (H) + source origin/staging
// (StudentAffairs/Tahfidz/Index.php, index.blade.php).
//
// PENTING:
// - Form TAMBAH hanya dibuka & diperiksa lalu Batal. JANGAN disimpan: create
//   mengirim notifikasi "Tahfidz Baru" ke siswa/orang tua (TahfidzRepository::create).
// - Form EDIT boleh disimpan HANYA untuk program QA (fixture batas.programs),
//   dan nilai awal dikembalikan. Edit tidak mengirim notifikasi.
// - Simpan = submit() -> emit('doSubmit') -> request kedua (fireEvent doSubmit)
//   yang membawa dispatch modal-hide + flash.
import { rx, route } from '../../helpers';

const ROUTE = '/student-affairs/tahfidz';
const LW = 'student-affairs.tahfidz.index';
const LW_TABEL = 'student-affairs.tahfidz.datatable';
const M = '#modal-tahfidz.show';

class ProgramTahfidzPage {
  elements = {
    btnTambah: () => cy.get('button[wire\\:click="modalForm(\'create\')"]'),
    cari: () => cy.get('table.rappasoft-datatable').closest('[wire\\:id]').find('input[wire\\:model="filters.search"]'),
    row: (id) => cy.get(`tr[wire\\:key="table-row-${id}"]`),
    namaLink: (id) => cy.get(`tr[wire\\:key="table-row-${id}"] td:first-child a`),
    aksiBtn: (id) => cy.get(`tr[wire\\:key="table-row-${id}"] td:last-child button`),
    aksiMenu: (id) => cy.get(`tr[wire\\:key="table-row-${id}"] .menu.show`),
    checkboxBaris: () => cy.get('table.rappasoft-datatable tbody input[type="checkbox"]'),

    modal: () => cy.get(M, { timeout: 15000 }),
    judulModal: () => cy.get(`${M} .modal-header h2`),
    instansi: () => cy.get(`${M} select[wire\\:model="office"]`),
    instansiDisabled: () => cy.get(`${M} input[wire\\:model\\.defer="office_name"]`),
    tipe: (v) => cy.get(`${M} input[type="radio"][wire\\:model="type"][value="${v}"]`),
    jenis: (v) => cy.get(`${M} input[type="radio"][wire\\:model="tahfidz_type"][value="${v}"]`),
    batasSelect: () => cy.get(`${M} select[wire\\:model\\.defer="tahfidz_limit"]`),
    batasTerkunci: () => cy.contains(`${M} label`, rx('Batas Tahfidz')).parent().find('input[disabled]'),
    batasHelper: () => cy.contains(`${M} label`, rx('Batas Tahfidz')).parent().find('.form-text'),
    notifInfo: () => cy.get(`${M} .alert`),
    btnBatal: () => cy.get(`${M} .modal-footer button[wire\\:click="reset_field"]`),
    btnSimpan: () => cy.get(`${M} .modal-footer button[type="submit"]`),
  };

  intercept() {
    cy.intercept('POST', `**/livewire/message/${LW}`).as('lwProgram');
    cy.intercept('POST', `**/livewire/message/${LW_TABEL}`).as('lwProgramTabel');
    return this;
  }

  visit() {
    this.intercept();
    cy.visitRelative(ROUTE);
    this.elements.btnTambah().should('be.visible');
    return this;
  }

  /** Saring list program supaya baris program tertentu tampil (10 baris/halaman). */
  cariProgram(nama) {
    this.elements.cari().clear().type(nama);
    cy.wait('@lwProgramTabel');
    cy.livewireIdle();
    cy.get('table.rappasoft-datatable tbody').should('contain', nama);
    return this;
  }

  /** Nilai select Batas Tahfidz = PROPERTY value (bukan atribut selected; keduanya bisa beda, EA#3 no. 3). */
  nilaiBatas() {
    return this.elements.batasSelect().invoke('val');
  }

  /** Daftar value opsi Batas Tahfidz (sinkron untuk .should). */
  static opsiBatas($sel) {
    return Cypress.$.makeArray($sel.find('option')).map((o) => o.value);
  }

  bukaTambah() {
    this.elements.btnTambah().click();
    cy.wait('@lwProgram');
    cy.livewireIdle();
    cy.modalStabil('#modal-tahfidz');
    this.elements.judulModal().should('have.text', 'Tambah Program Tahfidz');
    return this;
  }

  /** Pilih instansi (wire:model live -> request + default Batas Tahfidz terisi). */
  pilihInstansi(nama) {
    this.elements.instansi().select(nama);
    cy.wait('@lwProgram');
    cy.livewireIdle();
    return this;
  }

  /** Pilih Jenis Tahfidz (radio wire:model live). EA#3 no. 2: tunggu response sebelum assert. */
  pilihJenis(jenis) {
    // Radio yang sudah tercentang (mis. Jenis Juz = default) tidak mengirim request.
    this.elements.jenis(jenis).then(($r) => {
      if ($r.is(':checked')) return;
      cy.wrap($r).check();
      cy.wait('@lwProgram');
    });
    cy.livewireIdle();
    this.elements.jenis(jenis).should('be.checked');
    return this;
  }

  pilihTipe(tipe) {
    this.elements.tipe(tipe).then(($r) => {
      if ($r.is(':checked')) return;
      cy.wrap($r).check();
      cy.wait('@lwProgram');
    });
    cy.livewireIdle();
    return this;
  }

  bukaEdit(id, nama) {
    this.cariProgram(nama);
    this.elements.aksiBtn(id).click();
    this.elements.aksiMenu(id).find('a.menu-link').contains(rx('Edit')).click();
    cy.wait('@lwProgram');
    cy.livewireIdle();
    cy.modalStabil('#modal-tahfidz');
    this.elements.judulModal().should('have.text', 'Edit Program Tahfidz');
    return this;
  }

  batal() {
    this.elements.btnBatal().click();
    cy.get(M).should('not.exist');
    return this;
  }

  /** Simpan form EDIT program QA: tunggu request fireEvent doSubmit (yang membawa modal-hide). */
  simpanEdit(pesan) {
    cy.aliasLivewireMethod(LW, 'doSubmit', 'lwDoSubmit');
    this.elements.btnSimpan().click();
    cy.wait('@lwDoSubmit', { timeout: 30000 }).then((i) => {
      cy.assertNotifDiResponse(i, '{"event":"modal-hide","data":{"modal":"modal-tahfidz"}}');
      if (pesan) cy.assertNotifDiResponse(i, pesan);
    });
    cy.livewireIdle();
    cy.get(M).should('not.exist');
    return this;
  }

  /** Ubah Batas Tahfidz program QA (tanpa riwayat) lalu simpan. */
  ubahBatasProgram(program, batas, pesan) {
    this.visit().bukaEdit(program.id, program.nama);
    this.elements.batasSelect().select(batas);
    this.simpanEdit(pesan);
    return this;
  }

  bukaDetailLewatNama(id, nama) {
    this.cariProgram(nama);
    this.elements.namaLink(id).click();
    cy.location('pathname').should('eq', route('/student-affairs/tahfidz/detail/{id}', { id }));
    return this;
  }

  bukaDetailLewatAksi(id, nama) {
    this.cariProgram(nama);
    this.elements.aksiBtn(id).click();
    this.elements.aksiMenu(id).find('a.menu-link').contains(rx('Detail')).click();
    cy.location('pathname').should('eq', route('/student-affairs/tahfidz/detail/{id}', { id }));
    return this;
  }
}

export default new ProgramTahfidzPage();
