/* -----
   @author obeattie
   -----
*/

BS.host = 'postman.emberb0x.com';
BS.port = 8080;
BS.baseUrl = ('http://' + BS.host + ':' + BS.port);

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
        case 'setAuthKey':
            localStorage['authKey'] = data.key;
            console.log('Auth key set. Disconnecting socket.');
            BS.socket.disconnect(); // Reconnects automatically
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
                'authKey': localStorage['authKey']
            }));
            console.log('Initialisation sent');
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

// Periodically (every hour) forcibly disconnect the socket (which will immediately
// reconnect)
var periodicDisconnectionTimer = window.setTimeout(BS.socketDisconnect, 3600000);

// When the page is ready, connect the socket
$(document).ready(BS.socketConnect).ready(BS.Store.updateUnviewedCount);
