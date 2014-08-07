var CONFIG = {
  GOOGLE_CLIENT_ID: "614513768474.apps.googleusercontent.com"
};

if(typeof TEMPLATES === 'undefined') {var TEMPLATES = {};}
TEMPLATES['google-drive-picker-template.html'] = "<button type=\"button\" class=\"btn btn-link btn-google\"><img src=\"/img/widget-icon-drive-1x.png\"></button>\n" +
    ""; 
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

/*  Copyright © 2014 Rise Vision Incorporated.
 *  Use of this software is governed by the GPLv3 license
 *  (reproduced in the LICENSE file).
 */
;(function (RiseVision, $, window, document, TEMPLATES, undefined) {
  "use strict";

  var _pluginName = "googleDrivePicker";

  function Plugin(element, options) {

    var authorization = RiseVision.Authorization,
      AUTH_SCOPE = "https://www.googleapis.com/auth/drive",
      EVENT_PICKED = "picked",
      EVENT_OPEN = "open",
      EVENT_CANCEL = "cancel",

      _$element = $(element),
      _$button = null,
      _origin,
      _pickerApiLoaded = false,
      _viewMap = {},
      _viewId = options.viewId || "docs",
      _pickerVisible = false;

    function _getViewId() {
      return _viewId;
    }

    function _setViewId(value) {
      if (typeof value === "string") {
        _viewId = value;
      }
    }

    function _isPickerVisible() {
      return _pickerVisible;
    }

    function _onPickerAction(data) {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        _$element.trigger(EVENT_PICKED, [data[google.picker.Response.DOCUMENTS]]);
        _pickerVisible = false;
      } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
        _$element.trigger(EVENT_CANCEL);
        _pickerVisible = false;
      }
    }

    function _createPicker() {
      if (_pickerApiLoaded && authorization.getAuthToken()) {
        var picker = new google.picker.PickerBuilder()
          .setOrigin(_origin)
          .addView(_viewMap[_viewId])
          .setOAuthToken(authorization.getAuthToken())
          .setCallback(_onPickerAction)
          .build();

        picker.setVisible(true);
        _pickerVisible = true;

        _$element.trigger(EVENT_OPEN);
      }
    }

    function _onPickerApiLoaded() {
      _pickerApiLoaded = true;
      _viewMap = {
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

      _createPicker();
    }

    function _bind() {
      _$button.on("click", function () {
        if (_pickerApiLoaded && authorization.getAuthToken()) {
          _createPicker();
          return;
        }

        if (!authorization.getAuthToken()) {
          // Initiate the authorization this time with UI (immediate = false)
          authorization.authorize(false, AUTH_SCOPE, function (oauthToken) {
            if (oauthToken) {
              gapi.load('picker', {"callback": _onPickerApiLoaded });
            }
          });
          return;
        }

        if (!_pickerApiLoaded) {
          gapi.load("picker", {"callback": _onPickerApiLoaded });
        }
      });
    }

    function _init() {
      var parser = document.createElement("a");

      // Get the HTML markup from the template.

      _$element.append(TEMPLATES["google-drive-picker-template.html"]);

      _$button = _$element.find(".btn-google");

      if (document.referrer) {
        parser.href = document.referrer;
        _origin = parser.protocol + "//" + parser.hostname;
      } else {
        /* Testing component locally (http://localhost:8099), so component is
         not within an iframe
          */
        _origin = window.location.protocol + "//" + window.location.host;
      }

      if (!authorization.isApiLoaded()) {
        authorization.loadApi(function () {
          // Initiate the authorization without UI (immediate = true)
          authorization.authorize(true, AUTH_SCOPE, function () {
            _bind();
          });

        });
      } else {
        _bind();
      }
    }

    _init();

    return {
      getViewId: _getViewId,
      setViewId: _setViewId,
      isPickerVisible: _isPickerVisible
    };
  }

  /*
   *  A lightweight plugin wrapper around the constructor that prevents
   *  multiple instantiations.
   */
  $.fn.googleDrivePicker = function (options) {
    return this.each(function () {
      if (!$.data(this, "plugin_" + _pluginName)) {
        $.data(this, "plugin_" + _pluginName, new Plugin(this, options));
      }
    });
  };
})(RiseVision, jQuery, window, document, TEMPLATES);
