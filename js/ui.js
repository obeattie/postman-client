/* -----
   Front-end interaction code
   
   @author obeattie
   -----
*/

var BS = {
    'fbAuth': {
        'appId': '155543461167850',
        'apiKey': '8d8950287fcf5b52f570e9bece34e9fc'
    }
};

// Template settings
_.templateSettings = {
    'interpolate': /\{\{(.+?)\}\}/g,
    'evaluate': /\{\%(.+?)\%\}/g
};

BS.templates = {
    'linkItem': '<li style="list-style-image:url(\'{{ favicon }}\');"><a href="{{ url }}">{{ title }}</a><span>Sent by {{ sender }}</span></li>',
    'fbAuthUrl': 'https://graph.facebook.com/oauth/authorize?type=user_agent&client_id={{ appId }}&redirect_uri=http://www.facebook.com/connect/login_success.html&scope=publish_stream'
}

// Facebook API setup
FB._domain = {
    'api': 'https://api.facebook.com/',
    'cdn': 'https://s-static.ak.fbcdn.net/',
    'www': 'https://www.facebook.com/'
};

// Truncation helper
String.prototype.trunc = function(n){
    return this.substr(0,n-1)+(this.length>n ? String.fromCharCode(8230) : '');
};

$(document).ready(function(){
    // Insert the current tab's data into the form
    chrome.tabs.getSelected(null, function(tab){
        $('#url').val(tab.url);
        $('#title').val(tab.title);
        $('#titleDisplay').text(tab.title.trunc(25));
        $('#favicon').val(tab.favIconUrl);
    });
    
    $('form').bind('submit', function(e){
        e.preventDefault();
        chrome.extension.sendRequest(
            {
                'method': 'sendLink',
                'url': $('#url').val(),
                'title': $('#title').val(),
                'favicon': $('#favicon').val(),
                'recipients': $('#recipients').val().split(','),
            }, console.log
        );
    });
    
    // Bind a live event handler to handle opening new tabs whenever a link
    // is clicked
    $('a').live('click', function(e){
        e.preventDefault();
        chrome.tabs.create({
            url: $(this).attr('href')
        }, function(){
            // Hackishly close the popup
            chrome.tabs.getSelected(null, function(tab) {
                chrome.tabs.update(tab.id, {
                    'selected': true
                });
            });
        });
    });
    
    // Get a list of all the received links and render into the popup
    chrome.extension.sendRequest({ 'method': 'getLinks' }, function(links){
        var linkList = $('#link-list');
        _.each(links, function(link){
            var element = _.template(BS.templates.linkItem, link);
            linkList.append(element);
        });
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
});
