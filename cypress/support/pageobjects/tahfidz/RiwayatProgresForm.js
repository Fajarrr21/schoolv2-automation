// RiwayatProgresForm — modal Tambah/Edit Riwayat Progress (#modal-progress).
//
// VERIFIED lewat element analysis #2 (6 Okt 2026) di Detail Siswa
// /student-affairs/tahfidz/detail/247/member/1082, cross-check source
// resources/views/student-affairs/tahfidz/member-detail.blade.php (origin/staging).
//
// Catatan perilaku V2 yang memengaruhi cara POM ini ditulis:
// - SEMUA aksi di modal = 1 POST /livewire/message/student-affairs.tahfidz.member-detail.
//   Alias '@lwSiswa' dipasang interceptLivewire(); setiap method menunggu alias itu
//   (tanpa cy.wait(<angka>)).
// - Dropdown step (Pilih Juz/Halaman/Surah) MENUTUP SENDIRI setiap re-render
//   Livewire, walau data-bs-auto-close="outside". Maka bukaStep() selalu dipanggil
//   sebelum klik opsi.
// - wire:key step berubah tiap render (step-juz-1 -> step-juz-2) -> pakai prefix ^=.
// - Label opsi halaman tidak stabil ("Juz 16 - Halaman 11" vs "Halaman 11") ->
//   anchor = value mushaf absolut di wire:click toggleStepValue('halaman', 312).
// - Popup "Ganti Pilihan?" & "Hapus Semua Ayat Terpilih?" = overlay div.position-fixed
//   di dalam modal (bukan .modal, bukan SweetAlert) -> anchor tombol wire:click.
// - Daftar Ayat dirender 60 per surat; lanjutannya lewat tombol
//   showMoreUnits('<surahId>') "Muat ayat berikutnya".
// - Modal #modal-progress SELALU ada di DOM -> cek terbuka lewat .show.
import { rx, sortKeys } from '../../helpers';

const LW_COMPONENT = 'student-affairs.tahfidz.member-detail';
const LW = '@lwSiswa';
const M = '#modal-progress.show';

