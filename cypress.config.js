const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");
const environments = require("./cypress/config/environments");

// CI = true di-set otomatis oleh GitHub Actions. Dipakai HANYA untuk
// mengecualikan spec cleanup di CI; perilaku run lokal tidak berubah.
const IS_CI = !!process.env.CI;

/**
 * Kredensial fallback dari environment variable, untuk CI.
 *
 * config.env.creds adalah objek BERSARANG (creds.<env>.email). Cypress tidak
 * mem-parse CYPRESS_creds='{"staging":{...}}' menjadi objek, jadi dipakai dua
 * env var datar: CYPRESS_STAGING_EMAIL / CYPRESS_STAGING_PASSWORD.
 * Urutan prioritas: cypress.env.json (lokal) MENANG, env var cuma fallback.
 */
function credsFromEnv(environment) {
  const key = String(environment).toUpperCase();
  const email = process.env[`CYPRESS_${key}_EMAIL`];
  const password = process.env[`CYPRESS_${key}_PASSWORD`];
  return email && password ? { email, password } : null;
}

module.exports = defineConfig({
  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "cypress/reports",
    overwrite: false,
    html: false,
    json: true,
    timestamp: "mmddyyyy_HHMMss",
  },
  e2e: {
    // Default statis = staging. DI-OVERRIDE di setupNodeEvents dari
    // cypress/config/environments.js (blok "ENVIRONMENT SWITCH").
    baseUrl: "https://staging-school.cazh.id",
    viewportWidth: 1366,
    viewportHeight: 768,
    defaultCommandTimeout: 10000,
    // Video tetap direkam, tapi dihapus di after:spec kalau spec lulus semua.
    // CYPRESS_VIDEO=false mematikannya total.
    video: process.env.CYPRESS_VIDEO !== "false",
    videoCompression: 32,
    videosFolder: "cypress/videos",
    screenshotOnRunFailure: true,
    screenshotsFolder: "cypress/screenshots",
    // "a flaky failure is a real failure" — tidak ada retry, lokal maupun CI.
    retries: { runMode: 0, openMode: 0 },
    specPattern: "cypress/e2e/stagingv2/**/*.cy.{js,ts}",
    // Spec cleanup MENGHAPUS DATA staging -> tidak pernah ikut run CI.
    excludeSpecPattern: IS_CI
      ? ["**/cleanup/**/*.cy.{js,ts}", "**/cleanup*.cy.{js,ts}"]
      : ["*.hot-update.js"],
    downloadsFolder: "cypress/downloads",
    setupNodeEvents(on, config) {
      // =====================================================================
      // ENVIRONMENT SWITCH — URL: cypress/config/environments.js,
      // kredensial: cypress.env.json (creds.<env>, RAHASIA, git-ignored).
      //
      // Target repo ini = STAGING saja. Production SENGAJA tidak ada di
      // environments.js, jadi default ke staging aman. Flag eksplisit boleh:
      // --env environment=staging (atau CYPRESS_ENV=staging). Nilai lain ->
      // run DIBATALKAN.
      // =====================================================================
      // Cypress 16: Cypress.env() di browser DIHAPUS. Nilai non-rahasia
      // (environment, baseUrl, loginPath) dikirim lewat config.expose ->
      // Cypress.expose(); kredensial tetap di config.env -> cy.env([...]).
      config.expose = config.expose || {};
      const environment =
        config.expose.environment ||
        config.env.environment ||
        process.env.CYPRESS_ENV ||
        "staging";
      const envCfg = environments[environment];
      if (!envCfg) {
        throw new Error(
          `environment "${environment}" tidak dikenal. Pilihan: ${Object.keys(
            environments
          ).join(", ")}`
        );
      }
      const creds =
        (config.env.creds || {})[environment] || credsFromEnv(environment);
      if (!creds || !creds.email || !creds.password) {
        throw new Error(
          [
            "",
            "==================================================================",
            `✖ Kredensial "${environment}" tidak ditemukan.`,
            "  LOKAL — buat file cypress.env.json (lihat cypress.env.example.json):",
            `    { "creds": { "${environment}": { "email": "...", "password": "..." } } }`,
            "  File ini di-git-ignore (jangan commit).",
            "",
            "  CI — set dua environment variable / GitHub Secret:",
            `    CYPRESS_${environment.toUpperCase()}_EMAIL`,
            `    CYPRESS_${environment.toUpperCase()}_PASSWORD`,
            "==================================================================",
            "",
          ].join("\n")
        );
      }
      config.baseUrl = envCfg.baseUrl;
      config.expose.environment = environment;
      config.expose.appBase = envCfg.baseUrl;
      config.expose.appLogin = envCfg.loginPath;
      // RAHASIA: hanya bisa dibaca lewat cy.env(['appEmail', 'appPassword']).
      config.env.appEmail = creds.email;
      config.env.appPassword = creds.password;
      // Akun QA per jenis pengguna (TC hak akses), opsional: creds.<env>.roles.<nama>.
      // RAHASIA juga: dibaca lewat cy.env(['appRoles']).
      config.env.appRoles = creds.roles || {};
      // eslint-disable-next-line no-console
      console.log(`\n🎯 CYPRESS ENVIRONMENT = ${environment} (${envCfg.baseUrl})\n`);

      // Task untuk menguji isi file Export (tiket ini menguji kolom Capaian
      // Hafalan & Pencapaian di file Excel).
      //
      //   cy.task('clearDownloads')                       // sebelum klik Excel
      //   ...klik tombol Excel...
      //   cy.task('findDownload', { ext: '.xlsx' })       // retry sampai file muncul
      //     .should('not.be.null')
      //     .then((file) => cy.task('readSheet', { filePath: file }))
      const DOWNLOADS = path.join(__dirname, "cypress", "downloads");

      on("task", {
        /** Kosongkan folder downloads. Panggil SEBELUM klik Excel. */
        clearDownloads() {
          if (fs.existsSync(DOWNLOADS)) {
            for (const f of fs.readdirSync(DOWNLOADS)) {
              try {
                fs.unlinkSync(path.join(DOWNLOADS, f));
              } catch (_) {
                /* file terkunci proses lain; abaikan */
              }
            }
          }
          return null;
        },

        /** File terbaru dengan ekstensi tertentu. null kalau belum ada —
         *  supaya bisa di-retry pakai .should('not.be.null'). */
        findDownload({ ext = ".xlsx" } = {}) {
          if (!fs.existsSync(DOWNLOADS)) return null;
          const files = fs
            .readdirSync(DOWNLOADS)
            .filter((f) => f.toLowerCase().endsWith(ext.toLowerCase()))
            // .crdownload = unduhan Chrome yang BELUM selesai
            .filter((f) => !f.endsWith(".crdownload"))
            .map((f) => path.join(DOWNLOADS, f))
            .filter((f) => fs.statSync(f).isFile());
          if (!files.length) return null;
          files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
          return files[0];
        },

        /** Tunggu (di Node) sampai file dengan ekstensi tertentu muncul di
         *  downloads, maks `timeout` ms. cy.task TIDAK di-retry oleh .should(),
         *  jadi penantian dilakukan di sini (run 6 Okt 2026: findDownload dicek
         *  sekali sebelum unduhan selesai -> null). Mengembalikan path atau null. */
        waitDownload({ ext = ".xlsx", timeout = 30000 } = {}) {
          const cari = () => {
            if (!fs.existsSync(DOWNLOADS)) return null;
            const files = fs
              .readdirSync(DOWNLOADS)
              .filter((f) => f.toLowerCase().endsWith(ext.toLowerCase()))
              .map((f) => path.join(DOWNLOADS, f))
              .filter((f) => fs.statSync(f).isFile() && fs.statSync(f).size > 0);
            if (!files.length) return null;
            files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
            return files[0];
          };
          const mulai = Date.now();
          return new Promise((resolve) => {
            const cek = () => {
              const f = cari();
              if (f || Date.now() - mulai > timeout) return resolve(f);
              setTimeout(cek, 250);
            };
            cek();
          });
        },

        /** Metadata file: ukuran & waktu modifikasi. */
        statDownload({ filePath }) {
          if (!filePath || !fs.existsSync(filePath)) return null;
          const s = fs.statSync(filePath);
          return { size: s.size, mtimeMs: s.mtimeMs, name: path.basename(filePath) };
        },

        /** Baca .xlsx jadi array of object (default sheet pertama).
         *  `header: 1` -> array of array (urutan kolom ikut terbaca; dipakai
         *  untuk assert posisi kolom Capaian Hafalan). */
        readSheet({ filePath, sheet, header } = {}) {
          if (!filePath || !fs.existsSync(filePath)) return null;
          // eslint-disable-next-line global-require
          const XLSX = require("xlsx");
          const wb = XLSX.readFile(filePath);
          const name = sheet || wb.SheetNames[0];
          return XLSX.utils.sheet_to_json(
            wb.Sheets[name],
            header ? { header, defval: "" } : { defval: "" }
          );
        },

        /** Baca file teks (CSV / TXT) apa adanya. */
        readTextFile({ filePath }) {
          if (!filePath || !fs.existsSync(filePath)) return null;
          return fs.readFileSync(filePath, "utf8");
        },
      });

      // Hapus video kalau spec lulus semua (cuma simpan video FAIL).
      on("after:spec", (spec, results) => {
        if (!results || !results.video) return;
        const failed = (results.tests || []).some((t) =>
          (t.attempts || []).some((a) => a.state === "failed")
        );
        if (!failed) {
          try {
            fs.unlinkSync(results.video);
          } catch (_) {
            // file mungkin sudah ke-hapus / belum sempat ter-write; abaikan.
          }
        }
      });

      // WAJIB: kembalikan config supaya override baseUrl + env di atas berlaku.
      return config;
    },
  },
});
