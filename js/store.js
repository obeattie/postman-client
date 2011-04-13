/* -----
   Interface for storing/retrieving link from local storage
   
   @author obeattie
   -----
*/

BS.Store = {
    _get: function(){
        var links = localStorage['links']; 
        return (links ? JSON.parse(links) : {});
    },
    
    get: function(id){
        // Returns all links in local storage (as a list), unless an id was
        // passed, in which case, return just that one link
        var links = this._get();
        if (_.isUndefined(id)){
            return _.sortBy(_.values(links), function(link){
                // Quick and dirty reverse sort
                return (0 - link.timestamp);
            });
        } else {
            return links[id];
        }
    },
    
    getUnviewed: function(){
        // Returns all new links (ie those that haven't been viewed)
        return _.reject(this.get(), function(link){
            return link.viewed;
        });
    },
    
    add: function(links, cb){
        // Adds any number of links.
        // Calls the passed callback when all the links have been added with a
        // list of those added as its argument (ie those that weren't already present,
        // since links is a set). This is asynchronous as it depends on getting
        // the FB friend list (which may need to be fetched)
        BS.Facebook.getFriendNames(_.bind(function(friendNames){
            // First, exclude any links not sent by the user's friends
            var friendIds = _.keys(friendNames);
            links = _.select(links, function(link){
                return _.contains(friendIds, link.sender);
            });
            // Add the sender names to to the links
            links = _.map(links, function(link){
                link.senderName = friendNames[link.sender];
                link.viewed = (link.viewed || false);
                return link;
            });
            var addedLinks = [];
            var storage = this._get();
            console.log(links);
            _.each(links, function(link){
                if (!(link.id in storage)){
                    storage[link.id] = link;
                    addedLinks.push(link);
                }
            });
            // Store and return
            localStorage['links'] = JSON.stringify(storage);
            this.updateUnviewedCount();
            cb(addedLinks);
        }, this));
    },
    
    markViewed: function(id){
        // Marks the link with the passed id as viewed
        var links = this._get();
        links[id].viewed = true;
        localStorage['links'] = JSON.stringify(links);
        this.updateUnviewedCount();
    },
    
    updateUnviewedCount: function(){
        // Slightly misplaced function to update any unviewed link counters
        // (currently just the toolbar icon badge)
        console.log('Updating unviewed counters');
        chrome.browserAction.setBadgeText({
            'text': (this.getUnviewed().length || '').toString()
        });
    },
    
    addSentItem: function(link){
        // Stores a link as having been sent
        // Though this isn't used at the moment, it may very well be in the future
        var sentLinks = localStorage['sentLinks'];
        return (sentLinks ? JSON.parse(sentLinks) : {});
    }
}

_.bindAll(BS.Store);