class RiwayatProgresForm {
  elements = {
    modal: () => cy.get(M, { timeout: 15000 }),
    modalApaPun: () => cy.get('#modal-progress'),
    judul: () => cy.get(`${M} .modal-header h2`),
    labelCapaian: () => cy.contains(`${M} label`, rx('Capaian Hafalan')),
    labelTanggal: () => cy.contains(`${M} label`, rx('Tanggal')),
    labelDeskripsi: () => cy.contains(`${M} label`, rx('Deskripsi')),
    labelTandai: () => cy.get(`${M} label.form-label`).filter(':contains("yang sudah hafal")'),

    // --- Step dropdown (juz | halaman | surah) ---
    step: (step) => cy.get(`${M} [wire\\:key^="step-${step}"]`),
    stepLabel: (step) => cy.get(`${M} [wire\\:key^="step-${step}"] > label`),
    stepToggle: (step) => cy.get(`${M} [wire\\:key^="step-${step}"] > .dropdown > button`),
    stepMenu: (step) => cy.get(`${M} [wire\\:key^="step-${step}"] .dropdown-menu`),
    stepCari: (step) => cy.get(`${M} input[wire\\:model\\.debounce\\.300ms="step_search.${step}"]`),
    stepOpsi: (step, value) => cy.get(`${M} input[wire\\:click="toggleStepValue('${step}', ${value})"]`),
    stepOpsiSemua: (step) => cy.get(`${M} input[wire\\:click^="toggleStepValue('${step}',"]`),
    stepKosong: (step) => cy.get(`${M} [wire\\:key^="step-${step}"] .dropdown-menu .text-muted.fs-7`),
    chipHapus: (step, value) => cy.get(`${M} [wire\\:click="removeStepValue('${step}', ${value})"]`),
    chips: (step) => cy.get(`${M} [wire\\:key^="step-${step}"] .badge.bg-light-primary`),

    // --- Toolbar section ---
    cariAyat: () => cy.get(`${M} input[wire\\:model\\.debounce\\.300ms="unit_search"]`),
    btnRentang: () => cy.get(`${M} button[wire\\:click="toggleRangePanel"]`),
    btnPilihSemua: () => cy.get(`${M} button[wire\\:click="markAllVisibleUnits"]`),
    btnHapusSemua: () => cy.get(`${M} button[wire\\:click="askClearMarkedUnits"]`),

    // --- Panel rentang ---
    dari: () => cy.get(`${M} select[wire\\:model="range_from"]`),
    sampai: () => cy.get(`${M} select[wire\\:model="range_to"]`),
    terapkan: () => cy.get(`${M} button[wire\\:click="applyRange"]`),
    keteranganRentang: () => cy.get(`${M} select[wire\\:model="range_from"]`).closest('.border.rounded').find('.fs-7.text-gray-700'),

    // --- Ayat Terpilih ---
    terpilihBox: () => cy.get(`${M} .border.rounded.p-3.mb-3`),
    terpilihJumlah: () => cy.get(`${M} .border.rounded.p-3.mb-3 span.fs-7.fw-bold.text-gray-700`),
    terpilihBadgeSurat: () => cy.get(`${M} .border.rounded.p-3.mb-3 .badge.badge-light-primary`),
    terpilihScroll: () => cy.get(`${M} .border.rounded.p-3.mb-3 > div`).last(),
    terpilihHapus: (k) => cy.get(`${M} [wire\\:click="unmarkUnit('${k}')"]`),

    // --- Daftar Ayat ---
    daftar: () => cy.get(`${M} [wire\\:loading\\.remove][wire\\:target*="unit_search"]`),
    daftarScroll: () => cy.get(`${M} [wire\\:loading\\.remove][wire\\:target*="unit_search"] > .border.rounded.p-4`),
    unitItem: (k) => cy.get(`${M} [wire\\:key="unit-${k}"]`),
    unitCheckbox: (k) => cy.get(`${M} [wire\\:key="unit-${k}"] input[type="checkbox"]`),
    unitLock: (k) => cy.get(`${M} [wire\\:key="unit-${k}"] i.la-lock`),
    muatBerikutnya: (surah) => cy.get(`${M} button[wire\\:click="showMoreUnits('${surah}')"]`),
    loadingDaftar: () => cy.get(`${M} [wire\\:loading][wire\\:target*="unit_search"]`),

    // --- Popup (overlay di dalam modal) ---
    popup: () => cy.get(`${M} .position-fixed .bg-white.rounded`),
    gantiBatal: () => cy.get(`${M} button[wire\\:click="cancelChangeChoice"]`),
    gantiOk: () => cy.get(`${M} button[wire\\:click="confirmChangeChoice"]`),
    hapusSemuaBatal: () => cy.get(`${M} button[wire\\:click="cancelClearMarkedUnits"]`),
    hapusSemuaOk: () => cy.get(`${M} button[wire\\:click="clearMarkedUnits"]`),

    // --- Field & footer ---
    tanggal: () => cy.get(`${M} input[type="date"][wire\\:model\\.defer="activity_date"]`),
    deskripsi: () => cy.get(`${M} input[wire\\:model\\.defer="description"]`),
    btnBatal: () => cy.get(`${M} .modal-footer button[wire\\:click="reset_field"]`),
    btnSimpan: () => cy.get(`${M} .modal-footer button[type="submit"]`),
  };

  /** Pasang alias Livewire komponen Detail Siswa. Panggil di beforeEach. */
  interceptLivewire() {
    cy.intercept('POST', `**/livewire/message/${LW_COMPONENT}`).as('lwSiswa');
    return this;
  }

  assertTerbuka(mode = 'Tambah') {
    this.elements.modal().should('be.visible');
    cy.modalStabil('#modal-progress');
    this.elements.judul().should(($h) => expect($h.text().trim()).to.eq(`${mode} Riwayat Progress`));
    return this;
  }

