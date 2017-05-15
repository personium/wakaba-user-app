var ad = {};

$(document).ready(function() {

  var appUrlMatch = location.href.split("#");
  var appUrlSplit = appUrlMatch[0].split("/");
  ad.appUrl = appUrlSplit[0] + "//" + appUrlSplit[2] + "/" + appUrlSplit[3] + "/";
  if (appUrlSplit[0].indexOf("file:") == 0) {
    ad.appUrl = "https://demo.personium.io/hn-ll-app/";
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

  if (ad.checkParam()) {
    ad.getProfile().done(function(response){
      var displayName = response.DisplayName;
      var displayImage = response.Image
      $('img#requestIcon').attr({"src":displayImage});
      $('#requestName').html(displayName);
    }).fail(function(response){
      console.log(JSON.stringify(response));
    });

    //メッセージ情報を取得
    ad.getApprovalMessage().done(function(res){
      console.log(res);
      var relName = res.d.results.RequestRelation.split("/");
      var approvalMessageTitle = res.d.results.Title;
      console.log(approvalMessageTitle);
      sessionStorage.setItem("RelName", relName[relName.length - 1]);
      sessionStorage.setItem("ApprovalMessageTitle", approvalMessageTitle);
      var approvalMessageBody = res.d.results.Body;
      approvalMessageBody = approvalMessageBody.substr(1);
      approvalMessageBody = approvalMessageBody.substr(0, approvalMessageBody.length-1 );
      pApprovalMessageBody = JSON.parse(approvalMessageBody);
      var messageBodyText = pApprovalMessageBody.Body;
      messageBodyText = messageBodyText.replace(/\r?\n/g, '<br>');
      var messageBodyUse = pApprovalMessageBody.Text;
      messageBodyUse =   messageBodyUse.replace(/\r?\n/g, '<br>');
      var requestType = pApprovalMessageBody.Type;

      $('#requestTitle').html(approvalMessageTitle);
      var messageBodyImgUrl = pApprovalMessageBody.ImgUrl;
      if (messageBodyImgUrl != null) {
        $('img#randomImage').attr({"src":messageBodyImgUrl});
      }
      $('#requestText').html('<h3>説明</h3><div class="sizeCaption">' + messageBodyText + '</div>');
      $('#requestUse').html('<h3>利用目的</h3><div class="sizeCaption">' + messageBodyUse + '</div>');

      var listHtml = "";
      listHtml += '<h3>提供中のデータ</h3>';
      ad.getProfile().done(function(response){
        var displayName = response.DisplayName;
        listHtml += '<div class="sizeBody" style="margin: 0 16px;">' + displayName + 'のデータ一式</div>'
        listHtml += '<ul class="itemization">';
        listHtml += '<li>性別</li>';
        listHtml += '<li>年齢</li>';
        listHtml += '<li>地域</li>';
        if (requestType == "2") {
          listHtml += '<li>ストレスデータ</li>';
          listHtml += '<li>コメント</li>';
        } else {
          listHtml += '<li>食事記録（写真）</li>';
          listHtml += '<li>撮影日時</li>';
          listHtml += '<li>コメント</li>';
        }
        listHtml += '</ul>';
        $('#providedInfo').prepend(listHtml);
      });

/*
      var requestType = pApprovalMessageBody.Type;
      console.log(requestType);
      var requestData = ""
      if (requestType == "2") {
        requestData = "ストレスデータ<br>性別<br>年齢<br>地域<br><br>";
      } else {
        requestData = "食事データ<br>性別<br>年齢<br>地域<br><br>";
      }
      $('#approvedDataList').html(requestData);
*/
      if ( pApprovalMessageBody.sendCount == null ) {
        var denominator = Math.floor(Math.random() * 50) + 51
      } else {
        var denominator = pApprovalMessageBody.sendCount;
      }
      var numerator = sessionStorage.getItem("ApprovalNum");
      $('#consenteesNumber').html(numerator + '/' + denominator);
    });

    //データ提供をやめるボタンを押したとき
    $('#rejectRequest').on('click', function() {
      var extCellUrl = encodeURIComponent(sessionStorage.getItem("ApprovalCellURL"));
      ad.deleteRelation$LinksListAPI(extCellUrl).done(function(){
        var rejectMessage = {};
        rejectMessage.To = sessionStorage.getItem("ApprovalCellURL");
        rejectMessage.Type = "message";
        rejectMessage.Title = "RE: " + sessionStorage.getItem("ApprovalMessageTitle");
        rejectMessage.Body = "データ提供がキャンセルされました";
        rejectMessage.InReplyTo = sessionStorage.getItem("ApprovalMessageID");
        ad.sendRejectMessage(rejectMessage).done(function(){
          alert("データ提供を終了しました");
          location.href = "./LLMessage.html";
        });
      }).fail(function(response){
        if (response.status == 404 ){
          var rejectMessage = {};
          rejectMessage.To = sessionStorage.getItem("ApprovalCellURL");
          rejectMessage.Type = "message";
          rejectMessage.Title = "RE: " + sessionStorage.getItem("ApprovalMessageTitle");
          rejectMessage.Body = "データ提供がキャンセルされました";
          rejectMessage.InReplyTo = sessionStorage.getItem("ApprovalMessageID");
          ad.sendRejectMessage(rejectMessage).done(function(){
          alert("データ提供を終了しました");
          location.href = "./LLMessage.html";
          });
        } else {
          alert("データ提供の終了に失敗しました\n" + JSON.stringify(response));
          location.href = "./LLMessage.html";
        }
      });
    });
  }
});

ad.getProfile = function(){
  return $.ajax({
    type: 'GET',
    url: sessionStorage.getItem("ApprovalCellURL") + '__/profile.json',
    dataType: 'json',
  });
};

ad.deleteRelation$LinksListAPI = function(extCellUrl) {
  return $.ajax({
    type: "DELETE",
    url: Common.cellUrl + '__ctl/Relation(\'' + sessionStorage.getItem("RelName") + '\')/$links/_ExtCell(\'' + extCellUrl + '\')?$orderby=__published%20desc',
    headers: {
      'Authorization':'Bearer ' + Common.token,
      'Accept':'application/json'
    }
  });
};

ad.sendRejectMessage = function(rejectMessage){
  return $.ajax({
    type: 'POST',
    url: Common.cellUrl + '__message/send',
    dataType: 'json',
    headers: {
      'Authorization':'Bearer ' + Common.token,
      'Accept': 'application/json'},
      data: JSON.stringify(rejectMessage)
    });
  };

ad.getApprovalMessage = function(){
    return $.ajax({
      type: 'GET',
      url: Common.cellUrl + '__ctl/ReceivedMessage(\'' + sessionStorage.getItem("ApprovalMessageID") + '\')',
      dataType: 'json',
      headers: {
        'Authorization':'Bearer ' + Common.token,
        'Accept': 'application/json'},
      });
    };

  ad.checkParam = function() {
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
