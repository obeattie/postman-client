/* -----
   Desktop notification abstraction layer
   
   @author obeattie
   -----
*/

var NotificationCenter = {
    _store: function(link){
        // Temporarily stores the link in local storage assigned to
        // an id, so the notification can access it.
        var storedLinks = localStorage['notificationLinks'];
        storedLinks = JSON.parse(storedLinks || '{}');
        // Generate a unique id
        var id = Math.floor(Math.random()*1000000).toString();
        while (id in storedLinks){
            id = Math.floor(Math.random()*1000000).toString();
        }
        // Store and return the id
        storedLinks[id] = link;
        localStorage['notificationLinks'] = JSON.stringify(storedLinks);
        return id;
    },
    
    _pop: function(id){
        var storedLinks = localStorage['notificationLinks'];
        storedLinks = JSON.parse(storedLinks || '{}');
        if (id in storedLinks){
            var value = storedLinks[id];
            delete storedLinks[id];
            localStorage['notificationLinks'] = JSON.stringify(storedLinks);
            return value;
        }
    },
    
    display: function(link){
        var id = this._store(link);
        var url = 'notification.html?id=' + escape(id);
        var notification = webkitNotifications.createHTMLNotification(url);
        // Open the link in a new tab and close the notifiction when clicked
        var closeNotification = _.bind(function(){
            this.cancel();
        }, notification);
        notification.onclick = function(){
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
