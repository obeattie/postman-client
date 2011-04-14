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
        BS.socket.send(JSON.stringify({
            'method': 'listen',
            'to': uid,
            'authKey': localStorage['authKey']
        }));
    });
});

// If they have authenticated with FB but don't have Postman auth token,
// remove the FB authentication
if (('facebookToken' in localStorage) && !('authKey' in localStorage)){
    delete localStorage['facebookToken'];
}

// When the page is ready, connect the socket
$(document).ready(BS.socketConnect).ready(BS.Store.updateUnviewedCount);
