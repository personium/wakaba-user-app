var lm = {};

lm.getName = function(path) {
    var collectionName = path;
    var recordsCount = 0;
    if (collectionName != undefined) {
        recordsCount = collectionName.length;
    var lastIndex = collectionName.lastIndexOf("/");
        if (recordsCount - lastIndex === 1) {
            collectionName = path.substring(0, recordsCount - 1);
            recordsCount = collectionName.length;
            lastIndex = collectionName.lastIndexOf("/");
        }
    collectionName = path.substring(lastIndex + 1, recordsCount);
    }
    return collectionName;
};

$(document).ready(function() {
    i18next
    .use(i18nextXHRBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
        fallbackLng: 'en',
        ns: ['common', 'glossary', 'llmessage'],
        defaultNS: 'common',
        debug: true,
        backend: {
            // load from i18next-gitbook repo
            loadPath: './locales/{{lng}}/{{ns}}.json',
            crossDomain: true
        }
    }, function(err, t) {
        Common.initJqueryI18next();
        
        Common.createSessionExpired();
        lm.additionalCallback();
        
        Common.updateContent();
    });
});

lm.additionalCallback = function() {
    var appUrlMatch = location.href.split("#");
    var appUrlSplit = appUrlMatch[0].split("/");
    lm.appUrl = appUrlSplit[0] + "//" + appUrlSplit[2] + "/" + appUrlSplit[3] + "/";
    if (appUrlSplit[0].indexOf("file:") == 0) {
        lm.appUrl = "https://demo.personium.io/hn-ll-user-app/";
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
                break;
            case "token":
                Common.token = param[1];
                sessionStorage.setItem("ISToken", param[1]);
                break;
            case "ref":
                Common.refToken = param[1];
                sessionStorage.setItem("ISRefToken", param[1]);
                break;
            case "expires":
                Common.expires = param[1];
                sessionStorage.setItem("ISExpires", param[1]);
                break;
            case "refexpires":
                Common.refExpires = param[1];
                sessionStorage.setItem("ISRefExpires", param[1]);
                break;
        }
    }

    if (lm.checkParam()) {
        //lm.setHtml();
        //lm.getApprovedList();
        lm.getReceiveMessage();
    }

    Common.setIdleTime();
}

lm.checkParam = function() {
    var msg = "";
    if (Common.target === null) {
        msg = 'msg.error.targetCellNotSelected';
    } else if (Common.token === null) {
        msg = 'msg.error.tokenMissing';
    } else if (Common.refToken === null) {
        msg = 'msg.error.refreshTokenMissing';
    } else if (Common.expires === null) {
        msg = 'msg.error.tokenExpiryDateMissing';
    } else if (Common.refExpires === null) {
        msg = 'msg.error.refreshTokenExpiryDateMissing';
    }

    if (msg.length > 0) {
        $('#errorMsg').attr("data-i18n", msg).localize();
        $('#errorMsg').css("display", "block");
        $("#exeSearch").prop('disabled', true);
        return false;
    }

    return true;
};

lm.IsArrayExists = function(array, value) {
    for (var i =0, len = array.length; i < len; i++) {
        if (value == array[i]) {
            return true;
        }
    }
    return false;
};

/*
lm.getApprovedList = function() {
  return $("#approvedList").empty();
  var approvedList = [];
  var array = [];
  lm.getRelationListAPI().done(function(data) {
    if (data.d.results.length > 0) {
      relationResults = data.d.results;
      for (i=0; i < relationResults.length; i++){
         var relationName = relationResults[i].Name;
         lm.getRelation$LinksListAPI(relationName).done(function(data) {
           extCellResults = data.d.results;
           for (j=0; j < extCellResults.length; j++) {
             value = extCellResults[j].uri
             if(! lm.IsArrayExists(array, value)) {
               array.push(extCellResults[j].uri);
               console.log(array.length);
             }
           }
         });
      }
    }
  });
 };

 lm.setHtml = function() {
   $.when.apply($, lm.getApprovedList).done(function(array) {
     console.log(array);
     var results = array;
     var nowRow = 0;
     var html = '';
     lm.targetProfileList = new Array();
     console.log(array);
     for (var i in array) {
       console.log("for文開始")
       if (nowRow%10 == 0) {
         if (nowRow !== 0) {
           html += '</table></div>';
           $("#approvedList").append(html);
           html = "";
         }
         html += '<div class="content"><table width="100%" class="notMargin">';
       }
       var targetCell =  array[i].match(/\((.+)\)/)[1].replace(/'/g,"");
       html += '<tr class="request"><td width="5%"><div class="requestIcon"><img id="targetIcon"/></div></td><td width="95%"><div class="panel-heading requestList"><h4 class="panel-title accordion-togle"><a id="targetName" onClick="lm.moveApprovalDetails(\'' + targetCell + '\');return false;" href="javascript:void(0)" class="allToggle collapsed"></a></h4></div></td></tr>';
       lm.targetProfileList.push(lm.getProfile(targetCell));
     }
     lm.setTargetProfile();
     if (html.length > 0) {
       html += '</table></div>';
       $("#approvedList").append(html);
     }
   });
 }
*/

