/* -----
   Front-end interaction code
   
   @author obeattie
   -----
*/

// Template settings
_.templateSettings = {
    'interpolate': /\{\{(.+?)\}\}/g,
    'evaluate': /\{\%(.+?)\%\}/g
};

var templates = {
    'linkItem': '<li><a href="{{ url }}">{{ title }}</a><br />Sent by {{ sender }}</li>'
}

$(document).ready(function(){
    // Insert the current tab's data into the form
    chrome.tabs.getSelected(null, function(tab){
        $('#url').attr('value', tab.url);
        $('#title').attr('value', tab.title);
        $('#favicon').attr('value', tab.favIconUrl);
    });
    
    $('form').bind('submit', function(e){
        e.preventDefault();
        chrome.extension.sendRequest(
            {
                'method': 'sendLink',
                'url': $('#url').attr('value'),
                'title': $('#title').attr('value'),
                'favicon': $('#favicon').attr('value'),
                'recipient': $('#recipient').attr('value'),
            }, function(response) {
                console.log(response);
            }
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
            var element = _.template(templates.linkItem, link);
            linkList.append(element);
        });
    });
});