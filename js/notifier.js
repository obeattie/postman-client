/* -----
   Desktop notification abstraction layer
   
   @author obeattie
   -----
*/

var NotificationCenter = {
    display: function(link){
        var notification = webkitNotifications.createNotification(
            link.favicon,
            link.title,
            link.sender + ' just sent you this link'
        );
        notification.onclick = function(){
            chrome.tabs.create({
                url: link.url
            }, function(){
                notification.cancel();
            });
        }
        notification.show();
    }
}
