var Common = {};

Common.target = sessionStorage.getItem("ISTarget");
Common.cellUrl = sessionStorage.getItem("ISCellUrl");
Common.token = sessionStorage.getItem("ISToken");
Common.refToken = sessionStorage.getItem("ISRefToken");
Common.expires = sessionStorage.getItem("ISExpires");
Common.refExpires = sessionStorage.getItem("ISRefExpires");

Common.IDLE_TIMEOUT =  3600000;
Common.LASTACTIVITY = new Date().getTime();

// This method checks idle time
Common.setIdleTime = function() {
    // Create Session Expired Modal
    Common.createSessionExpired();

    Common.refreshTokenAPI().done(function(data) {
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
    html = '<div id="modal-session-expired" class="modal fade" role="dialog" data-backdrop="static">';
    html += '<div class="modal-dialog">';
    html += '<div class="modal-content">';
    html += '<div class="modal-header login-header">';
    html += '<h4 class="modal-title">Session out</h4>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += 'セッションが切れました。アプリを再起動して下さい。';
    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button type="button" class="btn btn-primary" id="b-session-relogin-ok" >Close</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

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
    Common.refreshTokenAPI().done(function(data) {
        Common.token = data.access_token;
        Common.refToken = data.refresh_token;
        Common.expires = data.expires_in;
        Common.refExpires = data.refresh_token_expires_in;
        sessionStorage.setItem("ISToken", data.access_token);
        sessionStorage.setItem("ISRefToken", data.refresh_token);
        sessionStorage.setItem("ISExpires", data.expires_in);
        sessionStorage.setItem("ISRefExpires", data.refresh_token_expires_in);
    });
};

Common.refreshTokenAPI = function() {
    return $.ajax({
        type: "POST",
        url: Common.cellUrl + '__token',
        processData: true,
        dataType: 'json',
        data: {
               grant_type: "refresh_token",
               refresh_token: Common.refToken
        },
        headers: {'Accept':'application/json'}
    })
};

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