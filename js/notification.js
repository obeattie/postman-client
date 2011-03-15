$(document).ready(function(){
    var uri = new jsUri(window.location.href);
    var id = uri.getQueryParamValue('id');
    var link = BS.Store.get(id);
    
    // Set the various page components to reflect the link
    $('a').text(link.title);
    $('h2 strong').text(link.senderName);
    $('img').attr('src', 'http://graph.facebook.com/' + link.sender + '/picture');
});
