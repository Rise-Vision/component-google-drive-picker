(function () {
  "use strict";

  var gulp = require("gulp");
  var gutil = require("gulp-util");
  var path = require("path");
  var rename = require("gulp-rename");
  var rimraf = require("gulp-rimraf");
  var concat = require("gulp-concat");
  var bump = require("gulp-bump");
  var runSequence = require("run-sequence");
  var jshint = require("gulp-jshint");
  var uglify = require("gulp-uglify");
  var html2js = require("gulp-html2js");
  var factory = require("widget-tester").gulpTaskFactory;

  gulp.task("clean-dist", function () {
    return gulp.src("dist", {read: false})
      .pipe(rimraf());
  });

  gulp.task("clean-tmp", function () {
    return gulp.src("tmp", {read: false})
      .pipe(rimraf());
  });

  gulp.task("clean", ["clean-dist", "clean-tmp"]);

  // Defined method of updating:
  // Semantic
  gulp.task("bump", function(){
    return gulp.src(["./package.json", "./bower.json"])
    .pipe(bump({type:"patch"}))
    .pipe(gulp.dest("./"));
  });

  gulp.task("lint", function() {
    return gulp.src("src/**/*.js")
      .pipe(jshint())
      .pipe(jshint.reporter("jshint-stylish"))
      .pipe(jshint.reporter("fail"));
  });

  gulp.task("angular:html2js", function() {
    return gulp.src("src/angular/*.html")
      .pipe(html2js({
        outputModuleName: "risevision.widget.common.google-drive-picker",
        useStrict: true,
        base: "src/angular"
      }))
      .pipe(rename({extname: ".js"}))
      .pipe(gulp.dest("tmp/ng-templates"));
  });

  gulp.task("angular", ["angular:html2js", "lint"], function () {
    return gulp.src([
      "src/angular/dtv-google-drive-picker.js",
      "tmp/ng-templates/*.js",
      "src/angular/svc-gapi.js",
      "src/angular/svc-auth.js",
      "src/angular/svc-picker.js"])
      .pipe(concat("google-drive-picker.js"))
      .pipe(gulp.dest("dist/js/angular"));
  });

  gulp.task("js-uglify", ["angular"], function () {
    gulp.src("dist/js/**/*.js")
      .pipe(uglify())
      .pipe(rename(function (path) {
        path.basename += ".min";
      }))
      .pipe(gulp.dest("dist/js"));
  });

  gulp.task("build", function (cb) {
    runSequence(["clean"], ["js-uglify"], cb);
  });

  gulp.task("e2e:server", factory.testServer());
  gulp.task("e2e:server-close", factory.testServerClose());

  gulp.task("webdriver_update", factory.webdriveUpdate());
  gulp.task("test:e2e:ng:core", factory.testE2EAngular());
  gulp.task("test:ensure-directory", factory.ensureReportDirectory());

  gulp.task("test:e2e:ng", ["test:ensure-directory", "webdriver_update"], function (cb) {
    return runSequence("e2e:server", "test:e2e:ng:core",
    function (err) {
      gulp.run("e2e:server-close");
      cb(err);
    });
  });

  gulp.task("test:unit:ng", factory.testUnitAngular({
    testFiles: [
      "components/q/q.js",
      "components/angular/angular.js",
      "components/angular-mocks/angular-mocks.js",
      "components/angular-translate/angular-translate.js",
      "components/rv-common-i18n/dist/i18n.js",
      "node_modules/widget-tester/mocks/i18n-config.js",
      "node_modules/widget-tester/mocks/gapi-picker-mock.js",
      "src/angular/*.js",
      "test/unit/**/*spec.js"
    ]
  }));

  gulp.task("test", ["build"], function (cb) {
    return runSequence("test:unit:ng", "test:e2e:ng", cb);
  });

  gulp.task("default", ["build"]);

})();
