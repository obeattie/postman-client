/* -----
   Front-end interaction code
   
   @author obeattie
   -----
*/

var BS = {
    'fbAuth': {
        'appId': '155543461167850'
    }
};

var urlRe = /https?:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

// Template settings
_.templateSettings = {
    'interpolate': /\{\{(.+?)\}\}/g,
    'evaluate': /\{\%(.+?)\%\}/g
};

BS.templates = {
    'linkItem': '<li linkId="{{ id }}" class="{{ cls }}"><img src="{{ favicon }}" alt="Favicon" /><div class="content"><a href="{{ url }}" class="link">{{ title }}</a><span>From <a href="http://www.facebook.com/profile.php?id={{ sender }}">{{ senderName }}</a><br />{{ timesince }}</span></div></li>',
    'fbAuthUrl': 'https://graph.facebook.com/oauth/authorize?type=user_agent&client_id={{ appId }}&redirect_uri=http://www.facebook.com/connect/login_success.html&scope=publish_stream,offline_access'
}

// Facebook API setup
FB._domain = {
    'api': 'https://api.facebook.com/',
    'cdn': 'https://s-static.ak.fbcdn.net/',
    'www': 'https://www.facebook.com/'
};

// Native object helpers
String.prototype.trunc = function(n){
    return this.substr(0,n-1)+(this.length>n ? String.fromCharCode(8230) : '');
};

String.prototype.pluralize = function(number, plural){
    plural = (plural || (this + 's'));
    return ((number === 1) ? this : plural);
};

String.prototype.capitalize = function(){
    return (this.charAt(0).toUpperCase() + this.substring(1));
}

Date.prototype.nicedelta = function(to){
    // Returns a nicely formatted representation of how long has passed between
    // the passed date and to (defaults to now)
    to = (to || new Date());
    console.assert(to > this);
    var delta = parseInt((to.getTime() - this) / 1000);
    delta = delta + (to.getTimezoneOffset() * 60);
    
    if (delta < 60){
        return 'just now';
    } else if (delta < 120) {
        return 'a minute ago';
    } else if (delta < (60*60)) {
        return (parseInt(delta / 60)).toString() + ' minutes ago';
    } else if (delta < (120*60)) {
        return 'an hour ago';
    } else if (delta < (24*60*60)) {
        return (parseInt(delta / 3600)).toString() + ' hours ago';
    } else if (delta < (48*60*60)) {
        return 'yesterday';
    } else {
        return (parseInt(delta / 86400)).toString() + ' days ago';
    }
}

// Link render
BS.RenderLink = function(link){
    link.favicon = (link.favicon || 'img/default_favicon.png');
    link.cls = (link.viewed ? 'viewed' : 'new');
    link.timesince = (new Date(link.timestamp)).nicedelta().capitalize();
    var element = $(_.template(BS.templates.linkItem, link));
    element.data('link', link);
    return element;
}

$(document).ready(function(){
    // Insert the current tab's data into the form
    chrome.tabs.getSelected(null, function(tab){
        $('#url').val(tab.url);
        $('#title').val(tab.title);
        $('#titleDisplay').text(tab.title.trunc(25));
        $('#favicon').val(tab.favIconUrl);
        
        // If the URL isn't sendable, disable the form
        if (!tab.url.match(urlRe)){
            console.log('disabling input, url regex mismatch');
            $('input[type=text], input[type=submit]').attr('disabled', true);
        }
    });
    
    $('form').submit(function(e){
        e.preventDefault();
        var recipients = $('#recipients').val().split(',');
        recipients = _.select(recipients, _.identity);
        
        if (recipients.length){
            // Display spinner
            drawSpinner('holder', 5, 10, 12, 2, '#fff');
            $('#mask, #holder svg').fadeIn('fast');
            
            chrome.extension.sendRequest(
                {
                    'method': 'sendLink',
                    'url': $('#url').val(),
                    'title': $('#title').val(),
                    'favicon': $('#favicon').val(),
                    'recipients': recipients,
                }, function(response){
                    // always remove the spinner and mask
                    $('#mask, #holder svg').fadeOut('fast');
                    if (response.status === 'ok'){
                        BS.UIAlerts.success('Sent!')
                        // Reset the form
                        $('form').trigger('reset');
                    } else {
                        console.log('error');
                        BS.UIAlerts.error('There was a problem sending your link')
                    }
                }
            );
        } else {
            // Flash the input field background red
            $('#recipients + ul, #recipients + ul input')
            .css('background-color', '#fffff')
            .animate({
                'background-color': '#ffd5d3'
            }, 100)
            .animate({
                'background-color': '#ffffff'
            }, 100);
        }
    });
    
    // Bind a live event handler to handle opening new tabs whenever a link
    // is clicked
    $('a').live('click', function(e){
        e.preventDefault();
        // Link only if this is a.link
        var link = ($(this).is('a.link') ? $(this).closest('li').data('link') : null);
        chrome.tabs.create({
            url: $(this).attr('href')
        }, function(){
            // Mark as viewed
            if (link){
                chrome.extension.sendRequest({
                    'method': 'markVisited',
                    'id': link.id
                });
            }
            // Hackishly close the popup
            chrome.tabs.getSelected(null, function(tab) {
                chrome.tabs.update(tab.id, { 'selected': true });
            });
        });
    });
    
    // Get a list of all the received links and render into the popup
    chrome.extension.sendRequest({ 'method': 'getLinks' }, function(links){
        var linkList = $('#link-list');
        _.each(links, function(link){
            linkList.append(BS.RenderLink(link));
        });
    });
    
    // Setup the long-lived connection with the backend for incoming links
    BS.BackendConnection = chrome.extension.connect({
        'name': 'postmanUiConnection'
    });
    BS.BackendConnection.onMessage.addListener(function(req){
        switch(req.method){
            case 'incomingLink':
                var element = BS.RenderLink(req.link);
                // Animate in
                element.hide();
                $('#link-list').prepend(element);
                element.slideDown();
                break;
            default:
                throw 'unsupported method ' + req.method;
        }
    });
    
    // Get the Facbeook API token from the backend
    chrome.extension.sendRequest({ 'method': 'getFBToken' }, function(token){
        BS.FBToken = token;
        console.log('fb token', token);
        if (!token){
            // The user hasn't authenticated, display the button to connect
            $('body').addClass('fb-init');
        } else {
            // Go ahead and build the autosuggest field with their friend list
            BS.Facebook.getFriends(function(response){
                var friends = response.data;
                var filterFunc = _.bind(BS.FriendResultsFilter, BS, friends);
                $('#recipients').tokenInput({
                    filterResults: filterFunc
                });
                if ($('#recipients').attr('disabled') !== true){
                    $('ul input').focus();
                } else {
                    // Disabled
                    $('ul input, #post').attr('disabled', true);
                    $('#friendPlaceholder').text('Sorry, you can\'t send this page').addClass('err');
                }
            });
        }
    });
    
    // Bind the FB login window to the login button (which usually isn't shown)
    $('#fb-init a').bind('click', function(e){
        console.log(_.template(BS.templates.fbAuthUrl, BS.fbAuth));
        e.stopPropagation();
        var win = window.open(
            _.template(BS.templates.fbAuthUrl, BS.fbAuth),
            'Connect with Facebook',
            'width=600,height=300'
        );
    });
    
    // Reset the counter to 0
    chrome.extension.sendRequest({ 'method': 'resetUnseenCount' });
});
