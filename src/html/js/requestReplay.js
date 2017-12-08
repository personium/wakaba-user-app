var rr = {};

getNamesapces = function() {
    return ['common', 'glossary', 'requestReplay'];
};

additionalCallback = function() {
    rr.getReceiveMessage();
    Common.setIdleTime();
}

rr.getReceiveMessage = function() {
//検索結果を表示し、メール送信先を作成する
    $(function() {

  //初期値
        var token = "Bearer " + Common.token;
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
                messageTitle = i18next.t("glossary:notSubject");
            }
            var messageBodyParse = JSON.parse(response.d.results.Body.replace( /'/g , "" ));
            var messageBodyText = messageBodyParse.Body;
            var messageBodyUse = messageBodyParse.Text;
            var messageBodyType = messageBodyParse.Type;
            var listHtml = "";
            listHtml += '<h3 data-i18n="requestReplay:dataRequest"></h3>';
            listHtml += '<div class="sizeCaption" data-i18n="requestReplay:selectProvideDataMessage"></div>';
            listHtml += '<div>';
            listHtml += '<input type="checkbox" id="data01" checked="checked" disabled="disabled">';
            listHtml += '<label for="data01" id ="data01Label"></label>';
            listHtml += '</div>';
            listHtml += '<ul class="itemization">';
            listHtml += '<li data-i18n="glossary:provideData.sex"></li>';
            listHtml += '<li data-i18n="glossary:provideData.age"></li>';
            listHtml += '<li data-i18n="glossary:provideData.area"></li>';
            if (messageBodyType == "2") {
              listHtml += '<li data-i18n="glossary:provideData.stress.stressData"></li>';
              listHtml += '<li data-i18n="glossary:provideData.stress.comment"></li>';
            } else {
              listHtml += '<li data-i18n="glossary:provideData.calsml.mealRecord"></li>';
              listHtml += '<li data-i18n="glossary:provideData.calsml.shootingDate"></li>';
              listHtml += '<li data-i18n="glossary:provideData.calsml.comment"></li>';
            }
            listHtml += '</ul>';
            $('#providedInfo').prepend(listHtml).localize();

            if ( messageBodyParse.sendCount == null ) {
                var denominator = Math.floor(Math.random() * 50) + 51
            } else {
                var denominator = messageBodyParse.sendCount;
            }
            var numerator = sessionStorage.getItem("ApprovalNum");
            $('#consenteesNumber').attr("data-i18n", "requestReplay:consenteesNumber").localize({num: numerator, den:denominator});

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
                $('#data01Label').attr("data-i18n", "[html]glossary:dataSetLabel").localize({name: displayName});
            }).fail(function(response){
                console.log(JSON.stringify(response));
            });
            $('#requestTitle').html(messageTitle);
            messageBodyText = messageBodyText.replace(/\r?\n/g, '<br>');
            $('#requestText').html(messageBodyText);
            messageBodyUse = messageBodyUse.replace(/\r?\n/g, '<br>');
            $('#requestUse').html(messageBodyUse);
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
                replayMessage.Body = i18next.t("requestReplay:approvedRequest");
                rr.sendReplay(replayMessage).done(function(){
                    alert(i18next.t("requestReplay:requestApproved"));
                location.href = "./LLMessage.html";
                });
            }).fail(function(response){
                console.log(response.responseJSON.code);
                console.log(JSON.stringify(response));
                if ( response.responseJSON.code == "PR400-RM-0001" ) {
                    alert(i18next.t("requestReplay:alreadyRequestApproved"));
                    location.href = "./LLMessage.html";
                } else {
                    alert(i18next.t("requestReplay:failedRequestApproved", {msg: JSON.stringify(response)}));
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
                replayMessage.Body = i18next.t("glossary:cancelDataProvision");
                rr.sendReplay(replayMessage).done(function(){
                    alert(i18next.t("requestReplay:refusedDataProvision"));
                    location.href = "./LLMessage.html";
                });
            }).fail(function(response){
                alert(i18next.t("requestReplay:failedRefusedDataProvision", {msg: JSON.stringify(response)}));
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
