// UTILITAS CLEANUP (bukan test case) — kembalikan foto siswa QA ke avatar otomatis.
// Dipakai bila run TC-IMT-046/048 terputus sesudah foto dummy diunggah (keputusan D4).
// Hanya menyentuh siswa QA (batas.siswa.id).
import { siapkan } from '../../../support/tahfidz';
import { batasData } from '../../../support/batas';
import DetailSiswaPage from '../../../support/pageobjects/member/DetailSiswaPage';

describe('Cleanup - Foto siswa QA', () => {
  let fx;

  before(() => {
    cy.fixture('batas').then((d) => {
      fx = batasData(d);
    });
  });

  beforeEach(() => {
    siapkan();
  });

  it('Kembalikan foto siswa QA ke avatar otomatis', () => {
    DetailSiswaPage.kembalikanFoto(fx.siswa.id);
    cy.get('form[wire\\:submit\\.prevent="edit_image"] img').should(($img) => {
      expect($img.attr('src'), 'foto = avatar otomatis').to.contain('ui-avatars.com');
    });
  });
});
