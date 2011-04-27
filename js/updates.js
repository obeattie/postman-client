/* -----
   Migration helper. Detects upgrades and runs any associated migration
   functions.
   
   @author obeattie
   -----
*/

BS.Upgrades = {
    '1.1.6': function(){
        // Added the concept of 'seen' links. Set to be the same as viewed on
        // first run
        var links = BS.Store._get();
        _.each(links, function(value, key){
            value.seen = value.viewed;
            links[key] = value;
        });
        localStorage['links'] = JSON.stringify(links);
        BS.Store.updateUnseenCount();
    },
    
    '1.1.7': function(){
        // Fix the seen counters so things that are visited are also seen (this
        // wouldn't happen if they clicked the link in the notification or an
        // open popup in 1.1.6)
        var links = BS.Store._get();
        _.each(links, function(value, key){
            value.seen = (value.seen || value.viewed);
            links[key] = value;
        });
        localStorage['links'] = JSON.stringify(links);
        BS.Store.updateUnseenCount();
    }
}

// Handle the migrations
_.defer(function(){
    // Get the current version
    $.getJSON(chrome.extension.getURL('manifest.json'), function(response){
        var currentVersion = response.version;
        // First installs, nothing happens
        var oldVersion = (localStorage['version'] || '0');
        // Find any migrations to be run
        var migrations = _.select(_.keys(BS.Upgrades), function(version){
            return ((oldVersion < version) && (version <= currentVersion));
        });
        _.each(migrations, function(migration){
            console.log('Running migration ' + migration);
            BS.Upgrades[migration]();
        });
        // Store the new version
        localStorage['version'] = currentVersion;
    });
});
