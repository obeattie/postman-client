/* -----
   @author obeattie
   -----
*/

BS.host = 'obeattie.com';
BS.port = 8080;
BS.baseUrl = ('http://' + BS.host + ':' + BS.port);

// Subscribe via websockets
BS.socket = new io.Socket(BS.host, {
    'port': BS.port
});

BS.socket.on('message', function(data){
    data = JSON.parse(data);
    var links = BS.Store.add(data.links, function(addedLinks){
        _.each(addedLinks, NotificationCenter.display);
    });
});

// Connection function which can be called from any context
BS.socketConnect = _.bind(BS.socket.connect, BS.socket);

// Reconnect on disconnection or connection failure
BS.socket.on('disconnect', BS.socketConnect);
BS.socket.on('connect_failed', BS.socketConnect);

// Send the listening command on socket connection
BS.socket.on('connect', function(){
    console.log('Socket connected. Sending initialization.')
    BS.Facebook.getId(function(uid){
        BS.socket.send(JSON.stringify({
            'method': 'listen',
            'to': uid
        }));
    });
});

// When the page is ready, connect the socket
$(document).ready(BS.socketConnect);
