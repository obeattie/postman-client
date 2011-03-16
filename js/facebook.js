/* -----
   Abstractions for working with Facebook. Usable from both front and back-end
   (local storage is shared).
   
   @author obeattie
   -----
*/

BS.Facebook = {
    getToken: function(){
        return (localStorage['facebookToken'] || null);
    },
    
    setToken: function(token){
        localStorage['facebookToken'] = token;
        BS.socketConnect();
    },
    
    _isAuthenticated: function(){
        // Returns whether the user is logged-in to Facebook
        return (this.getToken() != null);
    },
    
    _send: function(uri, params, cb, sendFunc){
        sendFunc = (sendFunc || $.getJSON);
        // Generate the uri
        params = (params || {});
        params['access_token'] = this.getToken();
        var uri = new jsUri(uri);
        _.each(params, function(value, key){
            uri.deleteQueryParam(key);
            uri.addQueryParam(key, encodeURIComponent(value));
        });
        uri = uri.toString();
        console.log('calling fb api', uri);
        // Make the call
        sendFunc(uri, cb);
    },
    
    _post: function(uri, params, cb){
        // Akin to _send, but POSTs rather than GETs
        return this._send(uri, params, cb, $.post);
    },
    
    _cachedFetch: function(key, uri, params, cb){
        // Internal function to make a cached FB call, calling a callback when
        // the result is available
        if (!this._isAuthenticated()){
            throw 'user is not logged in';
        }
        
        var fbData = localStorage['cachedFacebookData'];
        if (!fbData){
             fbData = {};
             localStorage['cachedFacebookData'] = JSON.stringify(fbData);
        } else {
            fbData = JSON.parse(fbData);
        }
        
        if (key in fbData){
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
    
    getUserData: function(cb, uid){
        // Asynchronously gets the Facebook user data (async as we have
        // to fetch it if we don't know it already)
        uid = (uid || 'me');
        return this._cachedFetch('info', ('https://graph.facebook.com/' + uid), {}, cb);
    },
    
    getFriends: function(cb){
        // Asynchronously gets the user's friend list. Also includes the information
        // for the logged-in user
        return this._cachedFetch('friends', 'https://graph.facebook.com/me/friends', {}, _.bind(function(friendRepsonse){
            this.getUserData(_.bind(function(userDataResponse){
                this.data.push(userDataResponse);
                cb(this);
            }, friendRepsonse));
        }, this));
    },
    
    getId: function(cb){
        // Asynchronously gets the user's Facebook ID
        this.getUserData(function(response){
            cb(response.id);
        });
    },
    
    getFriendNames: function(cb){
        // Asynchronously returns a mapping of friends' user IDs to display names
        this.getFriends(function(response){
            var friends = {};
            _.each(response.data, function(user){
                friends[user.id] = user.name;
            });
            cb(friends);
        });
    },
    
    postLinkToWall: function(link, uid, cb){
        // Posts the passed link to the specified user's Facebook wall.
        // Asynchronous.
        return this._post('https://graph.facebook.com/' + uid + '/feed', {
            'link': link.url,
            'name': link.title
        });
    }
}

_.bindAll(BS.Facebook);
