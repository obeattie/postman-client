/* -----
   Contains all the functionality provided by the background view
   to the UI.
   
   @author obeattie
   -----
*/

BS.UIReactor = {
    sendLink: function(link, sendResponse){
        BS.Facebook.getId(function(uid){
            $.post(
                (BS.baseUrl + '/send/'),
                {
                    'url': link.url,
                    'title': link.title,
                    'favicon': link.favicon,
                    'sender': uid,
                    'recipients': JSON.stringify(link.recipients)
                },
                function(response){
                    if (response.status === 'ok'){
                        return sendResponse(response);
                    } else {
                        // Post to the unknown recipients' FB walls
                        var missingRe = /^user:unknown:(.+)$/,
                            missingRecipients = [];
                        
                        _.each(response.extra, function(err){
                            var match = err.match(missingRe);
                            if (match){
                                missingRecipients.push(match[1]);
                            }
                        });
                        
                        if (missingRecipients){
                            var cbCounter = 0;
                            _.each(missingRecipients, function(uid){
                                BS.Facebook.postLinkToWall(link, uid, function(fbResponse){
                                    cbCounter++;
                                    if (cbCounter === missingRecipients.length){
                                        return sendResponse(fbResponse);
                                    }
                                });
                            });
                        } else {
                            return sendResponse(response);
                        }
                    }
                }
            );
        });
    },
    
    getLinks: function(req, sendResponse){
        sendResponse(BS.Store.get());
    },
    
    setFBToken: function(req, sendResponse){
        BS.Facebook.setToken(req.token);
        sendResponse('ok');
    },
    
    getFBToken: function(req, sendResponse){
        sendResponse(BS.Facebook.getToken());
    }
}

// Dispatcher
chrome.extension.onRequest.addListener(function(req, sender, sendResponse){
    console.log('Request from UI: ' + req.method, req);
    return BS.UIReactor[req.method](req, sendResponse);
});