/*
           var results = data.d.results;
           var nowRow = 0;
           var html = '';
           lm.targetProfileList = new Array();
           for (var i in results) {
             if (nowRow%10 == 0) {
               if (nowRow !== 0) {
                 html += '</table></div>';
                 $("#approvedList").append(html);
                 html = "";
               }
               html += '<div class="content"><table width="100%" class="notMargin">';
             }
             var targetCell =  results[i].uri.match(/\((.+)\)/)[1].replace(/'/g,"");
             html += '<tr class="request"><td width="5%"><div class="requestIcon"><img id="targetIcon"/></div></td><td width="95%"><div class="panel-heading requestList"><h4 class="panel-title accordion-togle"><a id="targetName" onClick="lm.moveApprovalDetails(\'' + targetCell + '\');return false;" href="javascript:void(0)" class="allToggle collapsed"></a></h4></div></td></tr>';
             lm.targetProfileList.push(lm.getProfile(targetCell));
           }
           lm.setTargetProfile();
           if (html.length > 0) {
             html += '</table></div>';
             $("#approvedList").append(html);
           }
           */


lm.setTargetProfile = function() {
    $.when.apply($, lm.targetProfileList).done(function () {
        for (var i = 0; i < arguments.length; i++) {
            var result = arguments[i];
            if (result.length > 0) {
                $('#targetName').html(result[0].DisplayName);
                $('#targetName').attr({"id":"targetNameSet"});
                $('#targetIcon').attr({"src":result[0].Image});
                $('#targetIcon').attr({"id":"targetIconSet"});
            } else {
                $('#targetName').html(result.DisplayName);
                $('#targetName').attr({"id":"targetNameSet"});
                $('#targetIcon').attr({"src":result.Image});
                $('#targetIcon').attr({"id":"targetIconSet"});
            }
        }
    });
}