  assertTertutup() {
    cy.get(M).should('not.exist');
    return this;
  }

  // ------------------------------------------------------------------ Step
  /**
   * Buka dropdown step kalau belum terbuka (dropdown tertutup sendiri tiap
   * re-render Livewire). Menunggu Livewire idle dulu supaya morph yang tertunda
   * tidak menutupnya lagi sesudah dibuka.
   */
  bukaStep(step) {
    cy.livewireIdle();
    this.elements.stepMenu(step).then(($m) => {
      if (!$m.hasClass('show')) this.elements.stepToggle(step).click();
    });
    this.elements.stepMenu(step).should('have.class', 'show').and('be.visible');
    return this;
  }

  /**
   * Klik elemen DI DALAM dropdown step dengan pemulihan: tepat sebelum klik,
   * dropdown diperiksa sinkron; kalau ternyata tertutup lagi (run 6 Okt 2026:
   * kadang tertutup sesudah dibuka), dibuka ulang lalu diperiksa lagi — maks 4x.
   * Tanpa {force: true} dan tanpa jeda angka.
   *
   * @param {string} step
   * @param {string} selector  selector elemen di dalam modal (opsi / input cari)
   * @param {Function} aksi    ($el) => perintah Cypress terhadap elemen
   */
  dalamDropdown(step, selector, aksi, sisa = 4) {
    cy.livewireIdle();
    cy.get(M).then(($m) => {
      const $menu = $m.find(`[wire\\:key^="step-${step}"] .dropdown-menu`);
      const $el = $m.find(selector);
      if (!$el.length) throw new Error(`Elemen dropdown ${step} tidak ditemukan: ${selector}`);
      if ($menu.hasClass('show') && $menu.is(':visible')) {
        aksi(cy.wrap($el.first()));
        return;
      }
      if (sisa <= 0) throw new Error(`Dropdown Pilih ${step} tidak bisa dibuka setelah beberapa percobaan.`);
      if (!$menu.hasClass('show')) cy.wrap($m.find(`[wire\\:key^="step-${step}"] > .dropdown > button`)).click();
      this.dalamDropdown(step, selector, aksi, sisa - 1);
    });
    return this;
  }

  tutupStep(step) {
    this.elements.stepMenu(step).then(($m) => {
      if ($m.hasClass('show')) this.elements.stepToggle(step).click();
    });
    return this;
  }

  /**
   * Klik opsi step (centang ATAU lepas — wire:click toggleStepValue).
   * Satu klik = satu request Livewire.
   */
  klikStep(step, value) {
    const chip = `[wire\\:click="removeStepValue('${step}', ${value})"]`;
    cy.livewireIdle();
    cy.get(M).then(($m) => {
      const adaSebelum = $m.find(chip).length > 0;
      this.dalamDropdown(step, `input[wire\\:click="toggleStepValue('${step}', ${value})"]`, (el) => el.click());
      cy.wait(LW);
      cy.livewireIdle();
      // Bukti DOM bahwa morph Livewire sudah selesai (bukan cuma response tiba):
      // chip berubah, ATAU step disembunyikan (auto-pilih), ATAU popup Ganti Pilihan.
      cy.get(M).should(($n) => {
        const stepHilang = $n.find(`[wire\\:key^="step-${step}"]`).length === 0;
        const popup = $n.find('button[wire\\:click="cancelChangeChoice"]').length > 0;
        const adaSesudah = $n.find(chip).length > 0;
        expect(stepHilang || popup || adaSesudah !== adaSebelum, `pilihan ${step} ${value} sudah ter-render`).to.eq(true);
      });
    });
    return this;
  }

