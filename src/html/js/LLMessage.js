var lm = {};

// Whether all messages are displayed
lm.showExpiredMessage = true;

getNamesapces = function() {
    return ['common', 'glossary', 'llmessage'];
};

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

additionalCallback = function() {
    lm.getReceiveMessage();
    Common.setIdleTime();
}

lm.IsArrayExists = function(array, value) {
    for (var i =0, len = array.length; i < len; i++) {
        if (value == array[i]) {
            return true;
        }
    }
    return false;
};

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
            if (!results[i].RequestObjects || !results[i].RequestObjects[0].Name) {
                /*
                 * https://personium.github.io/en/apiref/1.5.2/267_Received_Message_Approval.html
                 * Reject message with unread/read status.
                 */
                continue;
            }
            if (lm.invalidBox(results[i]["_Box.Name"])) {
                // Currently messages between data subject and data consumer does not support box name.
                continue;
            }
            var tmpBody = results[i].Body;
            tmpBody = tmpBody.substr(1);
            tmpBody = tmpBody.substr(0, tmpBody.length - 1);
            var messageBody;
            try {
                messageBody = JSON.parse(tmpBody);
            } catch(ex) {
                console.log(ex);
                continue;
            }
            var changedDate = lm.changeUnixTime(unixTime);
            switch(results[i].Status) {
            case "approved":
                var targetCell = results[i].From;
                var prof = lm.getProfile(targetCell).done(function(prof) {
                });
                var message = lm.getSingleReceivedMessageAPI(id).done(function(message){
                });
                var replay = lm.getSentMessageAPI(id).done(function(message){
                });
                $.when( prof, message, replay).done(function ( prof, message, replay) {
                    lm.dispReceivedMessage(prof, message, replay);
                });
                break;
            case "rejected":
                // do nothing
                break;
            default:
                if (lm.showExpiredMessage || lm.isExpired(messageBody.TermEnd)) {
                    if ( messageBody.sendCount == null ) {
                        var denominator = Math.floor(Math.random() * 50) + 51
                    } else {
                        var denominator = messageBody.sendCount;
                    }
                    var numerator = Math.floor(Math.random() * denominator);
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
                }

            };
        }
        lm.setProfile();
        if (html.length > 0) {
            html += '</table></div>';
            $("#messageList").append(html);
        }
    });
};

lm.invalidBox = function(boxName) {
    if (boxName) {
        return true;
    } else {
        // Box name is always null for current implementation 
        return false;
    }
}

lm.dispReceivedMessage = function(prof, message, replay) {
    var tmpBody = message[0].d.results.Body;
    tmpBody = tmpBody.substr(1);
    tmpBody = tmpBody.substr(0, tmpBody.length - 1);
    messageBody = JSON.parse(tmpBody);
    if (replay[0].d.results.length == 0 ){
        var targetImage = prof[0].Image;
        var targetName = prof[0].DisplayName
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
        if (lm.isExpired(messageBody.TermEnd)){
            $("#approvedList").append(offerHtml);
            $('#targetName').html(targetName);
            $('#targetName').attr({"id":"targetNameSet"});
            $('#targetIcon').attr({"src":targetImage});
            $('#targetIcon').attr({"id":"requestIconSet"});
        } else {
            $("#providedList").append(offerHtml);
            $('#targetName').html(targetName);
            $('#targetName').attr({"id":"targetNameSet"});
            $('#targetIcon').attr({"src":targetImage});
            $('#targetIcon').attr({"id":"requestIconSet"});
        }
    }
}

lm.setProfile = function() {
    $.when.apply($, lm.profileList).done(function () {
        for (var i = 0; i < arguments.length; i++) {
            var result = arguments[i];
            if (result.length > 0) {
                $('#requestName').html('<div class="sizeCaption">' + result[0].DisplayName + '</div>');
                $('#requestName').attr({"id":"requestNameSet"});
                $('#requestIcon').attr({"src":result[0].Image});
                $('#requestIcon').attr({"id":"requestIconSet"});
            } else {
                $('#requestName').html('<div class="sizeCaption">' + result.DisplayName + '</div>');
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
 * If the retrieved message's timestamp is not today, it is considered expired.
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
        url: Common.cellUrl + "__ctl/SentMessage?$filter=InReplyTo eq '" + messageId + "' and (substringof('キャンセル', Body) or substringof('canceled', Body))",
        headers: {
            'Authorization':'Bearer ' + Common.token,
            'Accept':'application/json'
        }
    });
};
