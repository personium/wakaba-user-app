var ad = {};

getNamesapces = function() {
    return ['common', 'glossary', 'approvalDataDetails'];
};

additionalCallback = function() {
    ad.getProfile().done(function(response){
      var displayName = response.DisplayName;
      var displayImage = response.Image
      $('img#requestIcon').attr({"src":displayImage});
      $('#requestName').html(displayName);
    }).fail(function(response){
      console.log(JSON.stringify(response));
    });

    // Retrieve message information
    ad.getApprovalMessage().done(function(res){
      console.log(res);
      var relName = res.d.results.RequestRelation;
      if (!relName) {
          relName = results[i].RequestObjects[0].Name;
      }
      relName = relName.split("/");
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
      $('#requestText').html(messageBodyText);
      $('#requestUse').html(messageBodyUse);

      var listHtml = "";
      listHtml += '<h3 data-i18n="approvalDataDetails:dataBeingProvided"></h3>';
      ad.getProfile().done(function(response){
        var displayName = response.DisplayName;
        listHtml += '<div class="sizeBody" style="margin: 0 16px;" id="dataSetLabel"></div>'
        listHtml += '<ul class="itemization">';
        listHtml += '<li data-i18n="glossary:provideData.sex"></li>';
        listHtml += '<li data-i18n="glossary:provideData.age"></li>';
        listHtml += '<li data-i18n="glossary:provideData.area"></li>';
        if (requestType == "2") {
          listHtml += '<li data-i18n="glossary:provideData.stress.stressData"></li>';
          listHtml += '<li data-i18n="glossary:provideData.stress.comment"></li>';
        } else {
          listHtml += '<li data-i18n="glossary:provideData.calsml.mealRecord"></li>';
          listHtml += '<li data-i18n="glossary:provideData.calsml.shootingDate"></li>';
          listHtml += '<li data-i18n="glossary:provideData.calsml.comment"></li>';
        }
        listHtml += '</ul>';
        $('#providedInfo').prepend(listHtml).localize();
        $('#dataSetLabel').attr("data-i18n", "[html]glossary:dataSetLabel").localize({name: displayName});
      });

      if ( pApprovalMessageBody.sendCount == null ) {
        var denominator = Math.floor(Math.random() * 50) + 51
      } else {
        var denominator = pApprovalMessageBody.sendCount;
      }
      var numerator = sessionStorage.getItem("ApprovalNum");
      $('#consenteesNumber').html(numerator + '/' + denominator);
    });

    // When you push the button to stop providing data
    $('#rejectRequest').on('click', function() {
      var extCellUrl = encodeURIComponent(sessionStorage.getItem("ApprovalCellURL"));
      ad.deleteRelation$LinksListAPI(extCellUrl).done(function(){
        var rejectMessage = {};
        rejectMessage.To = sessionStorage.getItem("ApprovalCellURL");
        rejectMessage.Type = "message";
        rejectMessage.Title = "RE: " + sessionStorage.getItem("ApprovalMessageTitle");
        rejectMessage.Body = i18next.t("glossary:cancelDataProvision");
        rejectMessage.InReplyTo = sessionStorage.getItem("ApprovalMessageID");
        ad.sendRejectMessage(rejectMessage).done(function(){
          alert(i18next.t("approvalDataDetails:dataProvisionEnded"));
          location.href = "./LLMessage.html";
        });
      }).fail(function(response){
        if (response.status == 404 ){
          var rejectMessage = {};
          rejectMessage.To = sessionStorage.getItem("ApprovalCellURL");
          rejectMessage.Type = "message";
          rejectMessage.Title = "RE: " + sessionStorage.getItem("ApprovalMessageTitle");
          rejectMessage.Body = i18next.t("glossary:cancelDataProvision");
          rejectMessage.InReplyTo = sessionStorage.getItem("ApprovalMessageID");
          ad.sendRejectMessage(rejectMessage).done(function(){
          alert(i18next.t("approvalDataDetails:dataProvisionEnded"));
          location.href = "./LLMessage.html";
          });
        } else {
          alert(i18next.t("failedDataProvisionEnded", {msg: JSON.stringify(response)}));
          location.href = "./LLMessage.html";
        }
      });
    });
}

ad.getProfile = function(){
  return $.ajax({
    type: 'GET',
    url: sessionStorage.getItem("ApprovalCellURL") + '__/profile.json',
    dataType: 'json',
  });
};

/*
 * API to delete relation link
 * Since it is not possible to get BoxName in the current implementation,
 * Implement temporarily as "https://demo.personium.io/hn-app-genki/" fixed
 */
ad.deleteRelation$LinksListAPI = function(extCellUrl) {
  return $.ajax({
    type: "DELETE",
    url: Common.cellUrl + '__ctl/Relation(Name=\'' + sessionStorage.getItem("RelName") + '\',_Box.Name=\'io_personium_demo_hn-app-genki\')/$links/_ExtCell(\'' + extCellUrl + '\')?$orderby=__published%20desc',
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