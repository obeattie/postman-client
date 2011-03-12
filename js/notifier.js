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
        // Open the link in a new tab and close the notifiction when clicked
        notification.onclick = function(){
            chrome.tabs.create({
                url: link.url
            }, notification.cancel);
        }
        notification.show();
        // Close the notification automatically after 20 seconds
        _.delay(notification.cancel, 20000);
    }
}
