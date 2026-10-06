// Smoke login — memastikan config environment, kredensial, dan cy.session
// berjalan sebelum modul apa pun dijalankan. Tidak membuat/mengubah data.
import LoginPage from '../../../support/pageobjects/LoginPage';

describe('Login - Smoke', () => {
  let app;

  before(() => {
    cy.fixture('app').then((d) => {
      app = d;
    });
  });

  beforeEach(() => {
    LoginPage.clearSession();
  });

  describe('Login admin valid', () => {
    it('TC-LGN-001 : Halaman login tampil dengan field Email, Password, dan tombol Masuk', () => {
      LoginPage.visit();
      LoginPage.elements.heading().should('be.visible');
      LoginPage.elements.emailInput().should('be.visible');
      LoginPage.elements.passwordInput().should('be.visible');
      LoginPage.elements.submitBtn().should('be.visible').and('contain', app.login.submitText.value);
    });

    it('TC-LGN-002 : Login dengan akun admin staging berhasil dan tidak kembali ke halaman login', () => {
      LoginPage.loginViaSession();
      cy.visitRelative(app.routes.home.path);
      LoginPage.assertLoggedIn();
    });

    it('TC-LGN-003 : Sesi login dapat membuka halaman Kesiswaan > Tahfidz', () => {
      LoginPage.loginViaSession();
      cy.visitRelative(app.routes.tahfidzIndex.path);
      LoginPage.assertLoggedIn();
      cy.location('pathname').should('eq', app.routes.tahfidzIndex.path);
    });
  });
});
