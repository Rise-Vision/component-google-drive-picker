(function (angular) {

  "use strict";

  angular.module("risevision.widget.common.google-drive-picker", ["risevision.common.i18n"])
    .directive("googleDrivePicker", ["$window", "$document", "$log", "$templateCache", "apiAuth", "apiGooglePicker",
      function ($window, $document, $log, $templateCache, apiAuth, apiGooglePicker) {
      return {
        restrict: "E",
        scope: {
          viewId: "@"
        },
        template: $templateCache.get("google-drive-picker-template.html"),
        link: function (scope, $element, attrs) {
          var document = $document[0],
            viewId = attrs.viewId || "docs";

          function onPickerAction(data) {
            apiGooglePicker.get().then(function (google) {
              if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                $log.debug("Files picked", data[google.picker.Response.DOCUMENTS]);
                scope.$emit("picked", data[google.picker.Response.DOCUMENTS]);
              }
              else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
                $log.debug("File pick cancelled");
                scope.$emit("cancel");
              }
            });
          }

          function createPicker(google) {
            var parser = document.createElement("a"),
              origin,
              picker;

            if (document.referrer) {
              if (document.location.hostname === "localhost") {
                // Component is within an iframe, but likely within a widget settings tested locally (localhost:8000)
                origin = $window.location.protocol + "//" + $window.location.host;
              } else {
                // Component is within an iframe
                parser.href = document.referrer;
                origin = parser.protocol + "//" + parser.hostname;
              }
            } else {
              // Component is not within an iframe, likely testing locally in this repo (localhost:8099)
              origin = $window.location.protocol + "//" + $window.location.host;
            }

            picker = new google.picker.PickerBuilder()
              .setOrigin(origin)
              .addView(viewId)
              .setOAuthToken(apiAuth.getAuthToken())
              .setCallback(onPickerAction)
              .build();

            picker.setVisible(true);
          }

          $element.on("click", function () {
            if (apiAuth.getAuthToken()) {
              apiGooglePicker.get().then(createPicker);
            }
            else if (!apiAuth.getAuthToken()) {
              // Authorize this time with UI (immediate = false)
              apiAuth.authorize(false)
                .then(function (authResult) {
                  if (authResult && !authResult.error) {
                    apiGooglePicker.get().then(createPicker);
                  }
                });
            }
          });

          // Silently try to authorize(immediate = true)
          apiAuth.authorize(true)
            .then(null, function (error) {
              $log.warn(error);
            });
        }
      };
    }]);

})(angular);

(function(module) {
try { module = angular.module("risevision.widget.common.google-drive-picker"); }
catch(err) { module = angular.module("risevision.widget.common.google-drive-picker", []); }
module.run(["$templateCache", function($templateCache) {
  "use strict";
  $templateCache.put("google-drive-picker-template.html",
    "<div class=\"google-drive-picker\">\n" +
    "  <button type=\"button\" class=\"btn btn-default\">\n" +
    "    {{\"google-drive-picker.select\" | translate }}\n" +
    "    <img class=\"icon-right\" src=\"//s3.amazonaws.com/Rise-Images/Icons/drive.svg\">\n" +
    "  </button>\n" +
    "</div>\n" +
    "");
}]);
})();

/* jshint ignore:start */
var isClientJS = false;
function handleClientJSLoad() {
  isClientJS = true;

  var evt = document.createEvent("Events");
  evt.initEvent("gapi.loaded", true, true);

  window.dispatchEvent(evt);
}
/* jshint ignore:end */

(function (angular) {
  "use strict";

  angular.module("risevision.widget.common.google-drive-picker")
    .factory("oauthAPILoader", ["$q", "$log", "gapiLoader",
      function ($q, $log, gapiLoader) {
        var deferred = $q.defer();
        var promise;

        var factory = {
          get: function () {
            if (!promise) {
              promise = deferred.promise;
              gapiLoader.get().then(function (gApi) {
                gApi.load("auth", function () {
                  $log.info("auth API is loaded");
                  deferred.resolve(gApi);
                });
              });
            }
            return promise;
          }
        };
        return factory;

      }])
    .factory("gapiLoader", ["$q", "$window",
      function ($q, $window) {

        var factory = {
          get: function () {
            var deferred = $q.defer(),
              gapiLoaded;

            if ($window.isClientJS) {
              deferred.resolve($window.gapi);
            } else {
              gapiLoaded = function () {
                deferred.resolve($window.gapi);
                $window.removeEventListener("gapi.loaded", gapiLoaded, false);
              };
              $window.addEventListener("gapi.loaded", gapiLoaded, false);
            }
            return deferred.promise;
          }
        };
        return factory;

      }])
    .factory("pickerLoader", ["$q", "$window", "$log", "gapiLoader",
      function($q, $window, $log, gapiLoader) {

        var factory = {
          get: function () {
            var deferred = $q.defer();
            var promise;

            if (!promise) {
              promise = deferred.promise;
              gapiLoader.get().then(function (gApi) {
                gApi.load("picker", function () {
                  $log.info("picker API is loaded");
                  deferred.resolve(gApi);
                });
              });
            }
            return promise;
          }
        };

        return factory;

      }]);

})(angular);



(function(angular) {
  "use strict";

  angular.module("risevision.widget.common.google-drive-picker")

    .value("CLIENT_ID", "614513768474.apps.googleusercontent.com")
    .value("SCOPE", ["https://www.googleapis.com/auth/drive"])

    .factory("apiAuth", ["$q", "$http", "$log", "gapiLoader", "oauthAPILoader", "CLIENT_ID", "SCOPE",
      function($q, $http, $log, gapiLoader, oauthAPILoader, CLIENT_ID, SCOPE) {

        var oauthToken = null,
          factory = {};

        factory.authorize = function(attemptImmediate) {
          var authorizeDeferred = $q.defer();

          var opts = {
            client_id: CLIENT_ID,
            scope: SCOPE,
            immediate: attemptImmediate
          };

          oauthAPILoader.get().then(function (gApi) {
            gApi.auth.authorize(opts, function (authResult) {

              if (authResult && !authResult.error) {
                oauthToken = authResult.access_token;
                authorizeDeferred.resolve(authResult);
              } else {
                authorizeDeferred.reject("Authentication Error: " + authResult.error);
                $log.debug("authorize result", authResult);
              }
            });
          });
          return authorizeDeferred.promise;
        };

        factory.getAuthToken = function () {
          return oauthToken;
        };

        return factory;

      }]);

})(angular);



(function(angular) {
  "use strict";

  angular.module("risevision.widget.common.google-drive-picker")

    .factory("apiGooglePicker", ["$q", "$window", "$log", "pickerLoader",
      function ($q, $window, $log, pickerLoader) {
        var deferred = $q.defer();
        var promise;

        var factory = {
          get: function () {
            if (!promise) {
              promise = deferred.promise;
              pickerLoader.get().then(function () {
                deferred.resolve($window.google);
              });
            }
            return promise;
          }
        };

        return factory;

      }]);

})(angular);
