/*jshint mootools:true */
;(function(exports){
	'use strict';

	// wrapper function for requirejs or normal object
	var wrap = function(){
		// this is just the host object for the Epitome modules

		// helpers
		var removeOn = function(string){
				return string.replace(/^on([A-Z])/, function(full, first){
					return first.toLowerCase();
				});
			},

			addEvent = function(type, fn){
				type = removeOn(type);

				this.$events[type] = (this.$events[type] || []).include(fn);
				return this;
			}.overloadSetter(),

			removeEvent = function(type, fn){
				// does not remove remote subscribers. careful, can cause memory issues if you don't clean up
				type = removeOn(type);
				var events = this.$events[type];
				if (events){
					if (fn){
						var index = events.indexOf(fn);
						if (index != -1) delete events[index];
					}
					else {
						delete this.$events[type];
					}
				}
				return this;
			}.overloadSetter(),

			all = '*',

			undefined = 'undefined',

			func = 'function';

		var EpitomeEvents = new Class({
			// custom event implementation

			$events: {},

			$subscribers: {},

			on: addEvent,

			off: removeEvent,

			trigger: function(type, args){
				type = removeOn(type);
				var events = this.$events[type] || [],
					subs = (type in this.$subscribers) ? this.$subscribers[type] : (all in this.$subscribers) ? this.$subscribers[all] : [],
					self = this;

				if (!events && !subs) return this;
				args = Array.from(args);

				events.each(function(fn){
					// local events
					fn.apply(self, args);
				});

				subs.each(function(sub){
					// if event was added towards a specific callback, fire that
					if (sub.fn){
						sub.fn.apply(sub.context, args);
					}
					else {
						// runs on subscriber, shifting arguments to pass on instance with a fake event object.
						sub.subscriber.trigger(type, Array.combine([{
							target: sub.context,
							type: type
						}], args));
					}
				});

				return this;
			},

			listenTo: function(obj, type, fn){
				// obj: instance to subscribe to
				// type: particular event type or all events, defaults to '*'
				// last argument is the function to call, can shift to 2nd argument.
				var t = typeof type,
					event = {
						context: obj,
						subscriber: this
					};

				if (t === func){
					fn = type;
					type = all;
				}
				else if (t === undefined){
					type = all;
				}

				fn && (event.fn = fn);
				obj.$subscribers[type] = (obj.$subscribers[type] || []).include(event);
			},

			stopListening: function(obj, type, fn){
				// obj: instance to stop listening to
				// type: particular event to unsubscribe from, or all events by default. '*' for wildcard events only
				// fn: particular callback fn to unsubscribe from
				var len;
				Object.each(obj.$subscribers, function(value, key){
					len = value.length;
					if (typeof type !== undefined){
						if (key === type) while(len--)
							(((fn && fn === value[len].fn) || !fn) && value[len].context === obj) && value.splice(len, 1);
					}
					else {
						// no type, unsubscribe from all for that context object
						while(len--) value[len].context === obj && value.splice(len, 1);
					}
				});
			},

			setOptions: function(){
				//refactored setOptions to use .on and not addEvent. auto-mixed in.
				var options = this.options = Object.merge.apply(null, [{}, this.options].append(arguments)),
					option;
				for (option in options){
					if (typeOf(options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
					this.on(option, options[option]);
					delete options[option];
				}
				return this;
			}
		});

		// remove legacy methods

		var e = new EpitomeEvents();
		// export the constructor in the returned object
		e.Events = EpitomeEvents;

		return e;
	};

	if (typeof define === 'function' && define.amd){
		// returns an empty module
		define(wrap);
	}
	else {
		exports.Epitome = wrap(exports);
	}
}(this));