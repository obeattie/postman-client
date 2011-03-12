$(document).ready(function(){
    var uri = new jsUri(window.location.href);
    var id = uri.getQueryParamValue('id');
    var link = NotificationCenter._pop(id);
    
    // Set the various page components to reflect the link
    $('h2').text(link.title);
    $('h2 a').attr('href', link.url);
    $('p span').text(link.sender);
});