lm.getReceiveMessage = function() {
    $("#messageList").empty();
    lm.getReceivedMessageAPI().done(function(data) {
        var results = data.d.results;
        var nowRow = 0;
        var offerNowRow = 0;
        var html = '';
        var offerHtml = ""
        lm.profileList = new Array();
        lm.targetProfileList = new Array();
        for (var i in results) {
            var title = results[i].Title;
            if (title == null) {
                title = i18next.t("glossary:notSubject");
            }
            var id = results[i].__id;
            var from = results[i].From;
            var unixTime = results[i].__updated
            unixTime = parseInt(unixTime.replace(/[^0-9^]/g,""));
            var tmpRelationName = results[i].RequestRelation.split("/")
            var relationName = tmpRelationName[tmpRelationName.length - 1];
            var changedDate = lm.changeUnixTime(unixTime);
            //if (results[i].Type !== "message" && results[i].Status !== "approved" && results[i].Status !== "rejected") {
            if (results[i].Status == "approved") {
                var targetCell = results[i].From;
/*
　      offerHtml += '<tr class="request"><td width="5%"><div class="requestIcon"><img id="targetIcon"/></div></td><td width="60%"><div class="panel-heading requestList"><h4 class="panel-title accordion-togle"><a class="allToggle" onClick="lm.moveApprovalDetails(\'' + targetCell + '\', \'' + id + '\');return false;" href="javascript:void(0)" class="allToggle collapsed">' + title + '<h6 class="notMargin" id="targetName"></h6><h6 class="notMargin">' + changedDate + '</h6></a></h4></div></td><td width="35%"></td></tr>';
        offerHtml += '<li>';
        offerHtml += '<a href="#">';
        offerHtml += '<div class="list-icon">';
        offerHtml += '<img id="targetIcon"/>';
        offerHtml += '</div>';
        offerHtml += '<div class="list-body">';
        offerHtml += '<div class="sizeBody">' + title + '</div>';
        offerHtml += '<id="targetName">';
        offerHtml += '<div class="sizeCaption">' + changedDate + '</div>';
        offerHtml += '</div>';
        offerHtml += '<div class="sizeCaption">28/50</div>';
        offerHtml += '</a>';
        offerHtml += '</li>';
*/

//        var relationLength = lm.getRelation$LinksListAPI(relationName).done(function(linksResponse){
//        });
                var prof = lm.getProfile(targetCell).done(function(prof) {
                });
                var message = lm.getSingleReceivedMessageAPI(id).done(function(message){
                });
                var replay = lm.getSentMessageAPI(id).done(function(message){
                });
//        $.when( prof, relationLength, message, replay).done(function ( prof, relationLength, message, replay) {
                $.when( prof, message, replay).done(function ( prof, message, replay) {
                    Common.AddResourceProfile("en", "llmessage", "approved" + i, prof[0]);
                    Common.AddResourceProfile("ja", "llmessage", "approved" + i, prof[0]);

                    var tmpBody = message[0].d.results.Body;
                    tmpBody = tmpBody.substr(1);
                    tmpBody = tmpBody.substr(0, tmpBody.length - 1);
                    messageBody = JSON.parse(tmpBody);
                    if (replay[0].d.results.length == 0 ){
                        var targetImage = prof[0].Image;
                        //var targetName = prof[0].DisplayName
                        var targetName = "llmessage:approved" + i;
                        var messageFrom = message[0].d.results.From;
                        var tmpDate = message[0].d.results.__updated;
                        tmpDate = parseInt(tmpDate.replace(/[^0-9^]/g,""));
                        var messageDate = lm.changeUnixTime(tmpDate);
                        var messageTitle = message[0].d.results.Title;
                        var messageId = message[0].d.results.__id;
                        if ( messageBody.sendCount == null ) {
                            var denominator = Math.floor(Math.random() * 50) + 51
                        } else {
                            var denominator = messageBody.sendCount;
                        }
//            var denominator = Math.floor(Math.random() * 50) + 51;
                        var numerator = Math.floor(Math.random() * denominator);
                        offerHtml = ""
                        offerHtml += '<li>';
                        offerHtml += '<a onClick="lm.moveApprovalDetails(\'' + messageFrom + '\', \'' + messageId + '\', \'' + numerator + '\');return false;" href="javascript:void(0)">';
                        offerHtml += '<div class="list-icon">';
                        offerHtml += '<img id="targetIcon" width="24" height="24"/>';
                        offerHtml += '</div>';
                        offerHtml += '<div class="list-body">';
                        offerHtml += '<div class="sizeBody">' + messageTitle + '</div>';
                        offerHtml += '<div class="sizeCaption" id="targetName"></div>';
                        offerHtml += '<div class="sizeCaption">' + messageDate + '</div>';
                        offerHtml += '</div>';
                        offerHtml += '<div class="sizeCaption">' + numerator + '/' + denominator +  '</div>';
                        offerHtml += '</a>';
                        offerHtml += '</li>';
/*
            offerHtml += '</table></div>'
            offerHtml += '<div class="content"><table width="100%" class="notMargin">';
            offerHtml += '<tr class="request"><td width="5%"><div class="requestIcon"><img id="targetIcon"/>';
            offerHtml += '</div></td><td width="60%"><div class="panel-heading requestList"><h4 class="panel-title accordion-togle">';
            offerHtml += '<a class="allToggle" onClick="lm.moveApprovalDetails(\'' + messageFrom + '\', \'' + messageId + '\', \'' + numerator + '\');return false;" href="javascript:void(0)" class="allToggle collapsed">' + messageTitle;
            offerHtml += '<h6 class="notMargin" id="targetName"></h6><h6 class="notMargin">' + messageDate + '</h6></a></h4></div></td>';
            offerHtml += '<td width="35%"><div>' + numerator + '／' + denominator + 'が同意済</div></td></tr>';
*/
                        if (lm.isExpired(messageBody.TermEnd)){
                            $("#approvedList").append(offerHtml);
                            $('#targetName').attr("data-i18n", targetName);
                            $('#targetName').attr({"id":"targetNameSet"});
                            $('#targetIcon').attr({"src":targetImage});
                            $('#targetIcon').attr({"id":"requestIconSet"});
                        } else {
                            $("#providedList").append(offerHtml);
                            $('#targetName').attr("data-i18n", targetName);
                            $('#targetName').attr({"id":"targetNameSet"});
                            $('#targetIcon').attr({"src":targetImage});
                            $('#targetIcon').attr({"id":"requestIconSet"});
                        }
                    }
          //offerHtml += '<tr class="request"><td width="5%"><div class="requestIcon"><img id="targetIcon"/></div></td><td width="95%"><div class="panel-heading requestList"><h4 class="panel-title accordion-togle"><a id="targetName" onClick="lm.moveApprovalDetails(\'' + targetCell + '\', \'' + numerator + '\');return false;" href="javascript:void(0)" class="allToggle collapsed"></a></h4></div></td></tr>';
        //        lm.targetProfileList.push(lm.getProfile(targetCell));
                });
            }
            if (results[i].Status !== "approved" && results[i].Status !== "rejected") {
                var tmpBody = results[i].Body;
                tmpBody = tmpBody.substr(1);
                tmpBody = tmpBody.substr(0, tmpBody.length - 1);
                messageBody = JSON.parse(tmpBody);

                // If you want to display the message of the past day, comment out the if statement.
                //if (lm.isExpired(messageBody.TermEnd)) {
/*
          if (nowRow%10 == 0) {
            if (nowRow !== 0) {
              html += '</table></div>';
              $("#messageList").append(html);
              html = "";
            }
            html += '<div class="content"><table width="100%" class="notMargin">';
          }
*/
                    var tmpBody = results[i].Body;
                    tmpBody = tmpBody.substr(1);
                    tmpBody = tmpBody.substr(0, tmpBody.length - 1);
                    messageBody = JSON.parse(tmpBody);
                    if ( messageBody.sendCount == null ) {
                        var denominator = Math.floor(Math.random() * 50) + 51
                    } else {
                        var denominator = messageBody.sendCount;
                    }
          //            var denominator = Math.floor(Math.random() * 50) + 51;
                    var numerator = Math.floor(Math.random() * denominator);
          //        var denominator = Math.floor(Math.random() * 50) + 51;
          //        var numerator = Math.floor(Math.random() * 50) + 1;
          //html += '<tr class="request"><td width="5%"><div class="requestIcon"><img id="requestIcon"/></div></td><td width="60%"><div class="panel-heading requestList"><h4 class="panel-title accordion-togle"><a class="allToggle" onClick="lm.moveReplay(\'' + id + '\', \'' + numerator + '\');return false;" href="javascript:void(0)" class="allToggle collapsed">' + title + '<h6 class="notMargin" id="requestName"></h6><h6 class="notMargin">' + changedDate + '</h6></a></h4></div></td><td width="35%"><div>' + numerator + '／' + denominator + 'が同意済</div></td></tr>';
                    html += '<li>';
                    html += '<a onClick="lm.moveReplay(\'' + id + '\', \'' + numerator + '\');return false;" href="javascript:void(0)">';
                    html += '<div class="list-icon">';
                    html += '<img id="requestIcon" width="24" height="24"/>';
                    html += '</div>';
                    html += '<div class="list-body">';
                    html += '<div class="sizeBody">' + title + '</div>';
                    html += '<div class="sizeCaption" id="requestName" ></div>';
                    html += '<div class="sizeCaption">' + changedDate + '</div>';
                    html += '</div>';
                    html += '<div class="sizeCaption">' + numerator + '/' + denominator +  '</div>';
                    html += '</a>';
                    html += '</li>';
                    lm.profileList.push(lm.getProfile(from));
                //}
            }
        }
        lm.setProfile();
//    lm.setTargetProfile();
        if (html.length > 0) {
            html += '</table></div>';
            $("#messageList").append(html).localize();
        }
//    if (offerHtml.length > 0) {
//      html += '</table></div>';
//      $("#approvedList").append(offerHtml);
//    }
    });
};

