var rr = {};

$(document).ready(function() {
    var appUrlMatch = location.href.split("#");
    var appUrlSplit = appUrlMatch[0].split("/");
    rr.appUrl = appUrlSplit[0] + "//" + appUrlSplit[2] + "/" + appUrlSplit[3] + "/";
    if (appUrlSplit[0].indexOf("file:") == 0) {
        rr.appUrl = "https://demo.personium.io/hn-ll-app/";
    }

    var hash = location.hash.substring(1);
    var params = hash.split("&");
    for (var i in params) {
        var param = params[i].split("=");
        var id = param[0];
        switch (id) {
            case "target":
                Common.target = param[1];
                sessionStorage.setItem("ISTarget", param[1]);
                var urlSplit = param[1].split("/");
                Common.cellUrl = urlSplit[0] + "//" + urlSplit[2] + "/" + urlSplit[3] + "/";
                sessionStorage.setItem("ISCellUrl", Common.cellUrl);
                var split = Common.target.split("/");
                lm.boxName = split[split.length - 1];
            case "token":
                Common.token = param[1];
                sessionStorage.setItem("ISToken", param[1]);
            case "ref":
                Common.refToken = param[1];
                sessionStorage.setItem("ISRefToken", param[1]);
            case "expires":
                Common.expires = param[1];
                sessionStorage.setItem("ISExpires", param[1]);
            case "refexpires":
                Common.refExpires = param[1];
                sessionStorage.setItem("ISRefExpires", param[1]);
        }
    }

    if (rr.checkParam()) {
       rr.getReceiveMessage();
    }

    //Common.setIdleTime();
});

