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
                sendResponse
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