lm.setProfile = function() {
    $.when.apply($, lm.profileList).done(function () {
        for (var i = 0; i < arguments.length; i++) {
            var result = arguments[i];
            if (result.length > 0) {
                Common.AddResourceProfile("en", "llmessage", "msg" + i, result[0]);
                Common.AddResourceProfile("ja", "llmessage", "msg" + i, result[0]);
                $('#requestName').html('<div class="sizeCaption" data-i18n="llmessage:msg' + i + '_DisplayName"></div>').localize();
                $('#requestName').attr({"id":"requestNameSet"});
                $('#requestIcon').attr({"src":result[0].Image});
                $('#requestIcon').attr({"id":"requestIconSet"});
            } else {
                Common.AddResourceProfile("en", "llmessage", "msg" + i, result);
                Common.AddResourceProfile("ja", "llmessage", "msg" + i, result);
                $('#requestName').html('<div class="sizeCaption" data-i18n="llmessage:msg' + i + '_DisplayName"></div>').localize();
                $('#requestName').attr({"id":"requestNameSet"});
                $('#requestIcon').attr({"src":result.Image});
                $('#requestIcon').attr({"id":"requestIconSet"});
            }
        }
    });
}

lm.changeUnixTime = function(unixTime) {
    var date = new Date(unixTime);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = ( date.getHours() < 10 ) ? '0' + date.getHours() : date.getHours();
    var min = ( date.getMinutes() < 10 ) ? '0' + date.getMinutes() : date.getMinutes();
    var sec  = ( date.getSeconds() < 10 ) ? '0' + date.getSeconds() : date.getSeconds();
    changedDate = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    return changedDate;
};

