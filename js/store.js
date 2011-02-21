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
    
    add: function(){
        // Adds any number of links (pass as either arguments or as a list).
        // Returns links that have been added (ie those that weren't already present,
        // since links is a set)
        var addedLinks = _.flatten(arguments);
        var storedLinks = this.get();
        // Ghetto-fab way to get the set difference (there has to be an easier way)
        addedLinks = _.map(addedLinks, function(link){
            return (_.include(storedLinks, link) ? null : link);
        });
        addedLinks = _.without(addedLinks, null);
        storedLinks = _.uniq(_.flatten([addedLinks, storedLinks]));
        // Store and return
        localStorage['links'] = JSON.stringify(storedLinks);
        return addedLinks;
    }
}
