/* -----
   Desktop notification abstraction layer
   
   @author obeattie
   -----
*/

var NotificationCenter = {
    display: function(link){
        var url = 'notification.html?id=' + escape(link.id);
        var notification = webkitNotifications.createHTMLNotification(url);
        // Open the link in a new tab and close the notifiction when clicked
        var closeNotification = _.bind(function(){
            this.cancel();
        }, notification);
        notification.onclick = function(){
            BS.Store.markViewed(link.id);
            chrome.tabs.create({
                url: link.url
            }, closeNotification);
        }
        notification.show();
        // Close the notification automatically after 20 seconds
        _.delay(closeNotification, 20000);
    }
}

_.bindAll(NotificationCenter);
