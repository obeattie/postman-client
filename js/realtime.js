var redis = require('redis'),
    _ = require('underscore'),
    sender = redis.createClient(),
    receiver = redis.createClient();

// The reactor is responsible for sending/receiving all messages
var Reactor = {
    subscriptions: {},
    
    subscribe: function(channel, cb){
        console.log('subscribe', channel);
        if (!(channel in this.subscriptions)) {
            this.subscriptions[channel] = [];
            receiver.subscribe(channel);
        }
        this.subscriptions[channel].push(cb);
    },
    
    unsubscribe: function(channel, cb){
        console.log('unsubscribe', channel);
        this.subscriptions[channel] = (this.subscriptions[channel] || []);
        this.subscriptions[channel] = _.without(this.subscriptions[channel], cb);
    },
    
    receive: function(channel, value){
        console.log('receive', channel, value);
        _.each((this.subscriptions[channel] || []), function(cb){
            cb(value);
        });
    },
    
    send: function(channel, value){
        console.log('publish', channel, value);
        return sender.publish(channel, value);
    },
    
    listen: function(){
        receiver.on('message', this.receive);
    },
    
    silence: function(cb){
        _.each(this.subscriptions, function(value, key){
            this.subscriptions[key] = _.without(this.subscriptions[key], cb);
        }, this);
    }
}
_.bindAll(Reactor);

exports.Reactor = Reactor;
