/* -----
   @author obeattie
   -----
*/

BS._genClientId = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

BS.host = 'postman.emberb0x.com';
BS.port = 8080;
BS.baseUrl = ('http://' + BS.host + ':' + BS.port);

// Get or set the client ID
if ('clientId' in localStorage){
    BS.clientId = localStorage['clientId'];
} else {
    BS.clientId = BS._genClientId();
    localStorage['clientId'] = BS.clientId;
}

// Subscribe via websockets
BS.socket = new io.Socket(BS.host, {
    'port': BS.port,
    // Seems to cause problems when reconnecting. Even though it's not
    // recommended, leaving it in for now
    'rememberTransport': false
});

BS.socket.on('message', function(data){
    data = JSON.parse(data);
    console.log('BS.socket.on:message:', data);
    switch (data.kind){
        case 'incoming':
            BS.Store.add(data.links, function(addedLinks){
                _.each(addedLinks, NotificationCenter.display);
            });
            break;
        case 'deauth':
            BS.deauth();
            break;
        default:
            throw 'unknown action: ' + data.kind
            break;
    }
});

// Connection function which can be called from any context
BS.socketConnect = _.bind(BS.socket.connect, BS.socket);

// Reconnect on disconnection or connection failure
BS.socket.on('disconnect', BS.socketConnect);
BS.socket.on('connect_failed', BS.socketConnect);

// Send the listening command on socket connection
BS.socket.on('connect', function(){
    console.log('Socket connected. Sending initialization.');
    BS.Facebook.getId(function(uid){
        if ('authKey' in localStorage){
            BS.socket.send(JSON.stringify({
                'method': 'listen',
                'to': uid,
                'authKey': localStorage['authKey'],
                'clientId': BS.clientId
            }));
        } else {
            console.log('Not sending initialisation.');
        }
    });
});

// If they have authenticated with FB but don't have Postman auth token,
// remove the FB authentication
BS.socketDisconnect = _.bind(BS.socket.disconnect, BS.socket);
BS.deauth = function(){
    console.warn('!!! Deauthorizing');
    delete localStorage['facebookToken'];
    delete localStorage['authKey'];
    BS.socketDisconnect();
}
if (('facebookToken' in localStorage) && !('authKey' in localStorage)){
    BS.deauth();
}

// If they've never run the extension before, launch a popup asking to
// connect with Facebook
if (!('initPopupShown' in localStorage || 'facebookToken' in localStorage)){
    chrome.windows.create({
        url: 'onemorething.html',
        width: 600,
        height: 300,
        type: 'popup'
    }, function(w){
        localStorage['initPopupShown'] = 'true';
        BS.initPopupId = w.id;
    });
}

// Periodically (every half hour) forcibly disconnect the socket (which will immediately
// reconnect)
BS.periodicDisconnectionTimer = window.setInterval(BS.socketDisconnect, 1800000);

// When the page is ready, connect the socket
$(document).ready(BS.socketConnect);
$(document).ready(BS.Store.updateUnseenCount);
