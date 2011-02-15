/* -----
   Contains all the functionality provided by the background view
   to the UI.
   
   @author obeattie
   -----
*/

BS.UIReactor = {
    sendLink: function(link, sendResponse){
        $.post(
            (BS.baseUrl + '/send/' + link.recipient),
            {
                'url': link.url,
                'title': link.title,
                'favicon': link.favicon,
                'sender': localStorage['username']
            },
            sendResponse
        );
    },
    
    getLinks: function(req, sendResponse){
        sendResponse(BS.Store.get());
    }
}

// Dispatcher
chrome.extension.onRequest.addListener(function(req, sender, sendResponse){
    console.log('Request from UI: ' + req.method, req);
    return BS.UIReactor[req.method](req, sendResponse);
});
