// TahfidzDetailPage — Detail program tahfidz /student-affairs/tahfidz/detail/{id}
// (card info program + list anggota).
//
// VERIFIED lewat element analysis #1 (5 Okt 2026, bagian C).
// - Baris anggota: tr[wire:key="table-row-{memberId}"].
// - Menu Aksi = Alpine (x-data open) -> div.menu dapat class .show.
// - Menu Aksi baris anggota saat ini: Detail, Hapus (TIDAK ada Tambah Riwayat, lihat Q1).
// - Halaman ini melempar "SyntaxError: Invalid or unexpected token" di console
//   (dicatat oleh e2e.js, tidak menggagalkan test).
import { rx, route } from '../../helpers';

const ROUTE = '/student-affairs/tahfidz/detail/{tahfidzId}';
const LW_MEMBER = 'student-affairs.tahfidz.datatable.member-datatable';
const LW_DETAIL = 'student-affairs.tahfidz.detail';

class TahfidzDetailPage {
  elements = {
    cardInfo: () => cy.get('.card.shadow-sm.mb-5'),
    // Kolom cari list anggota (rappasoft, wire:model tanpa debounce).
    cari: () => cy.get('table.rappasoft-datatable').closest('[wire\\:id]').find('input[wire\\:model="filters.search"]'),
    namaProgram: () => cy.get('.card.shadow-sm.mb-5 h2'),
    batasTahfidz: () => cy.get('.card.shadow-sm.mb-5 .badge.badge-light-primary'),
    memberRow: (memberId) => cy.get(`tr[wire\\:key="table-row-${memberId}"]`),
    memberNama: (memberId) => cy.get(`tr[wire\\:key="table-row-${memberId}"] a.text-gray-800.fw-bold`),
    memberAksiBtn: (memberId) => cy.get(`tr[wire\\:key="table-row-${memberId}"] td:last-child button`),
    memberMenu: (memberId) => cy.get(`tr[wire\\:key="table-row-${memberId}"] .menu.show`),
    memberPencapaian: (memberId) => cy.get(`tr[wire\\:key="table-row-${memberId}"] td`).eq(3),
    memberBatas: (memberId) => cy.get(`tr[wire\\:key="table-row-${memberId}"] td`).eq(2),
  };

  visit(tahfidzId) {
    cy.visitRelative(route(ROUTE, { tahfidzId }));
    this.elements.cardInfo().should('be.visible');
    return this;
  }

  /**
   * Saring list anggota lewat kolom Cari (nama / no kartu) supaya baris siswa
   * tampil walau program bertipe Masal dengan ratusan anggota (10 per halaman).
   * Program QAAUTO Juz Ayat #247 = Masal (probe 6 Okt 2026).
   */
  cariAnggota(keyword) {
    cy.intercept('POST', `**/livewire/message/${LW_MEMBER}`).as('lwAnggota');
    this.elements.cari().clear().type(keyword);
    cy.wait('@lwAnggota');
    cy.livewireIdle();
    cy.get('table tbody').should('contain', keyword);
    return this;
  }

  /** Buka Detail program dan saring sampai baris siswa tampil. */
  visitAnggota(tahfidzId, namaSiswa) {
    this.visit(tahfidzId);
    if (namaSiswa) this.cariAnggota(namaSiswa);
    return this;
  }

  bukaAksiAnggota(memberId) {
    this.elements.memberAksiBtn(memberId).click();
    this.elements.memberMenu(memberId).should('be.visible');
    return this;
  }

  /** Teks item menu Aksi yang sedang terbuka (sinkron, urut DOM). */
  itemAksiAnggota(memberId) {
    return this.elements
      .memberMenu(memberId)
      .find('a.menu-link')
      .then(($a) => Cypress.$.makeArray($a).map((el) => el.textContent.trim()));
  }

  klikAksiAnggota(memberId, item) {
    this.bukaAksiAnggota(memberId);
    this.elements.memberMenu(memberId).find('a.menu-link').contains(rx(item)).click();
    return this;
  }

  // ------------------------------------------------------------------ Filter Batas Tahfidz
  // VERIFIED element analysis #3 (I): tombol "Filter" (Alpine) -> ul.dropdown-menu.show
  // berisi select#filter-batas_<step> (wire:model filters.batas_<step>). Tingkat berikutnya
  // (mis. Halaman) baru muncul setelah tingkat sebelumnya dipilih.
  bukaFilter() {
    cy.get('table.rappasoft-datatable').closest('[wire\\:id]').contains('button', /Filter/).click();
    cy.get('ul.dropdown-menu.show[role="menu"]').should('be.visible');
    return this;
  }

  filterSelect(step) {
    return cy.get(`select#filter-batas_${step}`);
  }

  /** Buka panel filter hanya bila sedang tertutup (bisa tertutup setelah tabel re-render). */
  pastikanFilterTerbuka() {
    cy.get('body').then(($b) => {
      if (!$b.find('ul.dropdown-menu.show[role="menu"]').length) this.bukaFilter();
    });
    return this;
  }