  /** Centang beberapa nilai pada step (yang belum tercentang saja). */
  pilihStep(step, values) {
    [].concat(values).forEach((v) => {
      cy.livewireIdle();
      this.elements.stepOpsi(step, v).then(($cb) => {
        if (!$cb.is(':checked')) this.klikStep(step, v);
      });
    });
    // Sejak deploy staging 2a2a430e (6 Okt 2026) dropdown TIDAK lagi tertutup
    // sendiri saat re-render (wire:ignore.self), sehingga panelnya menutupi
    // tombol section. Tutup eksplisit sesudah selesai memilih (bila step masih ada).
    cy.get(M).then(($m) => {
      if ($m.find(`[wire\\:key^="step-${step}"] .dropdown-menu.show`).length) this.tutupStep(step);
    });
    return this;
  }

  /** Lepas lewat ikon x di chip. */
  hapusChip(step, value) {
    this.elements.chipHapus(step, value).click();
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  /** Ketik di kolom cari dropdown step (debounce 300ms -> 1 request). */
  cariStep(step, keyword) {
    const sel = `input[wire\\:model\\.debounce\\.300ms="step_search.${step}"]`;
    this.dalamDropdown(step, sel, (el) => (keyword ? el.clear().type(keyword) : el.clear()));
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  /** Nilai (value mushaf / nomor) seluruh opsi step yang sedang dirender. */
  nilaiOpsiStep(step) {
    return this.elements.stepOpsiSemua(step).then(($i) =>
      Cypress.$.makeArray($i).map((el) => Number(el.getAttribute('wire:click').match(/,\s*(\d+)\)/)[1])),
    );
  }

  /** Nilai chip yang tampil pada step. */
  nilaiChip(step) {
    return cy.get(M).then(($m) =>
      Cypress.$.makeArray($m.find(`[wire\\:click^="removeStepValue('${step}',"]`)).map((el) =>
        Number(el.getAttribute('wire:click').match(/,\s*(\d+)\)/)[1]),
      ),
    );
  }

  // ------------------------------------------------------------------ Ayat
  /** Klik "Muat ayat berikutnya" pada kelompok surat sampai kunci ayat ter-render. */
  muatSampaiTampil(k, sisa = 3) {
    const surah = k.split(':')[0];
    cy.get(M).then(($m) => {
      if ($m.find(`[wire\\:key="unit-${k}"]`).length) return;
      if (sisa <= 0) throw new Error(`Ayat ${k} tidak ter-render setelah "Muat ayat berikutnya".`);
      this.elements.muatBerikutnya(surah).click();
      cy.wait(LW);
      cy.livewireIdle();
      this.muatSampaiTampil(k, sisa - 1);
    });
    return this;
  }

  /** Centang ayat satu per satu lewat checkbox Daftar Ayat. */
  /**
   * Centang ayat satu per satu. Sesudah tiap centang ditunggu BUKTI DOM (ayat
   * masuk Ayat Terpilih) sebelum aksi berikutnya. Alasan (run 6 Okt 2026):
   * Livewire v2 mengantrekan aksi selama request lain berjalan dan menghitung
   * nilai checkbox dari data klien; centang yang terlalu cepat sesudah Terapkan
   * memakai data lama sehingga hasil rentang tertimpa.
   */
  centangAyat(list) {
    [].concat(list).forEach((k) => {
      this.muatSampaiTampil(k);
      cy.livewireIdle();
      this.elements.unitCheckbox(k).check();
      cy.wait(LW);
      cy.livewireIdle();
      cy.get(M).should(($m) => {
        expect(RiwayatProgresForm.terpilihKeys($m), `${k} masuk Ayat Terpilih`).to.include(k);
      });
    });
    return this;
  }

  lepasAyat(list) {
    [].concat(list).forEach((k) => {
      cy.livewireIdle();
      this.elements.unitCheckbox(k).uncheck();
      cy.wait(LW);
      cy.livewireIdle();
      cy.get(M).should(($m) => {
        expect(RiwayatProgresForm.terpilihKeys($m), `${k} keluar dari Ayat Terpilih`).not.to.include(k);
      });
    });
    return this;
  }

