
'use strict';


// Upload the test data file, process it, and save (download) it to
// to the default location as configured in protractor.confjs
describe('HGVS Validator', function() {
 beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('./public/index.html');
  });

  it('should return valid status  and SPDI for valid HGVS Expression', function() {
    // element(by.id('hgvsInput')).sendKeys('NM_080669.6:c.*3302A>G');
    // element(by.id('includeSPDI')).click();
    // element(by.id('Validate')).click();
    cy.get('#hgvsInput').type('NM_080669.6:c.*3302A>G');
    cy.get('#includeSPDI').click();
    cy.get('#Validate', ).click();
    cy.get('#spdiResult').should('be.visible');
    cy.get('#validationResult', { timeout: 5000 }).should('have.text', 'Valid');
    cy.get('#spdiResult').should('have.text', 'NM_080669.6:4779:A:G');
  });

  it('should return "invalid" status for invalid HGVS Expression', function() {
    cy.get('#hgvsInput').type('xyz');
    cy.get('#Validate').click();
    cy.get('#validationResult', { timeout: 5000 }).should('have.text', 'Invalid');
  });
});

