/* -----
   Contains all the functionality provided by the background view
   to the UI.
   
   @author obeattie
   -----
*/

BS.UIReactor = {
    sendLink: function(link, sendResponse){
        BS.Facebook.getId(function(uid){
            var xhr = $.post(
                (BS.baseUrl + '/send/'),
                {
                    'url': link.url,
                    'title': link.title,
                    'favicon': link.favicon,
                    'sender': uid,
                    'recipients': JSON.stringify(link.recipients)
                },
                function(response){
                    console.log('Remote response', response);
                    if (response.status === 'ok'){
                        return sendResponse({ 'status': 'ok', 'extra': response });
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
                        
                        if (missingRecipients.length !== response.extra.length){
                            // There was some other error, do not post to Facebook
                            return sendResponse({ 'status': 'err', 'extra': response.extra });
                        }
                        
                        if (missingRecipients){
                            var cbCounter = 0;
                            _.each(missingRecipients, function(uid){
                                BS.Facebook.postLinkToWall(link, uid, function(fbResponse){
                                    cbCounter++;
                                    if (cbCounter === missingRecipients.length){
                                        return sendResponse({ 'status': 'ok', 'extra': fbResponse });
                                    }
                                }, function(){
                                    return sendResponse({ 'status': 'err' });
                                });
                            });
                        } else {
                            return sendResponse({ 'status': 'err', 'extra': response });
                        }
                    }
                }
            );
            // Sending failure handler
            xhr.error(function(response){
                return sendResponse({ 'status': 'err', 'extra': response });
            });
        });
    },
    
    getLinks: function(req, sendResponse){
        sendResponse(BS.Store.get());
    },
    
    setFBToken: function(req, sendResponse){
        BS.Facebook.setToken(req.token);
        // Open the ready to go page
        chrome.tabs.create({
            'url': 'readytogo.html'
        }, function(){
            sendResponse('ok');
        });
    },
    
    getFBToken: function(req, sendResponse){
        sendResponse(BS.Facebook.getToken());
    },
    
    markViewed: function(req, sendResponse){
        BS.Store.markViewed(req.id);
        sendResponse('ok');
    },
    
    updateUnviewedCount: function(req, sendResponse){
        BS.Store.updateUnviewedCount();
        sendResponse('ok');
    }
}

// Dispatcher
chrome.extension.onRequest.addListener(function(req, sender, sendResponse){
    console.log('Request from UI: ' + req.method, req);
    sendResponse = (_.isUndefined(sendResponse) ? _.identity : sendResponse);
    return BS.UIReactor[req.method](req, sendResponse);
});

// Persistent connection to the UI, if a link arrives while it's open
BS.UIConnection = null;
chrome.extension.onConnect.addListener(function(port){
    console.assert(port.name == 'postmanUiConnection');
    BS.UIConnection = port;
    console.log('UI port connected');
    // When the port is disconnected, reset the port to null
    port.onDisconnect.addListener(function(){
        console.log('UI port disconnected');
        BS.UIConnection = null;
    });
});
