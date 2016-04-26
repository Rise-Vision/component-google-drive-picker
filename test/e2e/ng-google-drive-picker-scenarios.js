/* jshint expr: true */

(function() {

  "use strict";

  /* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");

  chai.use(chaiAsPromised);
  var expect = chai.expect;

  browser.driver.manage().window().setSize(1024, 768);

  describe("Google Drive Picker Component", function() {
    beforeEach(function () {
      browser.get("/test/e2e/ng-google-drive-picker-scenarios.html");
    });

    it("Should correctly load", function () {
      expect(element(by.css(".google-drive-picker .btn")).isPresent()).to.eventually.be.true;
    });

    it("Should correctly pick a file", function () {
      //open dialog
      element(by.css(".google-drive-picker .btn")).click();
      //simulate picks
      element(by.id("simulate-pick")).click();
      expect(element.all(by.css("#files-picked .file")).count()).to.eventually.equal(3);
    });

    it("Should correctly cancel a dialog", function () {
      //initially not cancelled
      expect(element(by.id("cancelled")).getAttribute("checked")).to.eventually.be.null;
      //open dialog
      element(by.css(".google-drive-picker .btn")).click();
      //simulate picks
      element(by.id("simulate-cancel")).click();
      expect(element(by.id("cancelled")).getAttribute("checked")).to.eventually.not.be.null;
    });
  });

})();
