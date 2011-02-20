/* -----
   Abstractions for working with Facebook. Assumes working on the front-end.
   
   @author obeattie
   -----
*/

BS.Facebook = {
    _send: function(uri, params, cb){
        // Generate the uri
        params = (params || {});
        params['access_token'] = BS.FBToken;
        console.log(params);
        var uri = new jsUri(uri);
        _.each(params, function(value, key){
            uri.deleteQueryParam(key);
            uri.addQueryParam(key, value);
        });
        uri = uri.toString();
        console.log('calling fb api', uri);
        // Make the call
        $.getJSON(uri, cb);
    },
    
    _cachedFetch: function(key, uri, params, cb){
        // Internal function to make a cached FB call, calling a callback when
        // the result is available
        var fbData = localStorage['cachedFacebookData'];
        if (!fbData){
             fbData = {};
             localStorage['cachedFacebookData'] = JSON.stringify(fbData);
        } else {
            fbData = JSON.parse(fbData);
        }
        
        if (_.include(_.keys(fbData), key)){
            // Return from cache if we can
            return cb(fbData[key]);
        } else {
            // Go fetch the data if not
            this._send(uri, params, function(response){
                fbData[key] = response;
                localStorage['cachedFacebookData'] = JSON.stringify(fbData);
                cb(response);
            });
        }
    },
    
    getUserData: function(cb){
        // Asynchronously gets the Facebook user data (async as we have
        // to fetch it if we don't know it already)
        return this._cachedFetch('info', 'https://graph.facebook.com/me', {}, cb);
    },
    
    getFriends: function(cb){
        // Asynchronously gets the user's friend list
        return this._cachedFetch('friends', 'https://graph.facebook.com/me/friends', {}, cb);
    }
}

_.bindAll(BS.Facebook);