  cariAyat(keyword) {
    this.elements.cariAyat().clear();
    if (keyword) this.elements.cariAyat().type(String(keyword));
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  kosongkanCariAyat() {
    this.elements.cariAyat().clear();
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  pilihSemua() {
    this.elements.btnPilihSemua().click();
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  /** Klik Hapus Semua Ayat Terpilih lalu konfirmasi ('ok' | 'batal' | null = biarkan popup). */
  hapusSemua(jawab = 'ok') {
    this.elements.btnHapusSemua().click();
    cy.wait(LW);
    cy.livewireIdle();
    if (jawab === 'ok') {
      this.elements.hapusSemuaOk().click();
      cy.wait(LW);
      cy.livewireIdle();
    } else if (jawab === 'batal') {
      this.elements.hapusSemuaBatal().click();
      cy.wait(LW);
      cy.livewireIdle();
    }
    return this;
  }

  hapusTerpilih(k) {
    this.elements.terpilihHapus(k).click();
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  // ------------------------------------------------------------------ Popup Ganti Pilihan
  gantiPilihan(jawab = 'ok') {
    (jawab === 'ok' ? this.elements.gantiOk() : this.elements.gantiBatal()).click();
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  // ------------------------------------------------------------------ Rentang
  bukaRentang() {
    cy.get(M).then(($m) => {
      if (!$m.find('select[wire\\:model="range_from"]').length) {
        this.elements.btnRentang().click();
        cy.wait(LW);
        cy.livewireIdle();
      }
    });
    this.elements.dari().should('exist');
    return this;
  }

  /** Tutup panel (toggle) kalau sedang terbuka. */
  tutupRentang() {
    cy.get(M).then(($m) => {
      if ($m.find('select[wire\\:model="range_from"]').length) {
        this.elements.btnRentang().click();
        cy.wait(LW);
        cy.livewireIdle();
      }
    });
    return this;
  }

  pilihDari(k) {
    this.elements.dari().select(k);
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  pilihSampai(k) {
    this.elements.sampai().select(k);
    cy.wait(LW);
    cy.livewireIdle();
    return this;
  }

  /**
   * Terapkan rentang lalu tunggu BUKTI DOM: keterangan hasil rentang
   * (range_notice) muncul. Keterangan dikosongkan server setiap Dari/Sampai
   * diubah, dan selalu diisi lagi oleh applyRange, jadi kemunculannya menandai
   * response Terapkan sudah diproses.
   */
  klikTerapkan() {
    cy.livewireIdle();
    this.elements.terapkan().click();
    cy.wait(LW);
    cy.livewireIdle();
    this.elements.keteranganRentang().should('exist').and(($d) => expect($d.text().trim()).not.to.eq(''));
    return this;
  }

  /** Buka panel (kalau perlu), isi Dari & Sampai, Terapkan. */
  terapkanRentang(dari, sampai) {
    this.bukaRentang().pilihDari(dari).pilihSampai(sampai).klikTerapkan();
    return this;
  }

  /**
   * Tandai kumpulan ayat secepat mungkin untuk SETUP data: run berurutan >= 2
   * ayat lewat rentang (tidak terkena batas render 60), sisanya checkbox.
   */
  tandaiAyat(list) {
    const runs = [];
    sortKeys(list).forEach((k) => {
      const [s, a] = k.split(':').map(Number);
      const last = runs[runs.length - 1];
      if (last && last.s === s && last.to === a - 1) last.to = a;
      else runs.push({ s, from: a, to: a });
    });
    runs.forEach((r) => {
      if (r.to > r.from) this.terapkanRentang(`${r.s}:${r.from}`, `${r.s}:${r.to}`);
      else this.centangAyat(`${r.s}:${r.from}`);
    });
    return this;
  }

  // ------------------------------------------------------------------ Baca state (sinkron, untuk .should(cb))
  /** Kunci ayat di Ayat Terpilih, urut sesuai tampilan. */
  static terpilihKeys($m) {
    return Cypress.$.makeArray($m.find('[wire\\:click^="unmarkUnit("]')).map(
      (el) => el.getAttribute('wire:click').match(/unmarkUnit\('([^']+)'\)/)[1],
    );
  }

  /** Kunci ayat yang ter-render di Daftar Ayat (urut DOM). */
  static daftarKeys($m) {
    return Cypress.$.makeArray($m.find('[wire\\:key^="unit-"]')).map((el) =>
      el.getAttribute('wire:key').slice('unit-'.length),
    );
  }

  /** Kunci ayat yang tercentang (termasuk terkunci) di Daftar Ayat. */
  static daftarCheckedKeys($m) {
    return Cypress.$.makeArray($m.find('[wire\\:key^="unit-"]'))
      .filter((el) => Cypress.$(el).find('input[type="checkbox"]').is(':checked'))
      .map((el) => el.getAttribute('wire:key').slice('unit-'.length));
  }

  /** Header kelompok surat di Daftar Ayat, urut DOM: [{nama, jumlah}]. */
  static daftarHeaders($m) {
    return Cypress.$.makeArray($m.find('.border.rounded.p-4 .fw-bold.text-gray-800')).map((el) => ({
      nama: el.textContent.trim(),
      jumlah: Cypress.$(el).siblings('span.text-muted').text().trim(),
    }));
  }

  assertTerpilih(expected, { urut = true } = {}) {
    cy.get(M).should(($m) => {
      const got = RiwayatProgresForm.terpilihKeys($m);
      if (urut) expect(got).to.deep.eq(expected);
      else expect(sortKeys(got)).to.deep.eq(sortKeys(expected));
    });
    return this;
  }

  /** "{n} {satuan} terpilih" — satuan mengikuti Batas Tahfidz (ayat/juz/halaman/surah). */
  assertJumlahTerpilih(n, satuan = 'ayat') {
    this.elements.terpilihJumlah().should(($s) => expect($s.text().trim()).to.eq(`${n} ${satuan} terpilih`));
    return this;
  }

  // ------------------------------------------------------------------ Field & footer
  isiTanggal(tgl) {
    this.elements.tanggal().clear().type(tgl);
    return this;
  }

  isiDeskripsi(text) {
    this.elements.deskripsi().clear().type(text);
    return this;
  }

  isiField({ tanggal, deskripsi } = {}) {
    if (tanggal) this.isiTanggal(tanggal);
    if (deskripsi) this.isiDeskripsi(deskripsi);
    return this;
  }

  /** Klik Simpan (tanpa asumsi hasil). */
  /** Klik Simpan dan tunggu request method "submit" itu sendiri (bukan antrean umum). */
  simpan() {
    cy.aliasLivewireMethod(LW_COMPONENT, 'submit', 'lwSubmit');
    this.elements.btnSimpan().click();
    cy.wait('@lwSubmit', { timeout: 30000 });
    cy.livewireIdle();
    return this;
  }

  /** Simpan, modal tertutup, notifikasi sukses tampil. */
  simpanSukses(pesan) {
    // Alias khusus request method "submit" (lihat cy.aliasLivewireMethod).
    cy.aliasLivewireMethod(LW_COMPONENT, 'submit', 'lwSubmit');
    this.elements.btnSimpan().click();
    cy.wait('@lwSubmit', { timeout: 30000 }).then((i) => {
      // Response simpan sukses = dispatch modal-hide #modal-progress + pesan sukses.
      cy.assertNotifDiResponse(i, '{"event":"modal-hide","data":{"modal":"modal-progress"}}');
      if (pesan) cy.assertNotifDiResponse(i, pesan);
    });
    cy.livewireIdle();
    this.assertTertutup();
    return this;
  }

  batal() {
    this.elements.btnBatal().click();
    cy.wait(LW);
    cy.livewireIdle();
    this.assertTertutup();
    return this;
  }

  assertErrorValidasi(pesan) {
    cy.contains(M, pesan).should('be.visible');
    return this;
  }
}

export { RiwayatProgresForm as RiwayatProgresFormClass };
export default new RiwayatProgresForm();