rr.getReceiveMessage = function() {
//検索結果を表示し、メール送信先を作成する
    $(function() {

  //初期値
        var token = "Bearer " + Common.token
        var messageId = sessionStorage.getItem("LMMessageID");
        var getMessageUrl = Common.cellUrl + "__ctl/ReceivedMessage('" + messageId + "')";
        var ackMessageUrl = Common.cellUrl + "__message/received/" + messageId ;
        var sendMessageUrl = Common.cellUrl + "__message/send";
        sessionStorage.setItem("RRtoken" ,token);
        sessionStorage.setItem("RRmessageId" ,messageId);
        sessionStorage.setItem("RRgetMessageUrl" ,getMessageUrl);
        sessionStorage.setItem("RRackMessageUrl" ,ackMessageUrl);
        sessionStorage.setItem("RRsendMessageUrl" ,sendMessageUrl);

        rr.getMessage().done(function(response){
            var messageTitle = response.d.results.Title;
            if (messageTitle == null) {
                messageTitle = "件名なし";
            }
            var messageBodyParse = JSON.parse(response.d.results.Body.replace( /'/g , "" ));
            var messageBodyText = messageBodyParse.Body;
            var messageBodyUse = messageBodyParse.Text;
            var messageBodyType = messageBodyParse.Type;
            var listHtml = "";
            listHtml += '<h3>データリクエスト</h3>';
            listHtml += '<div class="sizeCaption">提供するデータを選んでください。</div>';
            listHtml += '<div>';
            listHtml += '<input type="checkbox" id="data01" checked="checked" disabled="disabled">';
            listHtml += '<label for="data01" id ="data01Label"></label>';
            listHtml += '</div>';
            listHtml += '<ul class="itemization">';
            listHtml += '<li>性別</li>';
            listHtml += '<li>年齢</li>';
            listHtml += '<li>地域</li>';
            if (messageBodyType == "2") {
              listHtml += '<li>ストレスデータ</li>';
              listHtml += '<li>コメント</li>';
            } else {
              listHtml += '<li>食事記録（写真）</li>';
              listHtml += '<li>撮影日時</li>';
              listHtml += '<li>コメント</li>';
            }
            listHtml += '</ul>';
            /*
            listHtml += '<div class="request-btn-area">';
            listHtml += '<button class="round-btn" id="acceptRequest">提供する</button>';
            listHtml += '</div>';
            listHtml += '<div class="request-btn-area">';
            listHtml += '<button class="round-btn negative" id="rejectRequest">リクエストを拒否</button>';
            listHtml += '</div>';
            */
            $('#providedInfo').prepend(listHtml);

            if ( messageBodyParse.sendCount == null ) {
                var denominator = Math.floor(Math.random() * 50) + 51
            } else {
                var denominator = messageBodyParse.sendCount;
            }
            var numerator = sessionStorage.getItem("ApprovalNum");
            $('#consenteesNumber').html(numerator + '/' + denominator + '人');

            var messageBodyImgUrl = messageBodyParse.ImgUrl;
            if (messageBodyImgUrl != null) {
                $('img#randomImage').attr({"src":messageBodyImgUrl});
            }
            var getProfileUrl = response.d.results.From + "__/profile.json";
            sessionStorage.setItem("RRgetProfileUrl", getProfileUrl);
            rr.getProfile().done(function(response){
                var displayName = response.DisplayName;
                var displayImage = response.Image
                $('img#requestIcon').attr({"src":displayImage});
                $('#requestName').html(displayName);
                $('#data01Label').html(displayName + 'のデータ一式');
            }).fail(function(response){
                console.log(JSON.stringify(response));
            });
            $('#requestTitle').html(messageTitle);
            messageBodyText = messageBodyText.replace(/\r?\n/g, '<br>');
            $('#requestText').html('<h3>説明</h3><div class="sizeCaption">' + messageBodyText + '</div>');
            messageBodyUse = messageBodyUse.replace(/\r?\n/g, '<br>');
            $('#requestUse').html('<h3>利用目的</h3><div class="sizeCaption">' + messageBodyUse + '</div>');
            var replayMessage = {};
            replayMessage.To = response.d.results.From;
            replayMessage.Type = response.d.results.message;
            replayMessage.Title = "RE: " + response.d.results.Title;
            replayMessage.InReplyTo = response.d.results.__id;
            sessionStorage.setItem("RRreplayMassage" , JSON.stringify(replayMessage));
        });

    //承諾ボタンを押したとき
        $('#acceptRequest').on('click', function() {
            var ackBody = {};
            ackBody.Command = "approved";
            rr.requestReplay(ackBody).done(function(){
                var replayMessage = JSON.parse(sessionStorage.getItem("RRreplayMassage"));
                replayMessage.Body = "データ提供依頼が承認されました";
                rr.sendReplay(replayMessage).done(function(){
                    alert("データ提供依頼を承認しました");
                location.href = "./LLMessage.html";
                });
            }).fail(function(response){
                console.log(response.responseJSON.code);
                console.log(JSON.stringify(response));
                if ( response.responseJSON.code == "PR400-RM-0001" ) {
                    var ackBody = {};
                    ackBody.Command = "rejected";
                    rr.requestReplay(ackBody).done(function(){
                        var replayMessage = JSON.parse(sessionStorage.getItem("RRreplayMassage"));
                        replayMessage.Body = "データ提供依頼承認済みです";
                        rr.sendReplay(replayMessage).done(function(){
                            alert("データ提供依頼承認済みです");
                            location.href = "./LLMessage.html";
                        });
                    });
                } else {
                    console.log(JSON.stringify(response));
                    alert("データ提供依頼の回答に失敗しました\n" + JSON.stringify(response));
                    location.href = "./LLMessage.html";
                }
            });
        });

    //拒否ボタンを押したとき
        $('#rejectRequest').on('click', function() {
            var ackBody = {};
            ackBody.Command = "rejected";
            rr.requestReplay(ackBody).done(function(){
                var replayMessage = JSON.parse(sessionStorage.getItem("RRreplayMassage"));
                replayMessage.Body = "データ提供依頼が拒否されました";
                rr.sendReplay(replayMessage).done(function(){
                    alert("データ提供依頼を拒否しました");
                    location.href = "./LLMessage.html";
                });
            }).fail(function(response){
                alert("データ提供依頼の拒否に失敗しました\n" + JSON.stringify(response));
                location.href = "./LLMessage.html";
            });
        });
    });
}

rr.getMessage =  function(){
    return $.ajax({
        type: "GET",
        url: sessionStorage.getItem("RRgetMessageUrl"),
        headers: {
            'Authorization': sessionStorage.getItem("RRtoken"),
            'Accept':'application/json'
        }
    });
}

rr.requestReplay = function(ackBody){
    return $.ajax({
        type: 'POST',
        url: sessionStorage.getItem("RRackMessageUrl"),
        dataType: 'json',
        headers: {
            'Authorization': sessionStorage.getItem("RRtoken"),
            'Accept': 'application/json'},
        data: JSON.stringify(ackBody)
    });
};

rr.sendReplay = function(replayMessage){
    return $.ajax({
        type: 'POST',
        url: sessionStorage.getItem("RRsendMessageUrl"),
        dataType: 'json',
        headers: {
            'Authorization': sessionStorage.getItem("RRtoken"),
            'Accept': 'application/json'},
        data: JSON.stringify(replayMessage)
    });
};

rr.getProfile = function(){
    return $.ajax({
        type: 'GET',
        url: sessionStorage.getItem("RRgetProfileUrl"),
        dataType: 'json',
    });
};

rr.checkParam = function() {
    var msg = "";
    if (Common.target === null) {
        msg = '対象セルが設定されていません。';
    } else if (Common.token === null) {
        msg = 'トークンが設定されていません。';
    } else if (Common.refToken === null) {
        msg = 'リフレッシュトークンが設定されていません。';
    } else if (Common.expires === null) {
        msg = 'トークンの有効期限が設定されていません。';
    } else if (Common.refExpires === null) {
        msg = 'リフレッシュトークンの有効期限が設定されていません。';
    }

    if (msg.length > 0) {
        $('#errorMsg').html(msg);
        $('#errorMsg').css("display", "block");
        $("#exeSearch").prop('disabled', true);
        return false;
    }
    return true;
};
