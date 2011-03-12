/* -----
   Interface for storing/retrieving link from local storage
   
   @author obeattie
   -----
*/

BS.Store = {
    get: function(){
        // Returns all links in local storage
        var links = localStorage['links']; 
        return (links ? JSON.parse(links) : []);
    },
    
    add: function(links, cb){
        // Adds any number of links.
        // Calls the passed callback when all the links have been added with a
        // list of those added as its argument (ie those that weren't already present,
        // since links is a set). This is asynchronous as it depends on getting
        // the FB friend list (which may need to be fetched)
        BS.Facebook.getFriends(_.bind(function(response){
            var friendIds = _.pluck(response.data, 'id');
            var addedLinks = links;
            // First, exclude any links that weren't sent by one of the user's
            // friends
            console.log(friendIds, addedLinks);
            addedLinks = _.select(addedLinks, function(link){
                return _.contains(friendIds, link.sender);
            });
            console.log(addedLinks);
            var storedLinks = this.get();
            // Ghetto-fab way to get the set difference (there has to be an easier way)
            addedLinks = _.map(addedLinks, function(link){
                return (_.include(storedLinks, link) ? null : link);
            });
            addedLinks = _.without(addedLinks, null);
            storedLinks = _.uniq(_.flatten([addedLinks, storedLinks]));
            // Store and return
            localStorage['links'] = JSON.stringify(storedLinks);
            cb(addedLinks);
        }, this));
    }
}

_.bindAll(BS.Store);
