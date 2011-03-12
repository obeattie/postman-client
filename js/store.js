/* ---------
   Implements a consistent API for sending/receiving links to/from clients,
   abstracting away splitting between sending to a queue and sending via the
   realtime processes.
   ----------
*/

var realtime = require('./realtime'),
    redis = require('redis').createClient(),
    _ = require('underscore'),
    assert = require('assert');

var urlRe = /https?:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
var Reactor = realtime.Reactor;

// Template settings
_.templateSettings = {
    'interpolate': /\{\{(.+?)\}\}/g,
    'evaluate': /\{\%(.+?)\%\}/g
};
var keyTemplates = {
    'recipientLinks': 'links:for:{{ recipient }}'
}

var DeliveryAgent = {
    _sanitize: function(item){
        // Validates and sanitizes a link object
        var result = {
            'url': item.url,
            'title': item.title,
            'favicon': item.favicon,
            'sender': item.sender,
            'timestamp': (new Date().getTime())
        }
        // ...check the URLs are really URLs
        assert.ok(result.url.match(urlRe));
        assert.ok((!result.favicon || result.favicon.match(urlRe)))
        // Everything passed
        return result;
    },
    
    _getKey: function(recipient){
        return _.template(keyTemplates.recipientLinks, {
            recipient: recipient
        });
    },
    
    _toArray: function(){
        return _.toArray(arguments);
    },
    
    init: function(){
        Reactor.listen();
    },
    
    send: function(recipient, item, cb){
        var key = this._getKey(recipient);
        item = JSON.stringify(this._sanitize(item));
        Reactor.send(key, item);
        redis.rpush(key, item, cb);
    },
    
    depersist: function(recipient, rawItem){
        // Removes the passed item fom the persistant store. Returns the
        // removed item (the passed value) as to be chainable
        var key = this._getKey(recipient);
        redis.lrem(key, 0, rawItem);
        return rawItem;
    },
    
    listen: function(recipient, cb){
        var key = this._getKey(recipient);
        // Depersist needs to be passed recipient as an argument
        var depersist = _.bind(this.depersist, this, recipient);
        Reactor.subscribe(key, _.compose(cb, this._toArray, JSON.parse, depersist));
        // Now call check and pass any of its results back too (to catch any
        // links sent while no client was connected)
        this.check(recipient, cb);
    },
    
    silence: Reactor.silence, // Simple proxy
    
    check: function(recipient, cb){
        var key = this._getKey(recipient);
        redis.lrange(key, 0, -1, function(err, result){
            if (result) {
                result = _.map(result, JSON.parse);
                redis.ltrim(key, result.length, -1);
                cb(result);
            }
        });
    }
}

// Bind and export the agent
_.bindAll(DeliveryAgent);
exports.Agent = DeliveryAgent;
