var Common = {};

Common.target = sessionStorage.getItem("ISTarget");
Common.cellUrl = sessionStorage.getItem("ISCellUrl");
Common.token = sessionStorage.getItem("ISToken");
Common.refToken = sessionStorage.getItem("ISRefToken");
Common.expires = sessionStorage.getItem("ISExpires");
Common.refExpires = sessionStorage.getItem("ISRefExpires");

Common.IDLE_TIMEOUT =  3600000;
Common.LASTACTIVITY = new Date().getTime();

/*
 * Need to move to a function to avoid conflicting with the i18nextBrowserLanguageDetector initialization.
 */
Common.initJqueryI18next = function() {
    // for options see
    // https://github.com/i18next/jquery-i18next#initialize-the-plugin
    jqueryI18next.init(i18next, $, {
        useOptionsAttr: true
    });
}

Common.updateContent = function() {
    // start localizing, details:
    // https://github.com/i18next/jquery-i18next#usage-of-selector-function
    $('title').localize();
    $('[data-i18n]').localize();
}

Common.AddResourceProfile = function(lng , ns, id, json) {
    if (json.DisplayName[lng]) {
        i18next.addResource(lng, ns, id + "_DisplayName", json.DisplayName[lng]);
    } else {
        i18next.addResource(lng, ns, id + "_DisplayName", json.DisplayName);
    }

    if (json.Description[lng]) {
        i18next.addResource(lng, ns, id + "_Description", json.Description[lng]);
    } else {
        i18next.addResource(lng, ns, id + "_Description", json.Description);
    }
};

// This method checks idle time
Common.setIdleTime = function() {
    // Create Session Expired Modal
    Common.createSessionExpired();

    Common.appGetTargetToken().done(function(appToken) {
        Common.refreshTokenAPI(appToken.access_token).done(function(data) {
            Common.token = data.access_token;
            Common.refToken = data.refresh_token;
            Common.expires = data.expires_in;
            Common.refExpires = data.refresh_token_expires_in;
            sessionStorage.setItem("ISToken", data.access_token);
            sessionStorage.setItem("ISRefToken", data.refresh_token);
            sessionStorage.setItem("ISExpires", data.expires_in);
            sessionStorage.setItem("ISRefExpires", data.refresh_token_expires_in);
        }).fail(function(data) {
            $('#modal-session-expired').modal('show');
        });
    });

    setInterval(Common.checkIdleTime, 3300000);
    document.onclick = function() {
      Common.LASTACTIVITY = new Date().getTime();
    };
    document.onmousemove = function() {
      Common.LASTACTIVITY = new Date().getTime();
    };
    document.onkeypress = function() {
      Common.LASTACTIVITY = new Date().getTime();
    };
}
Common.createSessionExpired = function() {
    var html = [
        '<div id="modal-session-expired" class="modal fade" role="dialog" data-backdrop="static">',
            '<div class="modal-dialog">',
                '<div class="modal-content">',
                    '<div class="modal-header login-header">',
                        '<h4 class="modal-title">Session out</h4>',
                    '</div>',
                    '<div class="modal-body" data-i18n="expiredSession">',
                    '</div>',
                    '<div class="modal-footer">',
                        '<button type="button" class="btn btn-primary" id="b-session-relogin-ok" >OK</button>',
                    '</div>',
                '</div>',
            '</div>',
        '</div>'
    ].join("");

    modal = $(html);
    $(document.body).append(modal);

    // append event
    $('#b-session-relogin-ok').on('click', function () {
        open(location, '_self').close();
    });
};
Common.checkIdleTime = function() {
  if (new Date().getTime() > Common.LASTACTIVITY + Common.IDLE_TIMEOUT) {
    $('#modal-session-expired').modal('show');
  } else {
      Common.refreshToken();
  }
};

Common.refreshToken = function() {
    Common.appGetTargetToken().done(function(appToken) {
        Common.refreshTokenAPI(appToken.access_token).done(function(data) {
            Common.token = data.access_token;
            Common.refToken = data.refresh_token;
            Common.expires = data.expires_in;
            Common.refExpires = data.refresh_token_expires_in;
            sessionStorage.setItem("ISToken", data.access_token);
            sessionStorage.setItem("ISRefToken", data.refresh_token);
            sessionStorage.setItem("ISExpires", data.expires_in);
            sessionStorage.setItem("ISRefExpires", data.refresh_token_expires_in);
        });
    });
};

Common.refreshTokenAPI = function(appCellToken) {
    return $.ajax({
        type: "POST",
        url: Common.cellUrl + '__token',
        processData: true,
        dataType: 'json',
        data: {
               grant_type: "refresh_token",
               refresh_token: Common.refToken,
               client_id: "https://demo.personium.io/hn-ll-user-app/",
               client_secret: appCellToken
        },
        headers: {'Accept':'application/json'}
    })
};

Common.appGetTargetToken = function() {
  return $.ajax({
                type: "POST",
                url: 'https://demo.personium.io/hn-ll-user-app/__token',
                processData: true,
		dataType: 'json',
                data: {
                        grant_type: "password",
			username: "tokenAcc",
			password: "personiumtoken",
                        p_target: Common.cellUrl
                },
		headers: {'Accept':'application/json'}
         });
}

Common.getTargetToken = function(extCellUrl) {
  return $.ajax({
                type: "POST",
                url: Common.cellUrl + '__token',
                processData: true,
		dataType: 'json',
                data: {
                        grant_type: "refresh_token",
                        refresh_token: Common.refToken,
                        p_target: extCellUrl
                },
		headers: {'Accept':'application/json'}
         });
};