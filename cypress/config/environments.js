// environments.js — URL per environment.
//
// Target repo ini = STAGING saja. Production SENGAJA tidak ada di daftar ini
// supaya tidak ada jalan untuk tidak sengaja menjalankan spec CRUD ke sistem
// live. Run dengan environment selain yang ada di sini DIBATALKAN oleh
// cypress.config.js.
//
// ⚠️ KREDENSIAL TIDAK di sini — ada di `cypress.env.json` (git-ignored) di
// bawah key `creds.<environment>`.
//
// V2 multi-tenant (1 kode, host + DB per sekolah). Repo ini menguji SATU host
// sekolah staging saja.
//
// loginPath dicek dari source (READ-ONLY) ../cazh/cazh-cards-dashboard
// origin/staging: routes/web.php -> Auth::routes() -> GET/POST /login,
// form resources/views/auth/login.blade.php (action="{{ route('login') }}").
// Setelah login Laravel redirect ke RouteServiceProvider::HOME = '/home'.

module.exports = {
  staging: {
    baseUrl: 'https://staging-school.cazh.id',
    loginPath: '/login',
  },
};
