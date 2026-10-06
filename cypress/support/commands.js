// commands.js — custom command shared lintas modul (V2: Laravel + Livewire v2).
import { MODAL_OPEN, rx, formItem } from './helpers';

// =========================================================================
// NAVIGASI YANG MENGHORMATI ENVIRONMENT SWITCH
// =========================================================================
// baseUrl hanya berlaku untuk cy.visit() dengan path RELATIF. Command ini
// membuang skema+host apa pun yang terlanjur absolut, jadi run tidak pernah
// bocor ke host lain (pelajaran dari repo V3, 1 Okt 2026).
const toRelativePath = (url) => {
  const s = url == null ? '' : String(url).trim();
  if (!s || s === 'undefined' || s === 'null') return '/';
  const abs = s.match(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]+(.*)$/i);
  if (abs) {
    const rest = abs[1] || '/';
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return s.startsWith('/') ? s : `/${s}`;
};

Cypress.Commands.add('visitRelative', (url, options) => {
  const rel = toRelativePath(url);
  const original = url == null ? '' : String(url);
  if (rel !== original && /^[a-z][a-z0-9+.-]*:\/\//i.test(original)) {
    Cypress.log({
      name: 'visitRelative',
      message: `host absolut dibuang: "${original}" -> "${rel}"`,
    });
  }
  return options ? cy.visit(rel, options) : cy.visit(rel);
});

// =========================================================================
// LIVEWIRE v2 — request per aksi
// =========================================================================
// Livewire v2 mengirim setiap aksi (wire:click / wire:model) sebagai
// POST /livewire/message/<nama-komponen> (crosschecked: composer.json
// origin/staging = livewire/livewire ^2.9). Nama komponen untuk halaman Detail
// Siswa Tahfidz = "student-affairs.tahfidz.member-detail" (?) — konfirmasi di
// tab Network saat element analysis.
//
// Pola pakai (deterministik, TANPA cy.wait(<angka>)):
//   cy.livewireAlias('student-affairs.tahfidz.member-detail', 'lwForm')
//   ...aksi...
//   cy.wait('@lwForm')
Cypress.Commands.add('livewireAlias', (component, alias) => {
  cy.intercept('POST', `**/livewire/message/${component}`).as(alias);
});

/**
 * Alias khusus untuk SATU method Livewire, ditentukan dari isi request body
 * (updates[].payload.method). Dipakai untuk aksi penting (submit / delete):
 * cy.wait('@lwSubmit') menunggu TEPAT request itu, apa pun urutan request lain.
 * Alasan (run 6 Okt 2026): antrean alias umum '@lwSiswa' tidak berurutan
 * (mengikuti waktu response), sehingga mencari response tertentu lewat antrean
 * bisa meleset walau simpan sukses di server.
 */
Cypress.Commands.add('aliasLivewireMethod', (component, method, alias) => {
  cy.intercept('POST', `**/livewire/message/${component}`, (req) => {
    const updates = (req.body && req.body.updates) || [];
    // callMethod -> payload.method; fireEvent (emit dari server, mis. 'doSubmit') -> payload.event.
    if (updates.some((u) => u.payload && (u.payload.method === method || u.payload.event === method))) req.alias = alias;
  });
});

/**
 * Tunggu Livewire selesai MEMPROSES (morph DOM) semua pesan yang terkirim.
 * Penghitung dipasang hook message.sent / message.processed di e2e.js.
 * Dipakai SETELAH cy.wait('@alias'): alias selesai saat response tiba, morph
 * DOM terjadi sesudahnya. Deterministik, tanpa cy.wait(<angka>).
 */
Cypress.Commands.add('livewireIdle', (timeout = 15000) => {
  cy.window({ log: false, timeout }).should((w) => {
    // Sumber kebenaran = status internal tiap komponen Livewire v2: pesan yang
    // SEDANG dikirim (messageInTransit). Antrean update (updateQueue) sengaja
    // TIDAK dihitung: input wire:model.defer (Tanggal/Deskripsi) memang menunggu
    // di antrean sampai aksi berikutnya, jadi bukan tanda sibuk (run 6 Okt 2026:
    // after-hook TC-088 tertahan 15 detik). Penghitung hook hanya cadangan; ia
    // bisa meleset bila beberapa aksi digabung jadi satu pesan (TC-012).
    const lw = w.livewire || w.Livewire;
    const comps = lw && lw.components && lw.components.componentsById;
    if (comps) {
      const sibuk = Object.values(comps).filter((c) => c.messageInTransit);
      expect(sibuk.map((c) => c.name), 'komponen Livewire yang masih memproses').to.deep.eq([]);
      return;
    }
    if (!w.__lwHooked) return;
    expect(w.__lwDone, 'Livewire selesai memproses semua pesan').to.be.gte(w.__lwSent);
  });
});