lm.moveApprovalDetails = function(targetCell, id, numerator) {
    sessionStorage.setItem("ApprovalCellURL", targetCell);
    sessionStorage.setItem("ApprovalMessageID", id);
    sessionStorage.setItem("ApprovalNum", numerator);
    location.href = "./ApprovalDataDetails.html";
};

lm.moveReplay = function(id, numerator) {
    sessionStorage.setItem("LMMessageID", id);
    sessionStorage.setItem("ApprovalNum", numerator);
    location.href = "./requestReplay.html";
};

/*
 * If the received date is past in the past, we will return false.
 */
lm.isExpired = function(TermEnd) {
    var tmpDay = new Date();
    today = tmpDay.getFullYear() + "/" + ( tmpDay.getMonth() + 1 ) + "/" + tmpDay.getDate();
    today = new Date(today);
    if ( TermEnd == null ) {
        var eDay = new Date(tmpDay.getFullYear() + "/" + ( tmpDay.getMonth() + 1 ) + "/" + (tmpDay.getDate() + 1));
    } else {
        var eDay = new Date(TermEnd);
    }
    return today <= eDay;
};

lm.getProfile = function(url) {
    return $.ajax({
        type: "GET",
        url: url + '__/profile.json',
        dataType: 'json',
        headers: {
            'Accept':'application/json'
        }
    });
};

lm.getRelationListAPI = function() {
    return $.ajax({
        type: "GET",
        url: Common.cellUrl + '__ctl/Relation',
        headers: {
            'Authorization':'Bearer ' + Common.token,
            'Accept':'application/json'
        }
    });
};

lm.getRelation$LinksListAPI = function(relationName) {
    return $.ajax({
        type: "GET",
        url: Common.cellUrl + '__ctl/Relation(\'' + relationName + '\')/$links/_ExtCell?$orderby=uri%20desc',
        headers: {
            'Authorization':'Bearer ' + Common.token,
            'Accept':'application/json'
        }
    });
};

lm.getReceivedMessageAPI = function() {
    return $.ajax({
        type: "GET",
        url: Common.cellUrl + '__ctl/ReceivedMessage?$orderby=__published%20desc',
        headers: {
            'Authorization':'Bearer ' + Common.token,
            'Accept':'application/json'
        }
    });
};

lm.getSingleReceivedMessageAPI = function(messageId) {
    return $.ajax({
        type: "GET",
        url: Common.cellUrl + "__ctl/ReceivedMessage('" + messageId + "')",
        headers: {
            'Authorization':'Bearer ' + Common.token,
            'Accept':'application/json'
        }
    });
};

lm.getSentMessageAPI = function(messageId) {
    return $.ajax({
        type: "GET",
        url: Common.cellUrl + "__ctl/SentMessage?$filter=InReplyTo eq '" + messageId + "' and substringof('キャンセル', Body)",
        headers: {
            'Authorization':'Bearer ' + Common.token,
            'Accept':'application/json'
        }
    });
};
