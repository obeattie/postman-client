/* Alerts in the popup UI */

BS.UIAlerts = {
    _display: function(message, cls, timeout){
        timeout = (timeout || 5000); // 5 seconds default
        var li = $('<li></li>');
        li.hide().addClass(cls).text(message);
        $('ul#alerts').append(li);
        li.slideDown();
        // Close the alert after the timeout
        _.delay(function(li){
            li.slideUp();
        }, timeout, li);
    },
    
    success: function(message, timeout){
        return this._display(message, 'success', timeout);
    },
    
    error: function(message, timeout){
        return this._display(message, 'err', timeout);
    }
}

_.bindAll(BS.UIAlerts);