// =========================================================================
// MODAL BOOTSTRAP — tunggu animasi fade selesai
// =========================================================================
// Bootstrap MENGABAIKAN hide() selama modal masih transisi (fade-in). Kalau
// server membalas cepat, dispatch "modal-hide" dari Livewire jatuh di tengah
// animasi dan modal macet terbuka (cleanup run 6 Okt 2026). Stabil = opacity 1
// dan transform .modal-dialog sudah selesai (none / matriks identitas).
Cypress.Commands.add('modalStabil', (selector, timeout = 15000) => {
  cy.get(selector, { timeout }).should(($m) => {
    expect($m.hasClass('show'), 'modal terbuka').to.eq(true);
    expect($m.css('opacity'), 'opacity modal').to.eq('1');
    const dialog = $m.find('.modal-dialog')[0];
    const tf = dialog ? window.getComputedStyle(dialog).transform : 'none';
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)'], 'animasi modal selesai').to.include(tf);
  });
});

// =========================================================================
// NOTIFIKASI — <x-alert.notification/> (session flash)
// =========================================================================
// Sukses: <div class="alert ... bg-primary"> ... <span>{pesan}</span>
// Gagal : <div class="alert ... bg-danger">  ... <span>{pesan}</span>
// (crosschecked source staging resources/views/components/alert/notification.blade.php)
Cypress.Commands.add('assertNotifSukses', (message, timeout = 15000) => {
  cy.get('.alert.bg-primary', { timeout }).should('be.visible').and('contain', message);
});

/**
 * Notifikasi sukses diverifikasi dari RESPONSE Livewire (HTML yang dikirim
 * server), bukan dari DOM. Alasan (run 6 Okt 2026): alert flash V2 dirender lalu
 * langsung hilang lagi — simpan/hapus memicu re_render_table -> update_history ->
 * komponen dirender ulang tanpa flash. Cek DOM jadi bergantung keberuntungan.
 * Pakai: cy.wait('@alias').then((i) => cy.assertNotifDiResponse(i, pesan))
 */
Cypress.Commands.add('assertNotifDiResponse', (interception, message) => {
  const body = JSON.stringify((interception && interception.response && interception.response.body) || {});
  expect(body, `response Livewire memuat notifikasi "${message}"`).to.contain(message);
});

/**
 * Tunggu response Livewire (alias) yang MEMUAT teks tertentu, melewati response
 * lain yang terantre lebih dulu. Alasan (run 6 Okt 2026): tabel riwayat memicu
 * request member-detail tambahan secara asinkron (re_render_table ->
 * update_history), sehingga cy.wait('@alias') berikutnya bisa mendapat response
 * aksi sebelumnya (mis. response "buka modal hapus" alih-alih response "hapus").
 * Deterministik: berhenti di response yang benar, gagal jelas setelah `maks` response.
 */
Cypress.Commands.add('tungguLivewireBerisi', (alias, teks, maks = 8) => {
  // `teks` boleh array: SEMUA harus ada di response yang sama. Dipakai untuk
  // mensyaratkan pesan + dispatch modal-hide sekaligus, supaya response render
  // ulang yang kebetulan masih memuat pesan flash lama tidak ikut cocok.
  const daftar = [].concat(teks);
  const dilewati = [];
  const coba = (sisa) =>
    cy.wait(alias, { timeout: 30000 }).then((i) => {
      const raw = (i && i.response && i.response.body) || {};
      const body = JSON.stringify(raw);
      if (daftar.every((t) => body.includes(t))) return i;
      // Ringkasan response yang dilewati, untuk diagnosis bila akhirnya gagal.
      const calls = ((i.request && i.request.body && i.request.body.updates) || [])
        .map((u) => (u.payload && (u.payload.method || u.payload.event || u.payload.name)) || u.type)
        .join('+');
      const disp = ((raw.effects && raw.effects.dispatches) || []).map((d) => JSON.stringify(d)).join(' ');
      dilewati.push(`[${i.response && i.response.statusCode} ${calls || '-'}] ${disp || '(tanpa dispatch)'}${daftar.slice(1).some((t) => body.includes(t)) ? ' +pesan' : ''}`);
      if (sisa <= 1) {
        throw new Error(
          `Tidak ada response ${alias} yang memuat ${JSON.stringify(daftar)} dalam ${maks} response.\n` +
            `Response yang dilewati:\n  ${dilewati.join('\n  ')}`,
        );
      }
      return coba(sisa - 1);
    });
  return coba(maks);
});

Cypress.Commands.add('assertNotifGagal', (message, timeout = 15000) => {
  cy.get('.alert.bg-danger', { timeout }).should('be.visible').and('contain', message);
});

// =========================================================================
// FORM — field by label & exact-match
// =========================================================================
/** Container field berdasarkan label (lihat helpers.formItem). */
Cypress.Commands.add('formItem', (label, scope = MODAL_OPEN) => formItem(label, scope));

/** Klik elemen dengan teks persis (bukan substring) di dalam scope. */
Cypress.Commands.add('clickExact', (selector, text, scope = 'body') =>
  cy.get(scope).contains(selector, rx(text)).click(),
);