  /** Label filter yang tampil, urut DOM (mis. ['Juz'] atau ['Juz', 'Halaman']). */
  labelFilter() {
    this.pastikanFilterTerbuka();
    return cy
      .get('ul.dropdown-menu.show[role="menu"]')
      .find('label')
      .then(($l) => Cypress.$.makeArray($l).map((el) => el.textContent.trim()));
  }

  /**
   * Pilih nilai filter Batas Tahfidz. Request member-datatable WAJIB 200:
   * element analysis #3 menemukan HTTP 500 intermiten (calon bug) — dibiarkan
   * gagal dengan pesan jelas, bukan disembunyikan.
   */
  pilihFilterBatas(step, value) {
    cy.intercept('POST', `**/livewire/message/${LW_MEMBER}`).as('lwFilter');
    this.pastikanFilterTerbuka();
    this.filterSelect(step).select(String(value));
    cy.wait('@lwFilter').then((i) => {
      if (i.response.statusCode !== 200) {
        // Evidence: kutip isi response error (pesan exception bila APP_DEBUG aktif).
        const body = typeof i.response.body === 'string' ? i.response.body : JSON.stringify(i.response.body);
        const pesan = (body.match(/"message"\s*:\s*"([^"]{0,400})/) || [])[1] || body.replace(/\s+/g, ' ').slice(0, 400);
        Cypress.log({ name: 'filter-500', message: pesan });
        // eslint-disable-next-line no-console
        console.log('[filter-500]', body.slice(0, 4000));
        expect(i.response.statusCode, `filter ${step}=${value} -> ${pesan}`).to.eq(200);
      }
    });
    cy.livewireIdle();
    return this;
  }

  /** Kode member (wire:key table-row-<id>) yang tampil di list anggota. */
  anggotaTampil() {
    return cy.get('table.rappasoft-datatable tbody').then(($b) =>
      Cypress.$.makeArray($b.find('tr[wire\\:key^="table-row-"]')).map((tr) =>
        Number(tr.getAttribute('wire:key').replace('table-row-', '')),
      ),
    );
  }

  /** Teks kolom Batas Tahfidz anggota (posisi terakhir), dinormalisasi. */
  batasAnggota(memberId) {
    return this.elements.memberBatas(memberId).invoke('text').then((t) => t.replace(/\s+/g, ' ').trim());
  }

  /** Klik avatar/foto anggota (link pertama di kolom nama). */
  klikFotoAnggota(memberId) {
    cy.get(`tr[wire\\:key="table-row-${memberId}"] a.symbol`).click();
    return this;
  }

  klikNamaAnggota(memberId) {
    this.elements.memberNama(memberId).click();
    return this;
  }

  // ------------------------------------------------------------------ Tambah / Hapus anggota
  // Crosschecked source origin/staging: student-affairs/tahfidz/detail.blade.php (modal
  // #modal-add-member berisi livewire utilities.search-no-card; #modal-remove-member),
  // Detail.php addMember() (MENGIRIM notifikasi 'Tahfidz Baru') / removeMember() (tanpa notifikasi).
  tambahAnggota(nama) {
    cy.intercept('POST', '**/livewire/message/utilities.search-no-card').as('lwCariSiswa');
    cy.intercept('POST', `**/livewire/message/${LW_DETAIL}`).as('lwDetail');
    cy.get('button[wire\\:click="show_add_member_modal"]').click();
    cy.wait('@lwDetail');
    cy.modalStabil('#modal-add-member');
    cy.get('#modal-add-member.show input[wire\\:model\\.debounce\\.500ms="term"]').clear().type(nama);
    cy.wait('@lwCariSiswa');
    cy.livewireIdle();
    cy.contains('#modal-add-member.show .menu-link[wire\\:click^="setMemberCard"]', nama).click();
    cy.livewireIdle();
    cy.aliasLivewireMethod(LW_DETAIL, 'addMember', 'lwAddMember');
    cy.get('#modal-add-member.show .modal-footer button[type="submit"]').click();
    cy.wait('@lwAddMember', { timeout: 30000 }).then((i) =>
      cy.assertNotifDiResponse(i, '{"event":"modal-hide","data":{"modal":"modal-add-member"}}'),
    );
    cy.livewireIdle();
    return this;
  }

  /** Hapus anggota dari program lewat Aksi > Hapus (baris harus tampil). */
  hapusAnggota(memberId) {
    cy.intercept('POST', `**/livewire/message/${LW_DETAIL}`).as('lwDetail');
    this.klikAksiAnggota(memberId, 'Hapus');
    cy.wait('@lwDetail');
    cy.modalStabil('#modal-remove-member');
    cy.aliasLivewireMethod(LW_DETAIL, 'removeMember', 'lwRemoveMember');
    cy.get('#modal-remove-member.show .modal-footer button[type="submit"]').click();
    cy.wait('@lwRemoveMember', { timeout: 30000 }).then((i) =>
      cy.assertNotifDiResponse(i, '{"event":"modal-hide","data":{"modal":"modal-remove-member"}}'),
    );
    cy.livewireIdle();
    return this;
  }

  /** "0% (0 dari 6236 ayat)" */
  pencapaianAnggota(memberId) {
    return this.elements
      .memberPencapaian(memberId)
      .invoke('text')
      .then((t) => t.replace(/\s+/g, ' ').trim());
  }
}

export default new TahfidzDetailPage();
