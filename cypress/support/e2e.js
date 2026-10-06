// e2e.js — dimuat otomatis sebelum setiap spec.
import './commands';

// Error JS app tidak menggagalkan test, tapi error yang belum masuk daftar
// derau DICATAT ke Cypress log + console supaya bug JS asli tetap kelihatan
// (pola FIX-005 repo V3). Setelah tahu error mana yang memang derau di V2,
// pindahkan ke NOISE lalu ganti `return false` jadi `return true`.
// Kandidat derau berikutnya (element analysis #1, 5 Okt 2026): halaman Detail
// program melempar "SyntaxError: Invalid or unexpected token" di console tanpa
// memblok UI. Sengaja BELUM dimasukkan NOISE — dibiarkan tercatat dulu.
const NOISE = [
  /ResizeObserver loop/i, // derau browser standar, bukan bug app
];

// Penghitung pesan Livewire v2 per halaman. cy.wait('@alias') selesai saat
// RESPONSE tiba, padahal morph DOM Livewire terjadi sesudahnya (run 6 Okt 2026:
// dropdown step tertutup oleh morph tepat ketika Cypress akan mengklik opsi).
// cy.livewireIdle() menunggu sampai semua pesan yang terkirim sudah diproses.
Cypress.on('window:load', (win) => {
  const lw = win.Livewire || win.livewire;
  if (!lw || typeof lw.hook !== 'function' || win.__lwHooked) return;
  win.__lwHooked = true;
  win.__lwSent = 0;
  win.__lwDone = 0;
  lw.hook('message.sent', () => {
    win.__lwSent += 1;
  });
  lw.hook('message.processed', () => {
    win.__lwDone += 1;
  });
  lw.hook('message.failed', () => {
    win.__lwDone += 1;
  });
});

Cypress.on('uncaught:exception', (err) => {
  if (NOISE.some((re) => re.test(err.message))) return false;

  Cypress.log({
    name: 'uncaught',
    message: `app error diabaikan: ${err.message}`,
    consoleProps: () => ({ error: err }),
  });
  // eslint-disable-next-line no-console
  console.warn('[uncaught:exception] belum di-whitelist:', err.message);
  return false;
});
