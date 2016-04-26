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
