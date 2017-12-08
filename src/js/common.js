var Common = {};

Common.target = sessionStorage.getItem("ISTarget");
Common.cellUrl = sessionStorage.getItem("ISCellUrl");
Common.token = sessionStorage.getItem("ISToken");
Common.refToken = sessionStorage.getItem("ISRefToken");
Common.expires = sessionStorage.getItem("ISExpires");
Common.refExpires = sessionStorage.getItem("ISRefExpires");

//Default timeout limit - 60 minutes.
Common.IDLE_TIMEOUT =  3600000;
// 55 minutes
Common.IDLE_CHECK = 3300000;
Common.LASTACTIVITY = new Date().getTime();
const APP_URL = "https://demo.personium.io/hn-ll-user-app/";

$(document).ready(function() {
    i18next
    .use(i18nextXHRBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
        fallbackLng: 'en',
        ns: getNamesapces(),
        defaultNS: 'common',
        debug: true,
        backend: {
            // load from i18next-gitbook repo
            loadPath: './locales/{{lng}}/{{ns}}.json',
            crossDomain: true
        }
    }, function(err, t) {
        Common.initJqueryI18next();

        Common.setAppCellUrl();

        Common.setAccessData();

        if (!Common.checkParam()) {
            return;
        }

        Common.refreshToken(function() {
            Common.getBoxUrlAPI().done(function(data, textStatus, request) {
                let boxUrl = request.getResponseHeader("Location");
                console.log(boxUrl);
                Common.boxUrl = boxUrl + "/";
                if ((typeof additionalCallback !== "undefined") && $.isFunction(additionalCallback)) {
                    additionalCallback();
                }
            }).fail(function(error) {
                console.log(error.responseJSON.code);
                console.log(error.responseJSON.message.value);
            })
        });
        
        Common.updateContent();
    });
});

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

Common.setAppCellUrl = function() {
    var appUrlSplit = _.first(location.href.split("#")).split("/");

    if (_.contains(appUrlSplit, "localhost") || _.contains(appUrlSplit, "file:")) {
        Common.appUrl = APP_URL; // APP_URL must be defined by each App
    } else {
        Common.appUrl = _.first(appUrlSplit, 4).join("/") + "/"; 
    }

    return;
};

Common.getAppCellUrl = function() {
    return Common.appUrl;
};

Common.setAccessData = function() {
    var hash = location.hash.substring(1);
    var params = hash.split("&");
    for (var i in params) {
        var param = params[i].split("=");
        var id = param[0];
        switch (id) {
            case "cell":
                Common.cellUrl = param[1]; 
                sessionStorage.setItem("ISCellUrl", Common.cellUrl);
                break;
            case "refresh_token":
                Common.refToken = param[1];
                sessionStorage.setItem("ISRefToken", param[1]);
                break;
        }
    }
};

Common.getBoxUrlAPI = function() {
    return $.ajax({
        type: "GET",
        url: Common.cellUrl + "__box",
        headers: {
            'Authorization':'Bearer ' + Common.token,
            'Accept':'application/json'
        }
    });
};

Common.updateContent = function() {
    // start localizing, details:
    // https://github.com/i18next/jquery-i18next#usage-of-selector-function
    $('title').localize();
    $('[data-i18n]').localize();
}

// This method checks idle time
Common.setIdleTime = function() {
    // Create Session Expired Modal
    Common.createSessionExpired();

    //Common.refreshToken();

    setInterval(Common.checkIdleTime, Common.IDLE_CHECK);
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

Common.refreshToken = function(callback) {
    Common.getLaunchJson().done(function(launchObj){
        Common.getAppToken(launchObj.personal).done(function(appToken) {
            Common.getAppCellToken(appToken.access_token).done(function(data) {
                Common.token = data.access_token;
                Common.refToken = data.refresh_token;
                Common.expires = data.expires_in;
                Common.refExpires = data.refresh_token_expires_in;
                sessionStorage.setItem("ISToken", data.access_token);
                sessionStorage.setItem("ISRefToken", data.refresh_token);
                sessionStorage.setItem("ISExpires", data.expires_in);
                sessionStorage.setItem("ISRefExpires", data.refresh_token_expires_in);
    
                if ((typeof callback !== "undefined") && $.isFunction(callback)) {
                    callback();
                };
            }).fail(function(data) {
                $('#modal-session-expired').modal('show');
            });
        });
    });
};

Common.checkParam = function() {
    var msg = "";
    if (Common.cellUrl === null) {
        msg = 'msg.error.targetCellNotSelected';
    } else if (Common.refToken === null) {
        msg = 'msg.error.refreshTokenMissing';
    }

    if (msg.length > 0) {
        $('#errorMsg').attr("data-i18n", msg).localize();
        $('#errorMsg').css("display", "block");
        $("#exeSearch").prop('disabled', true);
        return false;
    }

    return true;
};

Common.getLaunchJson = function() {
    return $.ajax({
        type: "GET",
        url: Common.appUrl + "__/launch.json",
        headers: {
            'Authorization':'Bearer ' + Common.token,
            'Accept':'application/json'
        }
    });
}

Common.getAppCellToken = function(appCellToken) {
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

Common.getAppToken = function(personalInfo) {
    return $.ajax({
            type: "POST",
            url: Common.appUrl + "__token",
            processData: true,
            dataType: 'json',
            data: {
                    grant_type: "password",
                    username: personalInfo.appTokenId,
                    password: personalInfo.appTokenPw,
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