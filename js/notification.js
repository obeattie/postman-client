$(document).ready(function(){
    var uri = new jsUri(window.location.href);
    var id = uri.getQueryParamValue('id');
    var link = NotificationCenter._pop(id);
    
    // Set the various page components to reflect the link
    $('p a').text(link.title).attr('href', link.url);
    $('h2 strong').text(link.senderName);
    $('img').attr('src', 'http://graph.facebook.com/' + link.sender + '/picture');
});
