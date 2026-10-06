// LoginPage — CARDS School V2 (Laravel, form POST klasik, bukan API JSON).
//
// Selector form VERIFIED lewat HTML asli (element analysis #1, 5 Okt 2026).
// Redirect /home masih crosschecked; pesan gagal login masih (?).
// Link "Lupa Password ?" (a[href$="/password/reset"]) sengaja TIDAK dimodelkan:
// akun tidak boleh dipakai untuk submit lupa/reset password.
//
// Sumber (READ-ONLY ../cazh/cazh-cards-dashboard origin/staging):
//   routes/web.php                          Auth::routes() -> GET/POST /login
//   resources/views/auth/login.blade.php    <form method="POST" action="{{ route('login') }}">
//     email    : <input id="email" type="email" name="email">
//     password : <x-forms.password-input name="password"> -> <input :type="show ? 'password' : 'text'">
//                (type dipasang Alpine -> pilih lewat name, BUKAN type)
//     submit   : <button type="submit" class="btn btn-lg btn-primary w-100">Masuk</button>
//   RouteServiceProvider::HOME = '/home'    tujuan redirect setelah login sukses
//
// Path RELATIF. Nilai nyata per-environment ada di cypress/config/environments.js
// (loginPath) dan sampai ke sini lewat Cypress.expose('appLogin').
// Cypress 16: Cypress.env() DIHAPUS. Non-rahasia -> Cypress.expose(),
// kredensial -> cy.env(['appEmail', 'appPassword']) (lihat cypress.config.js).
const LOGIN_PATH = '/login';
const HOME_PATH = '/home';

class LoginPage {
  elements = {
    emailInput: () => cy.get('form input[name="email"]'),
    passwordInput: () => cy.get('form input[name="password"]'),
    submitBtn: () => cy.get('form[action$="/login"] button[type="submit"]'),
    heading: () => cy.contains('h1', 'Masuk ke akun anda !'),
    // Notifikasi gagal login = <x-alert.validation/> / @error('email') (?) —
    // markup error belum dilihat dari HTML asli.
    errorAlert: () => cy.get('form .alert, form .invalid-feedback, form .fv-plugins-message-container'),
  };

  visit(loginPath = Cypress.expose('appLogin') || LOGIN_PATH) {
    cy.visitRelative(loginPath);
    return this;
  }

  fillEmail(email) {
    this.elements.emailInput().clear().type(email);
    return this;
  }

  fillPassword(password) {
    this.elements.passwordInput().clear().type(password, { log: false });
    return this;
  }

  clickSubmit() {
    this.elements.submitBtn().click();
    return this;
  }

  login(email, password) {
    if (email) this.fillEmail(email);
    if (password) this.fillPassword(password);
    return this.clickSubmit();
  }

  clearSession() {
    cy.clearCookies();
    cy.clearLocalStorage();
    return this;
  }

  /**
   * Login via cy.session dengan validasi berbasis URL.
   *
   * Form POST /login -> 302 ke /home (sukses) ATAU 302 balik ke /login (gagal).
   * Karena dua-duanya 302, status code TIDAK cukup untuk menilai sukses: yang
   * dinilai URL akhir. Request POST tetap di-alias supaya yang ditunggu
   * response login yang sebenarnya, bukan jeda tebakan.
   *
   * validate(): sesi yang sudah mati dilempar app balik ke /login, jadi cache
   * cy.session yang basi ketahuan di sini (bukan berupa error selector di spec).
   *
   * @param {object} opts - { redirect, home } — opsional
   */
  /** cy.session untuk satu akun (dipakai admin & akun QA per jenis pengguna). */
  sesi(e, p, { redirect, home, environment, l, setelahLogin }) {
    cy.session(
      `session-v2-${environment}-${e}`,
      () => {
        cy.intercept('POST', `**${l}`).as('loginPost');
        cy.visitRelative(l);
        this.elements.emailInput().should('be.visible').clear().type(e);
        this.elements.passwordInput().should('be.visible').clear().type(p, { log: false });
        this.elements.submitBtn().should('be.enabled').click();

        cy.wait('@loginPost', { timeout: redirect });
        cy.location('pathname', { timeout: redirect }).should('not.eq', l);
        if (setelahLogin) setelahLogin();
      },
      {
        validate() {
          cy.visitRelative(home, { failOnStatusCode: false });
          cy.location('pathname', { timeout: redirect }).should('not.eq', l);
        },
      },
    );
    return this;
  }

  /**
   * Login pertama akun QA baru (source origin/staging):
   * - middleware `tos-accepted` mengarahkan ke /tos sampai Syarat & Ketentuan disetujui
   *   (form #tos-accept-form: #accept_tos + #accept_privacy_policy, tombol #tos-submit);
   * - LoginController menyalakan session `show_app_tour` bila last_login kosong ->
   *   popup "Halo ... Mulai" menutupi halaman; dimatikan lewat GET /hide-show-app-tour.
   * Hanya dipakai untuk akun QA BT (bukan admin).
   */
  siapkanAkunBaru() {
    cy.location('pathname').then((path) => {
      if (!path.startsWith('/tos')) return;
      cy.get('#accept_tos').check();
      cy.get('#accept_privacy_policy').check();
      cy.get('#tos-submit').should('be.enabled').click();
      cy.location('pathname', { timeout: 20000 }).should('not.match', /^\/tos/);
    });
    cy.request('/hide-show-app-tour');
    return this;
  }

  /**
   * Login sebagai akun QA per jenis pengguna: cypress.env.json -> creds.staging.roles.<role>.
   * Akun belum diisi -> callback kosong(alasan) dipanggil (spec menandai TC Blocked).
   */
  loginSebagai(role, kosong, opts = {}) {
    const redirect = opts.redirect || 20000;
    const home = opts.home || HOME_PATH;
    const environment = Cypress.expose('environment') || 'staging';
    const l = Cypress.expose('appLogin') || LOGIN_PATH;
    cy.env(['appRoles'], { log: false }).then(({ appRoles }) => {
      const akun = (appRoles || {})[role];
      if (!akun || !akun.email || !akun.password) {
        kosong(`Akun QA "${role}" belum diisi di cypress.env.json -> creds.staging.roles.${role}`);
        return;
      }
      this.clearSession();
      this.sesi(akun.email, akun.password, { redirect, home, environment, l, setelahLogin: () => this.siapkanAkunBaru() });
    });
    return this;
  }

  loginViaSession(opts = {}) {
    const redirect = opts.redirect || 20000;
    const home = opts.home || HOME_PATH;

    const environment = Cypress.expose('environment') || 'staging';
    const l = Cypress.expose('appLogin') || LOGIN_PATH;

    cy.env(['appEmail', 'appPassword'], { log: false }).then(({ appEmail: e, appPassword: p }) => {
      if (!e || !p) {
        throw new Error(
          'Kredensial kosong: isi cypress.env.json -> creds.staging (lihat cypress.env.example.json).',
        );
      }

      this.sesi(e, p, { redirect, home, environment, l });
    });
    return this;
  }

  assertOnLoginPage(loginPath = Cypress.expose('appLogin') || LOGIN_PATH) {
    cy.location('pathname').should('eq', loginPath);
    this.elements.emailInput().should('be.visible');
    return this;
  }

  assertLoggedIn(loginPath = Cypress.expose('appLogin') || LOGIN_PATH) {
    cy.location('pathname').should('not.eq', loginPath);
    return this;
  }
}

export default new LoginPage();
