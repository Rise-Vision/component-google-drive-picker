var CONFIG = {
  GOOGLE_CLIENT_ID: "614513768474.apps.googleusercontent.com"
};

if (typeof RiseVision === "undefined") {
  var RiseVision = {Authorization: {}};
}

;(function (CONFIG, gapi, RiseVision) {
  "use strict";

  RiseVision.Authorization = (function () {

    var oauthToken = null,
      loaded = false;

    function authorize(immediate, scope, callbackFn) {
      gapi.auth.authorize({
        client_id : CONFIG.GOOGLE_CLIENT_ID,
        scope : scope,
        immediate : immediate
      }, function (authResult) {
        if (authResult && !authResult.error) {
          oauthToken = authResult.access_token;
        } else {
          if (window.console) {
            console.info("Authorization Fail: " + authResult.error);
          }
        }
        callbackFn.call(null, oauthToken);
      });
    }

    function isApiLoaded() {
      return loaded;
    }

    function loadApi(callbackFn) {
      // Use the API Loader script to load the Authentication script.
      gapi.load("auth", {"callback": function () {
        loaded = true;
        if (typeof callbackFn === "function") {
          callbackFn.apply(null);
        }
      }});
    }

    function getAuthToken() {
      return oauthToken;
    }

    return {
      authorize: authorize,
      getAuthToken: getAuthToken,
      isApiLoaded: isApiLoaded,
      loadApi: loadApi
    };
  })();
})(CONFIG, gapi, RiseVision);

/* global RiseVision: false */

(function (RiseVision) {

  "use strict";

  var authorization = RiseVision.Authorization,
    AUTH_SCOPE = "https://www.googleapis.com/auth/drive";

  angular.module("risevision.widget.common.google-drive-picker", [])
    .directive("googleDrivePicker", ["$document", "$window", "$log", "$templateCache",
      function ($document, $window, $log, $templateCache) {
      return {
        restrict: "E",
        scope: {
          viewId: "@"
        },
        template: $templateCache.get("google-drive-picker-template.html"),
        link: function (scope, $element, attrs) {
          var document = $document[0];
          var viewId = attrs.viewId || "docs";
          function create() {
            var google = $window.google,
                gapi = $window.gapi,
                pickerApiLoaded = false,
                viewMap = {
                  "docs": google.picker.ViewId.DOCS,
                  "docs_images": google.picker.ViewId.DOCS_IMAGES,
                  "documents": google.picker.ViewId.DOCUMENTS,
                  "presentations": google.picker.ViewId.PRESENTATIONS,
                  "spreadsheets": google.picker.ViewId.SPREADSHEETS,
                  "forms": google.picker.ViewId.FORMS,
                  "docs_images_and_videos": google.picker.ViewId.DOCS_IMAGES_AND_VIDEOS,
                  "docs_videos": google.picker.ViewId.DOCS_VIDEOS,
                  "folders": google.picker.ViewId.FOLDERS,
                  "pdfs": google.picker.ViewId.PDFS
                };

            function onPickerAction(data) {
              if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                $log.debug("Files picked", data[google.picker.Response.DOCUMENTS]);
                scope.$emit("picked", data[google.picker.Response.DOCUMENTS]);
              }
              else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
                $log.debug("File pick cancelled");
                scope.$emit("cancel");
              }
            }

            function createPicker() {
              var parser = document.createElement("a"),
                origin,
                picker;

              if (document.referrer) {
                parser.href = document.referrer;
                origin = parser.protocol + "//" + parser.hostname;
              } else {
                /* Testing component locally (http://localhost:8099), so component is
                 not within an iframe
                 */
                origin = $window.location.protocol + "//" + $window.location.host;
              }

              if (pickerApiLoaded && authorization.getAuthToken()) {
                picker = new google.picker.PickerBuilder()
                  .setOrigin(origin)
                  .addView(viewMap[viewId])
                  .setOAuthToken(authorization.getAuthToken())
                  .setCallback(onPickerAction)
                  .build();

                picker.setVisible(true);
              }
            }

            function onPickerApiLoaded() {
              pickerApiLoaded = true;
              createPicker();
            }

            $element.on("click", function () {
              if (pickerApiLoaded && authorization.getAuthToken()) {
                createPicker();
                return;
              }
              else if (!authorization.getAuthToken()) {
                // Initiate the authorization this time with UI (immediate = false)
                authorization.authorize(false, AUTH_SCOPE, function (oauthToken) {
                  if (oauthToken) {
                    gapi.load("picker", {callback: onPickerApiLoaded });
                  }
                });
                return;
              }

              if (!pickerApiLoaded) {
                gapi.load("picker", {callback: onPickerApiLoaded });
              }
            });
          }

          if (!authorization.isApiLoaded()) {
            authorization.loadApi(function () {
              // Initiate the authorization without UI (immediate = true)

              authorization.authorize(true, AUTH_SCOPE, function () {
                $window.gapi.load("picker", {callback: create });
              });
            });
          } else {
            create();
          }
        }
      };
    }]);

})(RiseVision);

(function(module) {
try { app = angular.module("risevision.widget.common.google-drive-picker"); }
catch(err) { app = angular.module("risevision.widget.common.google-drive-picker", []); }
app.run(["$templateCache", function($templateCache) {
  "use strict";
  $templateCache.put("google-drive-picker-template.html",
    "<button type=\"button\" class=\"btn btn-link btn-google\"><img src=\"/img/widget-icon-drive-1x.png\"></button>\n" +
    "");
}]);
})();
