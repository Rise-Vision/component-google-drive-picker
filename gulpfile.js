(function () {
  "use strict";

  var gulp = require("gulp");
  var gutil = require("gulp-util");
  var html2string = require("gulp-html2string");
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

  var jsFiles = [
    "src/**/*.js",
    "test/**/*.js",
    "!./src/components/**/*"
  ];

  gulp.task("clean-dist", function () {
    return gulp.src("dist", {read: false})
      .pipe(rimraf());
  });

  gulp.task("clean-tmp", function () {
    return gulp.src("tmp", {read: false})
      .pipe(rimraf());
  });

  gulp.task("clean", ["clean-dist", "clean-tmp"]);

  gulp.task("config", function() {
    var env = process.env.NODE_ENV || "dev";
    gutil.log("Environment is", env);

    return gulp.src(["./src/config/" + env + ".js"])
      .pipe(rename("config.js"))
      .pipe(gulp.dest("./src/config"));
  });

  // Defined method of updating:
  // Semantic
  gulp.task("bump", function(){
    return gulp.src(["./package.json", "./bower.json"])
    .pipe(bump({type:"patch"}))
    .pipe(gulp.dest("./"));
  });

  gulp.task("lint", function() {
    return gulp.src(jsFiles)
      .pipe(jshint())
      .pipe(jshint.reporter("jshint-stylish"));
    // .pipe(jshint.reporter("fail"));
  });

  gulp.task("images", function () {
    return gulp.src("img/**/*.*", {base: "./"})
      .pipe(gulp.dest("dist"));
  });

  gulp.task("jquery:html2js", function () {
    return gulp.src("src/jquery/*.html")
      .pipe(html2string({ createObj: true, base: path.join(__dirname, "src/jquery"), objName: "TEMPLATES" }))
      .pipe(rename({extname: ".js"}))
      .pipe(gulp.dest("tmp/templates/"));
  });

  gulp.task("jquery", function () {
    return gulp.src([
      "src/config/config.js",
      "tmp/templates/*.js",
      "src/shared/js/*.js",
      "src/jquery/*.js"])

      .pipe(concat("google-drive-picker.js"))
      .pipe(gulp.dest("dist/js/jquery"));
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

  gulp.task("angular", ["angular:html2js"], function () {
    return gulp.src([
      "src/config/config.js",
      "src/shared/js/*.js",
      "src/angular/*.js",
      "tmp/ng-templates/*.js"])
      .pipe(concat("google-drive-picker.js"))
      .pipe(gulp.dest("dist/js/angular"));
  });

  gulp.task("js-prep", ["jquery:html2js", "angular:html2js","lint"], function (cb) {
    return runSequence("jquery", "angular", cb);
  });

  gulp.task("js-uglify", ["js-prep"], function () {
    gulp.src("dist/js/**/*.js")
      .pipe(uglify())
      .pipe(rename(function (path) {
        path.basename += ".min";
      }))
      .pipe(gulp.dest("dist/js"));
  });

  gulp.task("build", function (cb) {
    runSequence(["clean", "config"], ["images", "js-uglify"], cb);
  });

  gulp.task("e2e:server", factory.testServer());
  gulp.task("e2e:server-close", factory.testServerClose());

  gulp.task("test:e2e:core", factory.testE2E({
    testFiles: path.join(__dirname, "test", "e2e", "*test.js")
  }));

  // Test the jQuery version
  gulp.task("test:e2e", function(cb) {
    return runSequence("e2e:server", "test:e2e:core",
    function (err) {
      gulp.run("e2e:server-close");
      cb(err);
    });
  });

  gulp.task("webdriver_update", factory.webdriveUpdate());
  gulp.task("test:e2e:ng:core", factory.testE2EAngular());
  gulp.task("test:ensure-directory", factory.ensureReportDirectory());

  // Test the Angular version
  gulp.task("test:e2e:ng", ["test:ensure-directory", "webdriver_update"], function (cb) {
    return runSequence("e2e:server", "test:e2e:ng:core",
    function (err) {
      gulp.run("e2e:server-close");
      cb(err);
    });
  });

  gulp.task("test:metrics", factory.metrics());

  gulp.task("test", ["build"], function (cb) {
    return runSequence("test:e2e", "test:e2e:ng", "test:metrics", cb);
  });

  gulp.task("default", ["build"]);

})();
