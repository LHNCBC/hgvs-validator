'use strict';

var EC = protractor.ExpectedConditions;

// Upload the test data file, process it, and save (download) it to
// to the default location as configured in protractor.confjs
describe('HGVS Validator', function() {
  it('should return valid status for valid HGVS Expression and SPDI', function(done) {
    setAngularSite(false);
    browser.get('/');
    element(by.id('hgvsInput')).sendKeys('NM_080669.6:c.*3302A>G');
    element(by.id('includeSPDI')).click();
    element(by.id('Validate')).click();

    // wait until the page is properly rendered
    browser.wait(EC.visibilityOf(element(by.id('validationResult')))).then(() => {
      var vldResultEle = element(by.id('validationResult'));
      var spdiEle = element(by.id('spdiResult'));
      expect(vldResultEle.getText()).toEqual('Valid');
      expect(spdiEle.getText()).toEqual('NM_080669.6:4779:A:G');
      done();
    });
  });

  // TODO: add a Mutalyzer test case when the http proxy problem is fixed in CTSS
});

