(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cmdr = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.0.2
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$asap(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.version = exports.Console = undefined;

var _console = require('./console.js');

Object.defineProperty(exports, 'Console', {
    enumerable: true,
    get: function get() {
        return _console.default;
    }
});
exports.overlay = overlay;

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _overlayConsole2 = require('./overlay-console.js');

var _overlayConsole3 = _interopRequireDefault(_overlayConsole2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_es6Promise2.default.polyfill();

var _overlayConsole = null;
function overlay(settings) {
    if (_overlayConsole) {
        _overlayConsole.dispose();
    }
    _overlayConsole = new _overlayConsole3.default(settings);
    return _overlayConsole;
}

var version = exports.version = '1.1.0-alpha';

},{"./console.js":4,"./overlay-console.js":5,"es6-promise":1}],4:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _utils = require('./utils.js');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _defaultSettings = {
    echo: true,
    promptPrefix: '> ',
    template: '<div class="cmdr-console"><div class="output"></div><div class="input"><span class="prefix"></span><div class="prompt" spellcheck="false" contenteditable="true" /></div></div>',
    predefinedCommands: true
};

var _promptIndentPadding = typeof InstallTrigger !== 'undefined'; // Firefox - misplaced cursor when using 'text-indent'

var Console = (function () {
    function Console(containerNode, settings) {
        _classCallCheck(this, Console);

        this._settings = utils.extend({}, _defaultSettings, settings);
        this._containerNode = containerNode;
        this._consoleNode = null;
        this._inputNode = null;
        this._prefixNode = null;
        this._promptNode = null;
        this._outputNode = null;
        this._outputLineNode = null;
        this._definitions = {};
        this._current = null;
        this._queue = [];
        this._history = [];
        this._historyIndex = -1;
        this._initialized = false;

        this.init();
    }

    _createClass(Console, [{
        key: 'init',
        value: function init() {
            if (this._initialized) return;

            this._consoleNode = utils.createElement(this._settings.template);

            this._containerNode.appendChild(this._consoleNode);

            this._outputNode = this._consoleNode.querySelector('.output');
            this._inputNode = this._consoleNode.querySelector('.input');
            this._prefixNode = this._consoleNode.querySelector('.prefix');
            this._promptNode = this._consoleNode.querySelector('.prompt');

            this._promptNode.addEventListener('keydown', (function (event) {
                if (!this._current) {
                    switch (event.keyCode) {
                        case 13:
                            var value = this._promptNode.textContent;
                            if (value) {
                                this.execute(value);
                            }
                            event.preventDefault();
                            return false;
                        case 38:
                            this._historyBack();
                            event.preventDefault();
                            return false;
                        case 40:
                            this._historyForward();
                            event.preventDefault();
                            return false;
                        case 9:
                            event.preventDefault();
                            return false;
                    }
                } else if (this._current.readLine && event.keyCode === 13) {
                    this._current.readLine.resolve(this._promptNode.textContent);
                    return false;
                }
                return true;
            }).bind(this));

            this._promptNode.addEventListener('keypress', (function (event) {
                if (this._current && this._current.read) {
                    if (event.charCode !== 0) {
                        this._current.read.char = String.fromCharCode(event.charCode);
                        if (this._current.read.capture) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                return true;
            }).bind(this));

            this._promptNode.addEventListener('keyup', (function () {
                if (this._current && this._current.read && this._current.read.char) {
                    this._current.read.resolve(this._current.read.char);
                }
            }).bind(this));

            this._promptNode.addEventListener('paste', (function () {
                setTimeout((function () {
                    var value = this._promptNode.textContent;
                    var lines = value.split(/\r\n|\r|\n/g);
                    var length = lines.length;
                    if (length > 1) {
                        for (var i = 1; i < length; i++) {
                            if (lines[i].length > 0) {
                                this._queue.get(this).push(lines[i]);
                            }
                        }
                        if (this._current && this._current.readLine) {
                            this._current.readLine.resolve(lines[0]);
                        } else if (this._current && this._current.read) {
                            this._current.read.resolve(lines[0][0]);
                        } else {
                            this._current(lines[0]);
                        }
                    }
                }).bind(this), 0);
            }).bind(this));

            if (_promptIndentPadding) {
                this._promptNode.addEventListener('input', (function () {
                    prompt.css(this._getPromptIndent());
                }).bind(this));
            }

            this._consoleNode.addEventListener('click', (function (event) {
                if (event.target !== this._inputNode && !this._inputNode.contains(event.target) && event.target !== this._outputNode && !this._outputNode.contains(event.target)) {
                    this._promptNode.focus();
                }
            }).bind(this));

            if (this._settings.predefinedCommands) {
                this.predefine();
            }

            this._activateInput();

            this._initialized = true;
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            if (!this._initialized) return;

            this._containerNode.removeChild(this._consoleNode);
            this._consoleNode = null;
            this._outputNode = null;
            this._inputNode = null;
            this._prefixNode = null;
            this._promptNode = null;
            this._definitions = {};
            this._current = null;
            this._queue = [];
            this._history = [];
            this._historyIndex = -1;

            this._initialized = false;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.dispose();
            this.init();
        }
    }, {
        key: 'read',
        value: function read(callback, capture) {
            if (!this._current) return;

            this._activateInput(true);

            this._current.read = utils.defer();
            this._current.read.then((function (value) {
                this._current.read = null;
                if (!capture) {
                    this._promptNode.textContent = value;
                }
                this._deactivateInput();
                if (callback.call(this._current, value) === true) {
                    this._read(callback, capture);
                } else {
                    this._flushInput();
                }
            }).bind(this));
            this._current.read.capture = capture;

            if (this._queue.length > 0) {
                this._current.read.resolve(this._queue.shift()[0]);
            }
        }
    }, {
        key: 'readLine',
        value: function readLine(callback) {
            if (!this._current) return;

            this._activateInput(true);

            this._current.readLine = utils.defer();
            this._current.readLine.then((function (value) {
                this._current.readLine = null;
                this._promptNode.textContent = value;
                this._deactivateInput();
                this._flushInput();
                if (callback.call(this._current, value) === true) {
                    this.readLine(callback);
                }
            }).bind(this));

            if (this._queue.length > 0) {
                this._current.readLine.resolve(this._queue.shift());
            }
        }
    }, {
        key: 'write',
        value: function write(value, cssClass) {
            value = value || '';
            var outputValue = utils.createElement('<span class="' + cssClass + '">' + value + '</span>');
            if (!this._outputLineNode) {
                this._outputLineNode = utils.createElement('<div></div>');
                this._outputNode.appendChild(this._outputLineNode);
            }
            this._outputLineNode.appendChild(outputValue);
        }
    }, {
        key: 'writeLine',
        value: function writeLine(value, cssClass) {
            value = (value || '') + '\n';
            this.write(value, cssClass);
            this._outputLineNode = null;
        }
    }, {
        key: 'writePad',
        value: function writePad(value, padding, length, cssClass) {
            this.write(utils.pad(value, padding, length), cssClass);
        }
    }, {
        key: 'clear',
        value: function clear() {
            this._outputNode.innerHTML = '';
        }
    }, {
        key: 'focus',
        value: function focus() {
            this._promptNode.focus();
        }
    }, {
        key: 'blur',
        value: function blur() {
            utils.blur(this._promptNode);
        }
    }, {
        key: 'execute',
        value: function execute(command) {
            if (this._current) {
                this._queue.push(command);
                return;
            }

            if (typeof command !== 'string' || command.length === 0) {
                throw 'Invalid command';
            }

            this._promptNode.textContent = command;
            this._flushInput(!this._settings.echo);
            this._historyAdd(command);
            this._deactivateInput();

            command = command.trim();

            var parsed = this._parseCommand(command);

            var definitions = this._getDefinitions(parsed.name);
            if (!definitions || definitions.length < 1) {
                this.writeLine('Invalid command', 'error');
                this._activateInput();
                return;
            } else if (definitions.length > 1) {
                this.writeLine('Ambiguous command', 'error');
                this.writeLine();
                for (var i = 0; i < definitions.length; i++) {
                    this.writePad(definitions[i].name, ' ', 10);
                    this.writeLine(definitions[i].description);
                }
                this.writeLine();
                this._activateInput();
                return;
            }

            var definition = definitions[0];

            this._current = {
                command: command,
                definition: definition,
                console: this
            };

            var args = parsed.args;
            if (!definition.parse) {
                args = [parsed.arg];
            }

            var result;
            try {
                result = definition.callback.apply(this._current, args);
            } catch (error) {
                this.writeLine('Unhandled exception. See consoleNode log for details.', 'error');
                console.error(error);
            }

            Promise.all([result]).then((function () {
                setTimeout((function () {
                    this._current = null;
                    this._activateInput();
                    if (this._queue.length > 0) {
                        this.execute(this._queue.shift());
                    }
                }).bind(this), 0);
            }).bind(this));
        }
    }, {
        key: 'define',
        value: function define(names, callback, settings) {
            var definitions = this._createDefinitions(names, callback, settings);
            for (var i = 0, l = definitions.length; i < l; i++) {
                this._definitions[definitions[i].name] = definitions[i];
            }
        }
    }, {
        key: 'predefine',
        value: function predefine() {
            this.define(['HELP', '?'], function () {
                this.console.writeLine('The following commands are available:');
                this.console.writeLine();
                for (var key in this.console.definitions) {
                    var definition = this.console.definitions[key];
                    if (!!utils.unwrap(definition.available)) {
                        this.console.writePad(key, ' ', 10);
                        this.console.writeLine(definition.description);
                    }
                }
                this.console.writeLine();
            }, {
                description: 'Lists the available commands'
            });

            this.define('ECHO', function (arg) {
                var toggle = arg.toUpperCase();
                if (toggle === 'ON') {
                    this.console.settings.echo = true;
                } else if (toggle === 'OFF') {
                    this.console.settings.echo = false;
                } else {
                    this.console.writeLine(arg);
                }
            }, {
                parse: false,
                description: 'Displays provided text or toggles command echoing'
            });

            this.define(['CLS'], function () {
                this.console.clear();
            }, {
                description: 'Clears the command prompt'
            });
        }
    }, {
        key: '_activateInput',
        value: function _activateInput(inline) {
            if (inline) {
                if (this._outputLineNode) {
                    this._prefixNode.textContent = this._outputLineNode.textContent;
                    this._outputNode.removeChild(this._outputLineNode);
                    this._outputLineNode = null;
                }
            } else {
                this._prefixNode.textContent = this._settings.promptPrefix;
            }
            this._inputNode.style.display = '';
            setTimeout((function () {
                this._promptNode.setAttribute('disabled', false);
                this._setPromptIndent();
                this._promptNode.focus();
                utils.smoothScroll(this._consoleNode, this._consoleNode.scrollHeight, 1000);
            }).bind(this), 0);
        }
    }, {
        key: '_deactivateInput',
        value: function _deactivateInput() {
            this._promptNode.setAttribute('disabled', true);
            this._inputNode.style.display = 'none';
        }
    }, {
        key: '_flushInput',
        value: function _flushInput(preventWrite) {
            if (!preventWrite) {
                this.write(this._prefixNode.textContent);
                this.writeLine(this._promptNode.textContent);
            }
            this._prefixNode.textContent = '';
            this._promptNode.textContent = '';
        }
    }, {
        key: '_historyAdd',
        value: function _historyAdd(command) {
            this._history.unshift(command);
            this._historyIndex = -1;
        }
    }, {
        key: '_historyBack',
        value: function _historyBack() {
            if (this._history.length > this._historyIndex + 1) {
                this._historyIndex++;
                this._promptNode.textContent = history[this._historyIndex];
                var event = document.createEvent('HTMLEvents');
                event.initEvent('change', true, false);
                this._promptNode.dispatchEvent(event);
            }
        }
    }, {
        key: '_historyForward',
        value: function _historyForward() {
            if (this._historyIndex > 0) {
                this._historyIndex--;
                this._promptNode.textContent = history[this._historyIndex];
                var event = document.createEvent('HTMLEvents');
                event.initEvent('change', true, false);
                this._promptNode.dispatchEvent(event);
            }
        }
    }, {
        key: '_parseCommand',
        value: function _parseCommand(command) {
            var exp = /[^\s"]+|"([^"]*)"/gi,
                name = null,
                arg = null,
                args = [],
                match = null;

            do {
                match = exp.exec(command);
                if (match !== null) {
                    var value = match[1] ? match[1] : match[0];
                    if (match.index === 0) {
                        name = value;
                        arg = command.substr(value.length + (match[1] ? 3 : 1));
                    } else {
                        args.push(value);
                    }
                }
            } while (match !== null);

            return {
                name: name,
                arg: arg,
                args: args
            };
        }
    }, {
        key: '_createDefinitions',
        value: function _createDefinitions(names, callback, settings) {
            if (typeof names !== 'string' && !Array.isArray(names)) {
                settings = callback;
                callback = names;
                names = null;
            }
            if (typeof callback !== 'function') {
                settings = callback;
                callback = null;
            }

            if (typeof names === 'string') {
                names = [names];
            } else if (Array.isArray(names)) {
                names = names.filter(function (value) {
                    return typeof value === 'string';
                });
            }

            if (!Array.isArray(names) || names.length === 0 || typeof callback !== 'function') {
                throw 'Invalid command definition';
            }

            var definitions = [];

            for (var i = 0, l = names.length; i < l; i++) {
                var definition = {
                    name: names[i].toUpperCase(),
                    callback: callback,
                    parse: true,
                    available: true
                };

                utils.extend(definition, settings);

                definitions.push(definition);
            }

            return definitions;
        }
    }, {
        key: '_getDefinitions',
        value: function _getDefinitions(name) {
            name = name.toUpperCase();

            var definition = this._definitions[name];

            if (definition) {
                return [definition];
            }

            var definitions = [];

            for (var key in this._definitions) {
                if (key.indexOf(name, 0) === 0 && utils.unwrap(this._definitions[key].available)) {
                    definitions.push(this._definitions[key]);
                }
            }

            return definitions;
        }
    }, {
        key: '_getPrefixWidth',
        value: function _getPrefixWidth() {
            var width = this._prefixNode.getBoundingClientRect().width;
            var text = this._prefixNode.textContent;
            var spacePadding = text.length - text.trim().length;

            if (!this._prefixNode._spaceWidth) {
                var elem1 = utils.createElement('<span style="visibility: hidden">| |</span>');
                this._prefixNode.appendChild(elem1);
                var elem2 = utils.createElement('<span style="visibility: hidden">||</span>');
                this._prefixNode.appendChild(elem2);
                this._prefixNode._spaceWidth = elem1.offsetWidth - elem2.offsetWidth;
                this._prefixNode.removeChild(elem1);
                this._prefixNode.removeChild(elem2);
            }

            width += spacePadding * this._prefixNode._spaceWidth;
            return width;
        }
    }, {
        key: '_setPromptIndent',
        value: function _setPromptIndent() {
            var prefixWidth = this._getPrefixWidth() + 'px';
            if (_promptIndentPadding) {
                if (this._promptNode.textContent) {
                    this._promptNode.style.textIndent = prefixWidth;
                    this._promptNode.style.paddingLeft = '';
                } else {
                    this._promptNode.style.textIndent = '';
                    this._promptNode.style.paddingLeft = prefixWidth;
                }
            } else {
                this._promptNode.style.textIndent = prefixWidth;
            }
        }
    }, {
        key: 'settings',
        get: function get() {
            return this._settings;
        }
    }, {
        key: 'definitions',
        get: function get() {
            return this._definitions;
        }
    }, {
        key: 'initialized',
        get: function get() {
            return this._initialized;
        }
    }]);

    return Console;
})();

exports.default = Console;

},{"./utils.js":6}],5:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _utils = require('./utils.js');

var utils = _interopRequireWildcard(_utils);

var _console = require('./console.js');

var _console2 = _interopRequireDefault(_console);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _defaultSettings = {
    autoOpen: false,
    openKey: 192,
    closeKey: 27
};

var _overlayNode = null;

var OverlayConsole = (function (_Console) {
    _inherits(OverlayConsole, _Console);

    function OverlayConsole(settings) {
        _classCallCheck(this, OverlayConsole);

        if (!_overlayNode) {
            _overlayNode = utils.createElement('<div style="display: none" class="cmdr-overlay"></div>');
            document.body.appendChild(_overlayNode);
        }

        settings = utils.extend({}, _defaultSettings, settings);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(OverlayConsole).call(this, _overlayNode, settings));

        _this._overlayNode = _overlayNode;
        _this._documentEventHandler = null;
        return _this;
    }

    _createClass(OverlayConsole, [{
        key: 'init',
        value: function init() {
            if (this.initialized) return;

            this._documentEventHandler = (function (event) {
                if (!this.isOpen() && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(event.target.tagName) === -1 && !event.target.isContentEditable && event.keyCode == this.settings.openKey) {
                    event.preventDefault();
                    this.open();
                } else if (this.isOpen() && event.keyCode == this.settings.closeKey) {
                    this.close();
                }
            }).bind(this);

            document.addEventListener('keydown', this._documentEventHandler);

            _get(Object.getPrototypeOf(OverlayConsole.prototype), 'init', this).call(this);

            if (this.settings.autoOpen) {
                this.open();
            }
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            if (!this.initialized) return;

            document.removeEventListener('keydown', this._documentEventHandler);

            this.close();

            _get(Object.getPrototypeOf(OverlayConsole.prototype), 'dispose', this).call(this);
        }
    }, {
        key: 'isOpen',
        value: function isOpen() {
            return this._overlayNode.style.display !== 'none';
        }
    }, {
        key: 'open',
        value: function open() {
            this._overlayNode.style.display = '';

            setTimeout((function () {
                this._setPromptIndent(); //hack: using 'private' method from base class to fix indent
                this.focus();
            }).bind(this), 0);
        }
    }, {
        key: 'close',
        value: function close() {
            this._overlayNode.style.display = 'none';
            this.blur();
        }
    }, {
        key: 'predefine',
        value: function predefine() {
            _get(Object.getPrototypeOf(OverlayConsole.prototype), 'predefine', this).call(this);

            this.define(['CLOSE', 'EXIT'], function () {
                this.console.close();
            }, {
                description: 'Closes the command prompt'
            });
        }
    }]);

    return OverlayConsole;
})(_console2.default);

exports.default = OverlayConsole;

},{"./console.js":4,"./utils.js":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.extend = extend;
exports.createElement = createElement;
exports.pad = pad;
exports.unwrap = unwrap;
exports.smoothScroll = smoothScroll;
exports.defer = defer;
exports.blur = blur;

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function extend(out) {
    out = out || {};
    for (var i = 1; i < arguments.length; i++) {
        var obj = arguments[i];
        if (!obj) continue;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (_typeof(obj[key]) === 'object') extend(out[key], obj[key]);else out[key] = obj[key];
            }
        }
    }
    return out;
};

function createElement(html) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstChild;
};

function pad(value, padding, length) {
    var right = length >= 0;
    length = Math.abs(length);
    while (value.length < length) {
        value = right ? value + padding : padding + value;
    }
    return value;
}

function unwrap(value) {
    return typeof value === 'function' ? value() : value;
}

function smoothScroll(element, target, duration) {
    target = Math.round(target);
    duration = Math.round(duration);
    if (duration < 0) {
        return Promise.reject("Invalid duration");
    }
    if (duration === 0) {
        element.scrollTop = target;
        return Promise.resolve();
    }

    var startTime = Date.now();
    var endTime = startTime + duration;

    var startTop = element.scrollTop;
    var distance = target - startTop;

    var smoothStep = function smoothStep(start, end, point) {
        if (point <= start) {
            return 0;
        }
        if (point >= end) {
            return 1;
        }
        var x = (point - start) / (end - start);
        return x * x * (3 - 2 * x);
    };

    return new Promise(function (resolve, reject) {
        var previousTop = element.scrollTop;

        var scrollFrame = function scrollFrame() {
            if (element.scrollTop != previousTop) {
                reject("interrupted");
                return;
            }

            var now = Date.now();
            var point = smoothStep(startTime, endTime, now);
            var frameTop = Math.round(startTop + distance * point);
            element.scrollTop = frameTop;

            if (now >= endTime) {
                resolve();
                return;
            }

            if (element.scrollTop === previousTop && element.scrollTop !== frameTop) {
                resolve();
                return;
            }
            previousTop = element.scrollTop;

            setTimeout(scrollFrame, 0);
        };

        setTimeout(scrollFrame, 0);
    });
}

function defer() {
    function Deferred() {
        this.promise = new Promise((function (resolve, reject) {
            this.resolve = resolve;
            this.reject = reject;
        }).bind(this));

        this.then = this.promise.then.bind(this.promise);
        this.catch = this.promise.catch.bind(this.promise);
    };

    return new Deferred();
}

function blur() {
    var element = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

    if (element && element !== document.activeElement) return;
    var temp = document.createElement("input");
    document.body.appendChild(temp);
    temp.focus();
    document.body.removeChild(temp);
}

},{}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9lczYtcHJvbWlzZS5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmNcXGNtZHIuanMiLCJzcmNcXGNvbnNvbGUuanMiLCJzcmNcXG92ZXJsYXktY29uc29sZS5qcyIsInNyY1xcdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3Y4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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aEIsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUNuRCxnQkFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsZ0JBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1NBQ3hCLENBQUEsQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFFZixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsWUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3RELENBQUM7O0FBRUYsV0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO0NBQ3pCOztBQUVNLFNBQVMsSUFBSSxHQUFpQjtRQUFoQixPQUFPLHlEQUFHLElBQUk7O0FBQy9CLFFBQUksT0FBTyxJQUFJLE9BQU8sS0FBSyxRQUFRLENBQUMsYUFBYSxFQUFFLE9BQU87QUFDMUQsUUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMzQyxZQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQyxRQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixZQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUNuQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vamFrZWFyY2hpYmFsZC9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICAzLjAuMlxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8ICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZSh4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQ7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbjtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcCA9IGZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2xpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW5dID0gY2FsbGJhY2s7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiArIDFdID0gYXJnO1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiArPSAyO1xuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPT09IDIpIHtcbiAgICAgICAgLy8gSWYgbGVuIGlzIDIsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgICAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgICAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4obGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldFNjaGVkdWxlcihzY2hlZHVsZUZuKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4gPSBzY2hlZHVsZUZuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzZXRBc2FwKGFzYXBGbikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAgPSBhc2FwRm47XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93ID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyB8fCB7fTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNOb2RlID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuICAgIC8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuICAgIC8vIG5vZGVcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKSB7XG4gICAgICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3Vqb2pzL3doZW4vaXNzdWVzLzQxMCBmb3IgZGV0YWlsc1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHZlcnR4XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHdlYiB3b3JrZXJcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2g7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gsIDEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbjsgaSs9Mikge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV07XG4gICAgICAgIHZhciBhcmcgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXTtcblxuICAgICAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydHgoKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2g7XG4gICAgLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbiAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnR4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKCkge31cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICAgPSB2b2lkIDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCA9IDE7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICA9IDI7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IgPSBuZXcgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxmaWxsbWVudCgpIHtcbiAgICAgIHJldHVybiBuZXcgVHlwZUVycm9yKFwiWW91IGNhbm5vdCByZXNvbHZlIGEgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRjYW5ub3RSZXR1cm5Pd24oKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGVFcnJvcignQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4ocHJvbWlzZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbjtcbiAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IuZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeVRoZW4odGhlbiwgdmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhlbi5jYWxsKHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSwgdGhlbikge1xuICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgICAgdmFyIHNlYWxlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgZXJyb3IgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlUaGVuKHRoZW4sIHRoZW5hYmxlLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmIChzZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodGhlbmFibGUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICBpZiAoc2VhbGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG5cbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSwgJ1NldHRsZTogJyArIChwcm9taXNlLl9sYWJlbCB8fCAnIHVua25vd24gcHJvbWlzZScpKTtcblxuICAgICAgICBpZiAoIXNlYWxlZCAmJiBlcnJvcikge1xuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSwgcHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUpIHtcbiAgICAgIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICAgICAgfSBlbHNlIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZSh0aGVuYWJsZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlKSB7XG4gICAgICBpZiAobWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB0aGVuID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbihtYXliZVRoZW5hYmxlKTtcblxuICAgICAgICBpZiAodGhlbiA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IuZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHRoZW4pKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxmaWxsbWVudCgpKTtcbiAgICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgICAgaWYgKHByb21pc2UuX29uZXJyb3IpIHtcbiAgICAgICAgcHJvbWlzZS5fb25lcnJvcihwcm9taXNlLl9yZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cblxuICAgICAgcHJvbWlzZS5fcmVzdWx0ID0gdmFsdWU7XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRDtcblxuICAgICAgaWYgKHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoLCBwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHsgcmV0dXJuOyB9XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEO1xuICAgICAgcHJvbWlzZS5fcmVzdWx0ID0gcmVhc29uO1xuXG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gICAgICB2YXIgbGVuZ3RoID0gc3Vic2NyaWJlcnMubGVuZ3RoO1xuXG4gICAgICBwYXJlbnQuX29uZXJyb3IgPSBudWxsO1xuXG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGhdID0gY2hpbGQ7XG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGggKyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEXSAgPSBvblJlamVjdGlvbjtcblxuICAgICAgaWYgKGxlbmd0aCA9PT0gMCAmJiBwYXJlbnQuX3N0YXRlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaChwcm9taXNlKSB7XG4gICAgICB2YXIgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycztcbiAgICAgIHZhciBzZXR0bGVkID0gcHJvbWlzZS5fc3RhdGU7XG5cbiAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHsgcmV0dXJuOyB9XG5cbiAgICAgIHZhciBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCA9IHByb21pc2UuX3Jlc3VsdDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMykge1xuICAgICAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJzW2kgKyBzZXR0bGVkXTtcblxuICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCkge1xuICAgICAgdGhpcy5lcnJvciA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUiA9IG5ldyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SLmVycm9yID0gZTtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBwcm9taXNlLCBjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB2YXIgaGFzQ2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24oY2FsbGJhY2spLFxuICAgICAgICAgIHZhbHVlLCBlcnJvciwgc3VjY2VlZGVkLCBmYWlsZWQ7XG5cbiAgICAgIGlmIChoYXNDYWxsYmFjaykge1xuICAgICAgICB2YWx1ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeUNhdGNoKGNhbGxiYWNrLCBkZXRhaWwpO1xuXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SKSB7XG4gICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICBlcnJvciA9IHZhbHVlLmVycm9yO1xuICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGNhbm5vdFJldHVybk93bigpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICAvLyBub29wXG4gICAgICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZShwcm9taXNlLCByZXNvbHZlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZnVuY3Rpb24gcmVzb2x2ZVByb21pc2UodmFsdWUpe1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbiByZWplY3RQcm9taXNlKHJlYXNvbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IoQ29uc3RydWN0b3IsIGlucHV0KSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICAgIGVudW1lcmF0b3IuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgICAgIGVudW1lcmF0b3IucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKGVudW1lcmF0b3IuX3ZhbGlkYXRlSW5wdXQoaW5wdXQpKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX2lucHV0ICAgICA9IGlucHV0O1xuICAgICAgICBlbnVtZXJhdG9yLmxlbmd0aCAgICAgPSBpbnB1dC5sZW5ndGg7XG4gICAgICAgIGVudW1lcmF0b3IuX3JlbWFpbmluZyA9IGlucHV0Lmxlbmd0aDtcblxuICAgICAgICBlbnVtZXJhdG9yLl9pbml0KCk7XG5cbiAgICAgICAgaWYgKGVudW1lcmF0b3IubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChlbnVtZXJhdG9yLnByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW51bWVyYXRvci5sZW5ndGggPSBlbnVtZXJhdG9yLmxlbmd0aCB8fCAwO1xuICAgICAgICAgIGVudW1lcmF0b3IuX2VudW1lcmF0ZSgpO1xuICAgICAgICAgIGlmIChlbnVtZXJhdG9yLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwoZW51bWVyYXRvci5wcm9taXNlLCBlbnVtZXJhdG9yLl9yZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KGVudW1lcmF0b3IucHJvbWlzZSwgZW51bWVyYXRvci5fdmFsaWRhdGlvbkVycm9yKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fdmFsaWRhdGVJbnB1dCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5KGlucHV0KTtcbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl92YWxpZGF0aW9uRXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0FycmF5IE1ldGhvZHMgbXVzdCBiZSBwcm92aWRlZCBhbiBBcnJheScpO1xuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG4gICAgfTtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yO1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgdmFyIGxlbmd0aCAgPSBlbnVtZXJhdG9yLmxlbmd0aDtcbiAgICAgIHZhciBwcm9taXNlID0gZW51bWVyYXRvci5wcm9taXNlO1xuICAgICAgdmFyIGlucHV0ICAgPSBlbnVtZXJhdG9yLl9pbnB1dDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBlbnVtZXJhdG9yLl9lYWNoRW50cnkoaW5wdXRbaV0sIGkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2VhY2hFbnRyeSA9IGZ1bmN0aW9uKGVudHJ5LCBpKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG4gICAgICB2YXIgYyA9IGVudW1lcmF0b3IuX2luc3RhbmNlQ29uc3RydWN0b3I7XG5cbiAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZShlbnRyeSkpIHtcbiAgICAgICAgaWYgKGVudHJ5LmNvbnN0cnVjdG9yID09PSBjICYmIGVudHJ5Ll9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICAgIGVudHJ5Ll9vbmVycm9yID0gbnVsbDtcbiAgICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoZW50cnkuX3N0YXRlLCBpLCBlbnRyeS5fcmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLl93aWxsU2V0dGxlQXQoYy5yZXNvbHZlKGVudHJ5KSwgaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3JlbWFpbmluZy0tO1xuICAgICAgICBlbnVtZXJhdG9yLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9zZXR0bGVkQXQgPSBmdW5jdGlvbihzdGF0ZSwgaSwgdmFsdWUpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcbiAgICAgIHZhciBwcm9taXNlID0gZW51bWVyYXRvci5wcm9taXNlO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nLS07XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW51bWVyYXRvci5fcmVzdWx0W2ldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGVudW1lcmF0b3IuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fd2lsbFNldHRsZUF0ID0gZnVuY3Rpb24ocHJvbWlzZSwgaSkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocHJvbWlzZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVELCBpLCB2YWx1ZSk7XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVELCBpLCByZWFzb24pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGFsbChlbnRyaWVzKSB7XG4gICAgICByZXR1cm4gbmV3IGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRkZWZhdWx0KHRoaXMsIGVudHJpZXMpLnByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGFsbDtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRyYWNlKGVudHJpZXMpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKCFsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkoZW50cmllcykpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKSk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgbGVuZ3RoID0gZW50cmllcy5sZW5ndGg7XG5cbiAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbG1lbnQodmFsdWUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0aW9uKHJlYXNvbikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUoQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKSwgdW5kZWZpbmVkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2U7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkcmVzb2x2ZShvYmplY3QpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gQ29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0KHJlYXNvbikge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkY291bnRlciA9IDA7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSByZXNvbHZlciBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIHByb21pc2UgY29uc3RydWN0b3InKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlO1xuICAgIC8qKlxuICAgICAgUHJvbWlzZSBvYmplY3RzIHJlcHJlc2VudCB0aGUgZXZlbnR1YWwgcmVzdWx0IG9mIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFRoZVxuICAgICAgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCwgd2hpY2hcbiAgICAgIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlIHJlYXNvblxuICAgICAgd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgICAgIFRlcm1pbm9sb2d5XG4gICAgICAtLS0tLS0tLS0tLVxuXG4gICAgICAtIGBwcm9taXNlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gd2l0aCBhIGB0aGVuYCBtZXRob2Qgd2hvc2UgYmVoYXZpb3IgY29uZm9ybXMgdG8gdGhpcyBzcGVjaWZpY2F0aW9uLlxuICAgICAgLSBgdGhlbmFibGVgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB0aGF0IGRlZmluZXMgYSBgdGhlbmAgbWV0aG9kLlxuICAgICAgLSBgdmFsdWVgIGlzIGFueSBsZWdhbCBKYXZhU2NyaXB0IHZhbHVlIChpbmNsdWRpbmcgdW5kZWZpbmVkLCBhIHRoZW5hYmxlLCBvciBhIHByb21pc2UpLlxuICAgICAgLSBgZXhjZXB0aW9uYCBpcyBhIHZhbHVlIHRoYXQgaXMgdGhyb3duIHVzaW5nIHRoZSB0aHJvdyBzdGF0ZW1lbnQuXG4gICAgICAtIGByZWFzb25gIGlzIGEgdmFsdWUgdGhhdCBpbmRpY2F0ZXMgd2h5IGEgcHJvbWlzZSB3YXMgcmVqZWN0ZWQuXG4gICAgICAtIGBzZXR0bGVkYCB0aGUgZmluYWwgcmVzdGluZyBzdGF0ZSBvZiBhIHByb21pc2UsIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cblxuICAgICAgQSBwcm9taXNlIGNhbiBiZSBpbiBvbmUgb2YgdGhyZWUgc3RhdGVzOiBwZW5kaW5nLCBmdWxmaWxsZWQsIG9yIHJlamVjdGVkLlxuXG4gICAgICBQcm9taXNlcyB0aGF0IGFyZSBmdWxmaWxsZWQgaGF2ZSBhIGZ1bGZpbGxtZW50IHZhbHVlIGFuZCBhcmUgaW4gdGhlIGZ1bGZpbGxlZFxuICAgICAgc3RhdGUuICBQcm9taXNlcyB0aGF0IGFyZSByZWplY3RlZCBoYXZlIGEgcmVqZWN0aW9uIHJlYXNvbiBhbmQgYXJlIGluIHRoZVxuICAgICAgcmVqZWN0ZWQgc3RhdGUuICBBIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5ldmVyIGEgdGhlbmFibGUuXG5cbiAgICAgIFByb21pc2VzIGNhbiBhbHNvIGJlIHNhaWQgdG8gKnJlc29sdmUqIGEgdmFsdWUuICBJZiB0aGlzIHZhbHVlIGlzIGFsc28gYVxuICAgICAgcHJvbWlzZSwgdGhlbiB0aGUgb3JpZ2luYWwgcHJvbWlzZSdzIHNldHRsZWQgc3RhdGUgd2lsbCBtYXRjaCB0aGUgdmFsdWUnc1xuICAgICAgc2V0dGxlZCBzdGF0ZS4gIFNvIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgcmVqZWN0cyB3aWxsXG4gICAgICBpdHNlbGYgcmVqZWN0LCBhbmQgYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCBmdWxmaWxscyB3aWxsXG4gICAgICBpdHNlbGYgZnVsZmlsbC5cblxuXG4gICAgICBCYXNpYyBVc2FnZTpcbiAgICAgIC0tLS0tLS0tLS0tLVxuXG4gICAgICBgYGBqc1xuICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gb24gc3VjY2Vzc1xuICAgICAgICByZXNvbHZlKHZhbHVlKTtcblxuICAgICAgICAvLyBvbiBmYWlsdXJlXG4gICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQWR2YW5jZWQgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS0tLS1cblxuICAgICAgUHJvbWlzZXMgc2hpbmUgd2hlbiBhYnN0cmFjdGluZyBhd2F5IGFzeW5jaHJvbm91cyBpbnRlcmFjdGlvbnMgc3VjaCBhc1xuICAgICAgYFhNTEh0dHBSZXF1ZXN0YHMuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlcjtcbiAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gdGhpcy5ET05FKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdnZXRKU09OOiBgJyArIHVybCArICdgIGZhaWxlZCB3aXRoIHN0YXR1czogWycgKyB0aGlzLnN0YXR1cyArICddJykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGdldEpTT04oJy9wb3N0cy5qc29uJykudGhlbihmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgLy8gb24gcmVqZWN0aW9uXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBVbmxpa2UgY2FsbGJhY2tzLCBwcm9taXNlcyBhcmUgZ3JlYXQgY29tcG9zYWJsZSBwcmltaXRpdmVzLlxuXG4gICAgICBgYGBqc1xuICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICBnZXRKU09OKCcvcG9zdHMnKSxcbiAgICAgICAgZ2V0SlNPTignL2NvbW1lbnRzJylcbiAgICAgIF0pLnRoZW4oZnVuY3Rpb24odmFsdWVzKXtcbiAgICAgICAgdmFsdWVzWzBdIC8vID0+IHBvc3RzSlNPTlxuICAgICAgICB2YWx1ZXNbMV0gLy8gPT4gY29tbWVudHNKU09OXG5cbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBjbGFzcyBQcm9taXNlXG4gICAgICBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlclxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQGNvbnN0cnVjdG9yXG4gICAgKi9cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZShyZXNvbHZlcikge1xuICAgICAgdGhpcy5faWQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkY291bnRlcisrO1xuICAgICAgdGhpcy5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9zdWJzY3JpYmVycyA9IFtdO1xuXG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCAhPT0gcmVzb2x2ZXIpIHtcbiAgICAgICAgaWYgKCFsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24ocmVzb2x2ZXIpKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzUmVzb2x2ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSkpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHRoaXMsIHJlc29sdmVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5hbGwgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmFjZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVzb2x2ZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVqZWN0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyO1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRBc2FwID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXA7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX2FzYXAgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcDtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSxcblxuICAgIC8qKlxuICAgICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIENoYWluaW5nXG4gICAgICAtLS0tLS0tLVxuXG4gICAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICAgIH0pO1xuXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuICAgICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQXNzaW1pbGF0aW9uXG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIGF1dGhvciwgYm9va3M7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuXG4gICAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcblxuICAgICAgfVxuXG4gICAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRBdXRob3IoKS5cbiAgICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCB0aGVuXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgdGhlbjogZnVuY3Rpb24ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHBhcmVudC5fc3RhdGU7XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQgJiYgIW9uRnVsZmlsbG1lbnQgfHwgc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICYmICFvblJlamVjdGlvbikge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoaWxkID0gbmV3IHRoaXMuY29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICAgIHZhciByZXN1bHQgPSBwYXJlbnQuX3Jlc3VsdDtcblxuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHNbc3RhdGUgLSAxXTtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChmdW5jdGlvbigpe1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcmVzdWx0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgfSxcblxuICAgIC8qKlxuICAgICAgYGNhdGNoYCBpcyBzaW1wbHkgc3VnYXIgZm9yIGB0aGVuKHVuZGVmaW5lZCwgb25SZWplY3Rpb24pYCB3aGljaCBtYWtlcyBpdCB0aGUgc2FtZVxuICAgICAgYXMgdGhlIGNhdGNoIGJsb2NrIG9mIGEgdHJ5L2NhdGNoIHN0YXRlbWVudC5cblxuICAgICAgYGBganNcbiAgICAgIGZ1bmN0aW9uIGZpbmRBdXRob3IoKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHN5bmNocm9ub3VzXG4gICAgICB0cnkge1xuICAgICAgICBmaW5kQXV0aG9yKCk7XG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfVxuXG4gICAgICAvLyBhc3luYyB3aXRoIHByb21pc2VzXG4gICAgICBmaW5kQXV0aG9yKCkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBtZXRob2QgY2F0Y2hcbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0aW9uXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgICAnY2F0Y2gnOiBmdW5jdGlvbihvblJlamVjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkcG9seWZpbGwoKSB7XG4gICAgICB2YXIgbG9jYWw7XG5cbiAgICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gZ2xvYmFsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxvY2FsID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncG9seWZpbGwgZmFpbGVkIGJlY2F1c2UgZ2xvYmFsIG9iamVjdCBpcyB1bmF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50Jyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgUCA9IGxvY2FsLlByb21pc2U7XG5cbiAgICAgIGlmIChQICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChQLnJlc29sdmUoKSkgPT09ICdbb2JqZWN0IFByb21pc2VdJyAmJiAhUC5jYXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbG9jYWwuUHJvbWlzZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0O1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlID0ge1xuICAgICAgJ1Byb21pc2UnOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCxcbiAgICAgICdwb2x5ZmlsbCc6IGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdFxuICAgIH07XG5cbiAgICAvKiBnbG9iYWwgZGVmaW5lOnRydWUgbW9kdWxlOnRydWUgd2luZG93OiB0cnVlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gbGliJGVzNiRwcm9taXNlJHVtZCQkRVM2UHJvbWlzZTsgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGVbJ2V4cG9ydHMnXSkge1xuICAgICAgbW9kdWxlWydleHBvcnRzJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzWydFUzZQcm9taXNlJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdCgpO1xufSkuY2FsbCh0aGlzKTtcblxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJpbXBvcnQgcHJvbWlzZSBmcm9tICdlczYtcHJvbWlzZSc7XHJcbnByb21pc2UucG9seWZpbGwoKTtcclxuXHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgQ29uc29sZSB9IGZyb20gJy4vY29uc29sZS5qcyc7XHJcblxyXG5pbXBvcnQgT3ZlcmxheUNvbnNvbGUgZnJvbSAnLi9vdmVybGF5LWNvbnNvbGUuanMnO1xyXG52YXIgX292ZXJsYXlDb25zb2xlID0gbnVsbDtcclxuZXhwb3J0IGZ1bmN0aW9uIG92ZXJsYXkoc2V0dGluZ3MpIHtcclxuICAgIGlmIChfb3ZlcmxheUNvbnNvbGUpIHtcclxuICAgICAgICBfb3ZlcmxheUNvbnNvbGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG4gICAgX292ZXJsYXlDb25zb2xlID0gbmV3IE92ZXJsYXlDb25zb2xlKHNldHRpbmdzKTtcclxuICAgIHJldHVybiBfb3ZlcmxheUNvbnNvbGU7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB2ZXJzaW9uID0gJzEuMS4wLWFscGhhJzsiLCJpbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL3V0aWxzLmpzJztcclxuXHJcbmNvbnN0IF9kZWZhdWx0U2V0dGluZ3MgPSB7XHJcbiAgICBlY2hvOiB0cnVlLFxyXG4gICAgcHJvbXB0UHJlZml4OiAnPiAnLFxyXG4gICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwiY21kci1jb25zb2xlXCI+PGRpdiBjbGFzcz1cIm91dHB1dFwiPjwvZGl2PjxkaXYgY2xhc3M9XCJpbnB1dFwiPjxzcGFuIGNsYXNzPVwicHJlZml4XCI+PC9zcGFuPjxkaXYgY2xhc3M9XCJwcm9tcHRcIiBzcGVsbGNoZWNrPVwiZmFsc2VcIiBjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCIgLz48L2Rpdj48L2Rpdj4nLFxyXG4gICAgcHJlZGVmaW5lZENvbW1hbmRzOiB0cnVlXHJcbn07XHJcblxyXG5jb25zdCBfcHJvbXB0SW5kZW50UGFkZGluZyA9IHR5cGVvZiBJbnN0YWxsVHJpZ2dlciAhPT0gJ3VuZGVmaW5lZCc7IC8vIEZpcmVmb3ggLSBtaXNwbGFjZWQgY3Vyc29yIHdoZW4gdXNpbmcgJ3RleHQtaW5kZW50J1xyXG5cclxuY2xhc3MgQ29uc29sZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXJOb2RlLCBzZXR0aW5ncykge1xyXG4gICAgICAgIHRoaXMuX3NldHRpbmdzID0gdXRpbHMuZXh0ZW5kKHt9LCBfZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyTm9kZSA9IGNvbnRhaW5lck5vZGU7XHJcbiAgICAgICAgdGhpcy5fY29uc29sZU5vZGUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2lucHV0Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fcHJlZml4Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fb3V0cHV0Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fb3V0cHV0TGluZU5vZGUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2RlZmluaXRpb25zID0ge307XHJcbiAgICAgICAgdGhpcy5fY3VycmVudCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcclxuICAgICAgICB0aGlzLl9oaXN0b3J5ID0gW107XHJcbiAgICAgICAgdGhpcy5faGlzdG9yeUluZGV4ID0gLTE7XHJcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmluaXQoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgZ2V0IHNldHRpbmdzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zZXR0aW5ncztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgZGVmaW5pdGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZmluaXRpb25zO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBnZXQgaW5pdGlhbGl6ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luaXRpYWxpemVkO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSByZXR1cm47XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5fY29uc29sZU5vZGUgPSB1dGlscy5jcmVhdGVFbGVtZW50KHRoaXMuX3NldHRpbmdzLnRlbXBsYXRlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyTm9kZS5hcHBlbmRDaGlsZCh0aGlzLl9jb25zb2xlTm9kZSk7XHJcblxyXG4gICAgICAgIHRoaXMuX291dHB1dE5vZGUgPSB0aGlzLl9jb25zb2xlTm9kZS5xdWVyeVNlbGVjdG9yKCcub3V0cHV0Jyk7XHJcbiAgICAgICAgdGhpcy5faW5wdXROb2RlID0gdGhpcy5fY29uc29sZU5vZGUucXVlcnlTZWxlY3RvcignLmlucHV0Jyk7XHJcbiAgICAgICAgdGhpcy5fcHJlZml4Tm9kZSA9IHRoaXMuX2NvbnNvbGVOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5wcmVmaXgnKTtcclxuICAgICAgICB0aGlzLl9wcm9tcHROb2RlID0gdGhpcy5fY29uc29sZU5vZGUucXVlcnlTZWxlY3RvcignLnByb21wdCcpO1xyXG5cclxuICAgICAgICB0aGlzLl9wcm9tcHROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fY3VycmVudCkge1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxMzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5fcHJvbXB0Tm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmV4ZWN1dGUodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDM4OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9oaXN0b3J5QmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0MDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faGlzdG9yeUZvcndhcmQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgOTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2N1cnJlbnQucmVhZExpbmUgJiYgZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnQucmVhZExpbmUucmVzb2x2ZSh0aGlzLl9wcm9tcHROb2RlLnRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9KS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIChmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnQgJiYgdGhpcy5fY3VycmVudC5yZWFkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuY2hhckNvZGUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50LnJlYWQuY2hhciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQuY2hhckNvZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jdXJyZW50LnJlYWQuY2FwdHVyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSkuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3Byb21wdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fY3VycmVudCAmJiB0aGlzLl9jdXJyZW50LnJlYWQgJiYgdGhpcy5fY3VycmVudC5yZWFkLmNoYXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnQucmVhZC5yZXNvbHZlKHRoaXMuX2N1cnJlbnQucmVhZC5jaGFyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLl9wcm9tcHROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5fcHJvbXB0Tm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5lcyA9IHZhbHVlLnNwbGl0KC9cXHJcXG58XFxyfFxcbi9nKTtcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBsaW5lcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBpZiAobGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmVzW2ldLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLmdldCh0aGlzKS5wdXNoKGxpbmVzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY3VycmVudCAmJiB0aGlzLl9jdXJyZW50LnJlYWRMaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnQucmVhZExpbmUucmVzb2x2ZShsaW5lc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9jdXJyZW50ICYmIHRoaXMuX2N1cnJlbnQucmVhZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50LnJlYWQucmVzb2x2ZShsaW5lc1swXVswXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudChsaW5lc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMpLCAwKTtcclxuICAgICAgICB9KS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgaWYgKF9wcm9tcHRJbmRlbnRQYWRkaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3Byb21wdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcHJvbXB0LmNzcyh0aGlzLl9nZXRQcm9tcHRJbmRlbnQoKSk7XHJcbiAgICAgICAgICAgIH0pLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fY29uc29sZU5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQgIT09IHRoaXMuX2lucHV0Tm9kZSAmJiAhdGhpcy5faW5wdXROb2RlLmNvbnRhaW5zKGV2ZW50LnRhcmdldCkgJiZcclxuICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldCAhPT0gdGhpcy5fb3V0cHV0Tm9kZSAmJiAhdGhpcy5fb3V0cHV0Tm9kZS5jb250YWlucyhldmVudC50YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9tcHROb2RlLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NldHRpbmdzLnByZWRlZmluZWRDb21tYW5kcykge1xyXG4gICAgICAgICAgICB0aGlzLnByZWRlZmluZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVJbnB1dCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5faW5pdGlhbGl6ZWQpIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLl9jb250YWluZXJOb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2NvbnNvbGVOb2RlKTtcclxuICAgICAgICB0aGlzLl9jb25zb2xlTm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fb3V0cHV0Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5faW5wdXROb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9wcmVmaXhOb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9wcm9tcHROb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9kZWZpbml0aW9ucyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XHJcbiAgICAgICAgdGhpcy5faGlzdG9yeSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2hpc3RvcnlJbmRleCA9IC0xOyAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSBmYWxzZTsgICAgICBcclxuICAgIH1cclxuICAgICAgICBcclxuICAgIHJlc2V0KCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWQoY2FsbGJhY2ssIGNhcHR1cmUpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2N1cnJlbnQpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVJbnB1dCh0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY3VycmVudC5yZWFkID0gdXRpbHMuZGVmZXIoKTtcclxuICAgICAgICB0aGlzLl9jdXJyZW50LnJlYWQudGhlbigoZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnQucmVhZCA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmICghY2FwdHVyZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZS50ZXh0Q29udGVudCA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2RlYWN0aXZhdGVJbnB1dCgpO1xyXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2suY2FsbCh0aGlzLl9jdXJyZW50LCB2YWx1ZSkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3JlYWQoY2FsbGJhY2ssIGNhcHR1cmUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZmx1c2hJbnB1dCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5fY3VycmVudC5yZWFkLmNhcHR1cmUgPSBjYXB0dXJlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50LnJlYWQucmVzb2x2ZSh0aGlzLl9xdWV1ZS5zaGlmdCgpWzBdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVhZExpbmUoY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2N1cnJlbnQpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVJbnB1dCh0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY3VycmVudC5yZWFkTGluZSA9IHV0aWxzLmRlZmVyKCk7XHJcbiAgICAgICAgdGhpcy5fY3VycmVudC5yZWFkTGluZS50aGVuKChmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fY3VycmVudC5yZWFkTGluZSA9IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuX3Byb21wdE5vZGUudGV4dENvbnRlbnQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgdGhpcy5fZGVhY3RpdmF0ZUlucHV0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZsdXNoSW5wdXQoKTtcclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmNhbGwodGhpcy5fY3VycmVudCwgdmFsdWUpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlYWRMaW5lKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50LnJlYWRMaW5lLnJlc29sdmUodGhpcy5fcXVldWUuc2hpZnQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlKHZhbHVlLCBjc3NDbGFzcykge1xyXG4gICAgICAgIHZhbHVlID0gdmFsdWUgfHwgJyc7XHJcbiAgICAgICAgdmFyIG91dHB1dFZhbHVlID0gdXRpbHMuY3JlYXRlRWxlbWVudChgPHNwYW4gY2xhc3M9XCIke2Nzc0NsYXNzfVwiPiR7dmFsdWV9PC9zcGFuPmApO1xyXG4gICAgICAgIGlmICghdGhpcy5fb3V0cHV0TGluZU5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fb3V0cHV0TGluZU5vZGUgPSB1dGlscy5jcmVhdGVFbGVtZW50KCc8ZGl2PjwvZGl2PicpO1xyXG4gICAgICAgICAgICB0aGlzLl9vdXRwdXROb2RlLmFwcGVuZENoaWxkKHRoaXMuX291dHB1dExpbmVOb2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fb3V0cHV0TGluZU5vZGUuYXBwZW5kQ2hpbGQob3V0cHV0VmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlTGluZSh2YWx1ZSwgY3NzQ2xhc3MpIHtcclxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8fCAnJykgKyAnXFxuJztcclxuICAgICAgICB0aGlzLndyaXRlKHZhbHVlLCBjc3NDbGFzcyk7XHJcbiAgICAgICAgdGhpcy5fb3V0cHV0TGluZU5vZGUgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlUGFkKHZhbHVlLCBwYWRkaW5nLCBsZW5ndGgsIGNzc0NsYXNzKSB7XHJcbiAgICAgICAgdGhpcy53cml0ZSh1dGlscy5wYWQodmFsdWUsIHBhZGRpbmcsIGxlbmd0aCksIGNzc0NsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9vdXRwdXROb2RlLmlubmVySFRNTCA9ICcnO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmb2N1cygpIHtcclxuICAgICAgICB0aGlzLl9wcm9tcHROb2RlLmZvY3VzKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGJsdXIoKSB7XHJcbiAgICAgICAgdXRpbHMuYmx1cih0aGlzLl9wcm9tcHROb2RlKTtcclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKGNvbW1hbmQpIHtcclxuICAgICAgICBpZiAodGhpcy5fY3VycmVudCkge1xyXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKGNvbW1hbmQpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdzdHJpbmcnIHx8IGNvbW1hbmQubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIGNvbW1hbmQnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZS50ZXh0Q29udGVudCA9IGNvbW1hbmQ7XHJcbiAgICAgICAgdGhpcy5fZmx1c2hJbnB1dCghdGhpcy5fc2V0dGluZ3MuZWNobyk7XHJcbiAgICAgICAgdGhpcy5faGlzdG9yeUFkZChjb21tYW5kKTtcclxuICAgICAgICB0aGlzLl9kZWFjdGl2YXRlSW5wdXQoKTtcclxuXHJcbiAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQudHJpbSgpO1xyXG5cclxuICAgICAgICB2YXIgcGFyc2VkID0gdGhpcy5fcGFyc2VDb21tYW5kKGNvbW1hbmQpO1xyXG5cclxuICAgICAgICB2YXIgZGVmaW5pdGlvbnMgPSB0aGlzLl9nZXREZWZpbml0aW9ucyhwYXJzZWQubmFtZSk7XHJcbiAgICAgICAgaWYgKCFkZWZpbml0aW9ucyB8fCBkZWZpbml0aW9ucy5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVMaW5lKCdJbnZhbGlkIGNvbW1hbmQnLCAnZXJyb3InKTtcclxuICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVJbnB1dCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSBlbHNlIGlmIChkZWZpbml0aW9ucy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVMaW5lKCdBbWJpZ3VvdXMgY29tbWFuZCcsICdlcnJvcicpO1xyXG4gICAgICAgICAgICB0aGlzLndyaXRlTGluZSgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmluaXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRlUGFkKGRlZmluaXRpb25zW2ldLm5hbWUsICcgJywgMTApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53cml0ZUxpbmUoZGVmaW5pdGlvbnNbaV0uZGVzY3JpcHRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVMaW5lKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlSW5wdXQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGRlZmluaXRpb24gPSBkZWZpbml0aW9uc1swXTtcclxuXHJcbiAgICAgICAgdGhpcy5fY3VycmVudCA9IHtcclxuICAgICAgICAgICAgY29tbWFuZDogY29tbWFuZCxcclxuICAgICAgICAgICAgZGVmaW5pdGlvbjogZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgY29uc29sZTogdGhpc1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBhcmdzID0gcGFyc2VkLmFyZ3M7XHJcbiAgICAgICAgaWYgKCFkZWZpbml0aW9uLnBhcnNlKSB7XHJcbiAgICAgICAgICAgIGFyZ3MgPSBbcGFyc2VkLmFyZ107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmVzdWx0O1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGRlZmluaXRpb24uY2FsbGJhY2suYXBwbHkodGhpcy5fY3VycmVudCwgYXJncyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgdGhpcy53cml0ZUxpbmUoJ1VuaGFuZGxlZCBleGNlcHRpb24uIFNlZSBjb25zb2xlTm9kZSBsb2cgZm9yIGRldGFpbHMuJywgJ2Vycm9yJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgUHJvbWlzZS5hbGwoW3Jlc3VsdF0pLnRoZW4oKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZUlucHV0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhlY3V0ZSh0aGlzLl9xdWV1ZS5zaGlmdCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkuYmluZCh0aGlzKSwgMCk7XHJcbiAgICAgICAgfSkuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZGVmaW5lKG5hbWVzLCBjYWxsYmFjaywgc2V0dGluZ3MpIHtcclxuICAgICAgICB2YXIgZGVmaW5pdGlvbnMgPSB0aGlzLl9jcmVhdGVEZWZpbml0aW9ucyhuYW1lcywgY2FsbGJhY2ssIHNldHRpbmdzKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGRlZmluaXRpb25zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLl9kZWZpbml0aW9uc1tkZWZpbml0aW9uc1tpXS5uYW1lXSA9IGRlZmluaXRpb25zW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJlZGVmaW5lKCkge1xyXG4gICAgICAgIHRoaXMuZGVmaW5lKFsnSEVMUCcsICc/J10sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5jb25zb2xlLndyaXRlTGluZSgnVGhlIGZvbGxvd2luZyBjb21tYW5kcyBhcmUgYXZhaWxhYmxlOicpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnNvbGUud3JpdGVMaW5lKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmNvbnNvbGUuZGVmaW5pdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkZWZpbml0aW9uID0gdGhpcy5jb25zb2xlLmRlZmluaXRpb25zW2tleV07XHJcbiAgICAgICAgICAgICAgICBpZiAoISF1dGlscy51bndyYXAoZGVmaW5pdGlvbi5hdmFpbGFibGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25zb2xlLndyaXRlUGFkKGtleSwgJyAnLCAxMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25zb2xlLndyaXRlTGluZShkZWZpbml0aW9uLmRlc2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmNvbnNvbGUud3JpdGVMaW5lKCk7XHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdMaXN0cyB0aGUgYXZhaWxhYmxlIGNvbW1hbmRzJ1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5kZWZpbmUoJ0VDSE8nLCBmdW5jdGlvbiAoYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciB0b2dnbGUgPSBhcmcudG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSA9PT0gJ09OJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25zb2xlLnNldHRpbmdzLmVjaG8gPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRvZ2dsZSA9PT0gJ09GRicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29uc29sZS5zZXR0aW5ncy5lY2hvID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnNvbGUud3JpdGVMaW5lKGFyZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rpc3BsYXlzIHByb3ZpZGVkIHRleHQgb3IgdG9nZ2xlcyBjb21tYW5kIGVjaG9pbmcnXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRlZmluZShbJ0NMUyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29uc29sZS5jbGVhcigpO1xyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2xlYXJzIHRoZSBjb21tYW5kIHByb21wdCdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgX2FjdGl2YXRlSW5wdXQoaW5saW5lKSB7XHJcbiAgICAgICAgaWYgKGlubGluZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fb3V0cHV0TGluZU5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZWZpeE5vZGUudGV4dENvbnRlbnQgPSB0aGlzLl9vdXRwdXRMaW5lTm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX291dHB1dE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fb3V0cHV0TGluZU5vZGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fb3V0cHV0TGluZU5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlZml4Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuX3NldHRpbmdzLnByb21wdFByZWZpeDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5faW5wdXROb2RlLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgICAgICBzZXRUaW1lb3V0KChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3Byb21wdE5vZGUuc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0UHJvbXB0SW5kZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3Byb21wdE5vZGUuZm9jdXMoKTtcclxuICAgICAgICAgICAgdXRpbHMuc21vb3RoU2Nyb2xsKHRoaXMuX2NvbnNvbGVOb2RlLCB0aGlzLl9jb25zb2xlTm9kZS5zY3JvbGxIZWlnaHQsIDEwMDApO1xyXG4gICAgICAgIH0pLmJpbmQodGhpcyksIDApO1xyXG4gICAgfVxyXG5cclxuICAgIF9kZWFjdGl2YXRlSW5wdXQoKSB7XHJcbiAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZS5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5faW5wdXROb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9XHJcblxyXG4gICAgX2ZsdXNoSW5wdXQocHJldmVudFdyaXRlKSB7XHJcbiAgICAgICAgaWYgKCFwcmV2ZW50V3JpdGUpIHtcclxuICAgICAgICAgICAgdGhpcy53cml0ZSh0aGlzLl9wcmVmaXhOb2RlLnRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgdGhpcy53cml0ZUxpbmUodGhpcy5fcHJvbXB0Tm9kZS50ZXh0Q29udGVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3ByZWZpeE5vZGUudGV4dENvbnRlbnQgPSAnJztcclxuICAgICAgICB0aGlzLl9wcm9tcHROb2RlLnRleHRDb250ZW50ID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgX2hpc3RvcnlBZGQoY29tbWFuZCkge1xyXG4gICAgICAgIHRoaXMuX2hpc3RvcnkudW5zaGlmdChjb21tYW5kKTtcclxuICAgICAgICB0aGlzLl9oaXN0b3J5SW5kZXggPSAtMTtcclxuICAgIH1cclxuXHJcbiAgICBfaGlzdG9yeUJhY2soKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2hpc3RvcnkubGVuZ3RoID4gdGhpcy5faGlzdG9yeUluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9oaXN0b3J5SW5kZXgrKztcclxuICAgICAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZS50ZXh0Q29udGVudCA9IGhpc3RvcnlbdGhpcy5faGlzdG9yeUluZGV4XTtcclxuICAgICAgICAgICAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcclxuICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KCdjaGFuZ2UnLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3Byb21wdE5vZGUuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9oaXN0b3J5Rm9yd2FyZCgpIHtcclxuICAgICAgICBpZiAodGhpcy5faGlzdG9yeUluZGV4ID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9oaXN0b3J5SW5kZXgtLTtcclxuICAgICAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZS50ZXh0Q29udGVudCA9IGhpc3RvcnlbdGhpcy5faGlzdG9yeUluZGV4XTtcclxuICAgICAgICAgICAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcclxuICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KCdjaGFuZ2UnLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3Byb21wdE5vZGUuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9wYXJzZUNvbW1hbmQoY29tbWFuZCkge1xyXG4gICAgICAgIHZhciBleHAgPSAvW15cXHNcIl0rfFwiKFteXCJdKilcIi9naSxcclxuICAgICAgICAgICAgbmFtZSA9IG51bGwsXHJcbiAgICAgICAgICAgIGFyZyA9IG51bGwsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBbXSxcclxuICAgICAgICAgICAgbWF0Y2ggPSBudWxsO1xyXG5cclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIG1hdGNoID0gZXhwLmV4ZWMoY29tbWFuZCk7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbWF0Y2hbMV0gPyBtYXRjaFsxXSA6IG1hdGNoWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoLmluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGNvbW1hbmQuc3Vic3RyKHZhbHVlLmxlbmd0aCArIChtYXRjaFsxXSA/IDMgOiAxKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IHdoaWxlIChtYXRjaCAhPT0gbnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgIGFyZzogYXJnLFxyXG4gICAgICAgICAgICBhcmdzOiBhcmdzXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlRGVmaW5pdGlvbnMobmFtZXMsIGNhbGxiYWNrLCBzZXR0aW5ncykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZXMgIT09ICdzdHJpbmcnICYmICFBcnJheS5pc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGNhbGxiYWNrO1xyXG4gICAgICAgICAgICBjYWxsYmFjayA9IG5hbWVzO1xyXG4gICAgICAgICAgICBuYW1lcyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MgPSBjYWxsYmFjaztcclxuICAgICAgICAgICAgY2FsbGJhY2sgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lcyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgbmFtZXMgPSBbbmFtZXNdO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShuYW1lcykpIHtcclxuICAgICAgICAgICAgbmFtZXMgPSBuYW1lcy5maWx0ZXIoZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkobmFtZXMpIHx8XHJcbiAgICAgICAgICAgIG5hbWVzLmxlbmd0aCA9PT0gMCB8fFxyXG4gICAgICAgICAgICB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgY29tbWFuZCBkZWZpbml0aW9uJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkZWZpbml0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgZGVmaW5pdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVzW2ldLnRvVXBwZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXHJcbiAgICAgICAgICAgICAgICBwYXJzZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGF2YWlsYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKGRlZmluaXRpb24sIHNldHRpbmdzKTtcclxuXHJcbiAgICAgICAgICAgIGRlZmluaXRpb25zLnB1c2goZGVmaW5pdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGVmaW5pdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgX2dldERlZmluaXRpb25zKG5hbWUpIHtcclxuICAgICAgICBuYW1lID0gbmFtZS50b1VwcGVyQ2FzZSgpO1xyXG5cclxuICAgICAgICB2YXIgZGVmaW5pdGlvbiA9IHRoaXMuX2RlZmluaXRpb25zW25hbWVdO1xyXG5cclxuICAgICAgICBpZiAoZGVmaW5pdGlvbikge1xyXG4gICAgICAgICAgICByZXR1cm4gW2RlZmluaXRpb25dO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGRlZmluaXRpb25zID0gW107XHJcblxyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9kZWZpbml0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAoa2V5LmluZGV4T2YobmFtZSwgMCkgPT09IDAgJiYgdXRpbHMudW53cmFwKHRoaXMuX2RlZmluaXRpb25zW2tleV0uYXZhaWxhYmxlKSkge1xyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbnMucHVzaCh0aGlzLl9kZWZpbml0aW9uc1trZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIF9nZXRQcmVmaXhXaWR0aCgpIHtcclxuICAgICAgICB2YXIgd2lkdGggPSB0aGlzLl9wcmVmaXhOb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoO1xyXG4gICAgICAgIHZhciB0ZXh0ID0gdGhpcy5fcHJlZml4Tm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICB2YXIgc3BhY2VQYWRkaW5nID0gdGV4dC5sZW5ndGggLSB0ZXh0LnRyaW0oKS5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcHJlZml4Tm9kZS5fc3BhY2VXaWR0aCkge1xyXG4gICAgICAgICAgICB2YXIgZWxlbTEgPSB1dGlscy5jcmVhdGVFbGVtZW50KCc8c3BhbiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlblwiPnwgfDwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlZml4Tm9kZS5hcHBlbmRDaGlsZChlbGVtMSk7XHJcbiAgICAgICAgICAgIHZhciBlbGVtMiA9IHV0aWxzLmNyZWF0ZUVsZW1lbnQoJzxzcGFuIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuXCI+fHw8L3NwYW4+JylcclxuICAgICAgICAgICAgdGhpcy5fcHJlZml4Tm9kZS5hcHBlbmRDaGlsZChlbGVtMik7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZWZpeE5vZGUuX3NwYWNlV2lkdGggPSBlbGVtMS5vZmZzZXRXaWR0aCAtIGVsZW0yLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLl9wcmVmaXhOb2RlLnJlbW92ZUNoaWxkKGVsZW0xKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlZml4Tm9kZS5yZW1vdmVDaGlsZChlbGVtMik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aWR0aCArPSBzcGFjZVBhZGRpbmcgKiB0aGlzLl9wcmVmaXhOb2RlLl9zcGFjZVdpZHRoO1xyXG4gICAgICAgIHJldHVybiB3aWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBfc2V0UHJvbXB0SW5kZW50KCkge1xyXG4gICAgICAgIHZhciBwcmVmaXhXaWR0aCA9IHRoaXMuX2dldFByZWZpeFdpZHRoKCkgKyAncHgnO1xyXG4gICAgICAgIGlmIChfcHJvbXB0SW5kZW50UGFkZGluZykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvbXB0Tm9kZS50ZXh0Q29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZS5zdHlsZS50ZXh0SW5kZW50ID0gcHJlZml4V2lkdGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9tcHROb2RlLnN0eWxlLnBhZGRpbmdMZWZ0ID0gJyc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9tcHROb2RlLnN0eWxlLnRleHRJbmRlbnQgPSAnJztcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb21wdE5vZGUuc3R5bGUucGFkZGluZ0xlZnQgPSBwcmVmaXhXaWR0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJvbXB0Tm9kZS5zdHlsZS50ZXh0SW5kZW50ID0gcHJlZml4V2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDb25zb2xlOyIsImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMuanMnO1xyXG5pbXBvcnQgQ29uc29sZSBmcm9tICcuL2NvbnNvbGUuanMnO1xyXG5cclxuY29uc3QgX2RlZmF1bHRTZXR0aW5ncyA9IHtcclxuICAgIGF1dG9PcGVuOiBmYWxzZSxcclxuICAgIG9wZW5LZXk6IDE5MixcclxuICAgIGNsb3NlS2V5OiAyN1xyXG59O1xyXG5cclxudmFyIF9vdmVybGF5Tm9kZSA9IG51bGw7XHJcblxyXG5jbGFzcyBPdmVybGF5Q29uc29sZSBleHRlbmRzIENvbnNvbGUge1xyXG4gICAgY29uc3RydWN0b3Ioc2V0dGluZ3MpIHtcclxuXHJcbiAgICAgICAgaWYgKCFfb3ZlcmxheU5vZGUpIHtcclxuICAgICAgICAgICAgX292ZXJsYXlOb2RlID0gdXRpbHMuY3JlYXRlRWxlbWVudCgnPGRpdiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIiBjbGFzcz1cImNtZHItb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKF9vdmVybGF5Tm9kZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXR0aW5ncyA9IHV0aWxzLmV4dGVuZCh7fSwgX2RlZmF1bHRTZXR0aW5ncywgc2V0dGluZ3MpO1xyXG5cclxuICAgICAgICBzdXBlcihfb3ZlcmxheU5vZGUsIHNldHRpbmdzKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLl9vdmVybGF5Tm9kZSA9IF9vdmVybGF5Tm9kZTtcclxuICAgICAgICB0aGlzLl9kb2N1bWVudEV2ZW50SGFuZGxlciA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLl9kb2N1bWVudEV2ZW50SGFuZGxlciA9IChmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzT3BlbigpICYmXHJcbiAgICAgICAgICAgICAgICBbJ0lOUFVUJywgJ1RFWFRBUkVBJywgJ1NFTEVDVCddLmluZGV4T2YoZXZlbnQudGFyZ2V0LnRhZ05hbWUpID09PSAtMSAmJlxyXG4gICAgICAgICAgICAgICAgIWV2ZW50LnRhcmdldC5pc0NvbnRlbnRFZGl0YWJsZSAmJlxyXG4gICAgICAgICAgICAgICAgZXZlbnQua2V5Q29kZSA9PSB0aGlzLnNldHRpbmdzLm9wZW5LZXkpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4oKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlzT3BlbigpICYmIGV2ZW50LmtleUNvZGUgPT0gdGhpcy5zZXR0aW5ncy5jbG9zZUtleSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkuYmluZCh0aGlzKTtcclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50RXZlbnRIYW5kbGVyKTtcclxuXHJcbiAgICAgICAgc3VwZXIuaW5pdCgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5hdXRvT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50RXZlbnRIYW5kbGVyKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG5cclxuICAgICAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaXNPcGVuKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9vdmVybGF5Tm9kZS5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZSc7XHJcbiAgICB9XHJcblxyXG4gICAgb3BlbigpIHtcclxuICAgICAgICB0aGlzLl9vdmVybGF5Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2V0UHJvbXB0SW5kZW50KCk7ICAvL2hhY2s6IHVzaW5nICdwcml2YXRlJyBtZXRob2QgZnJvbSBiYXNlIGNsYXNzIHRvIGZpeCBpbmRlbnRcclxuICAgICAgICAgICAgdGhpcy5mb2N1cygpO1xyXG4gICAgICAgIH0pLmJpbmQodGhpcyksIDApO1xyXG4gICAgfVxyXG5cclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX292ZXJsYXlOb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgdGhpcy5ibHVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlZGVmaW5lKCkge1xyXG4gICAgICAgIHN1cGVyLnByZWRlZmluZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRlZmluZShbJ0NMT1NFJywgJ0VYSVQnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnNvbGUuY2xvc2UoKTtcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Nsb3NlcyB0aGUgY29tbWFuZCBwcm9tcHQnXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBPdmVybGF5Q29uc29sZTsiLCJleHBvcnQgZnVuY3Rpb24gZXh0ZW5kKG91dCkge1xyXG4gICAgb3V0ID0gb3V0IHx8IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgb2JqID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgIGlmICghb2JqKSBjb250aW51ZTtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmpba2V5XSA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5kKG91dFtrZXldLCBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvdXQ7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChodG1sKSB7XHJcbiAgICB2YXIgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgd3JhcHBlci5pbm5lckhUTUwgPSBodG1sO1xyXG4gICAgcmV0dXJuIHdyYXBwZXIuZmlyc3RDaGlsZDtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYWQodmFsdWUsIHBhZGRpbmcsIGxlbmd0aCkge1xyXG4gICAgdmFyIHJpZ2h0ID0gbGVuZ3RoID49IDA7XHJcbiAgICBsZW5ndGggPSBNYXRoLmFicyhsZW5ndGgpO1xyXG4gICAgd2hpbGUgKHZhbHVlLmxlbmd0aCA8IGxlbmd0aCkge1xyXG4gICAgICAgIHZhbHVlID0gcmlnaHQgPyB2YWx1ZSArIHBhZGRpbmcgOiBwYWRkaW5nICsgdmFsdWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bndyYXAodmFsdWUpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgPyB2YWx1ZSgpIDogdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzbW9vdGhTY3JvbGwoZWxlbWVudCwgdGFyZ2V0LCBkdXJhdGlvbikge1xyXG4gICAgdGFyZ2V0ID0gTWF0aC5yb3VuZCh0YXJnZXQpO1xyXG4gICAgZHVyYXRpb24gPSBNYXRoLnJvdW5kKGR1cmF0aW9uKTtcclxuICAgIGlmIChkdXJhdGlvbiA8IDApIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJJbnZhbGlkIGR1cmF0aW9uXCIpO1xyXG4gICAgfVxyXG4gICAgaWYgKGR1cmF0aW9uID09PSAwKSB7XHJcbiAgICAgICAgZWxlbWVudC5zY3JvbGxUb3AgPSB0YXJnZXQ7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgdmFyIGVuZFRpbWUgPSBzdGFydFRpbWUgKyBkdXJhdGlvbjtcclxuXHJcbiAgICB2YXIgc3RhcnRUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcclxuICAgIHZhciBkaXN0YW5jZSA9IHRhcmdldCAtIHN0YXJ0VG9wO1xyXG5cclxuICAgIHZhciBzbW9vdGhTdGVwID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIHBvaW50KSB7XHJcbiAgICAgICAgaWYgKHBvaW50IDw9IHN0YXJ0KSB7IHJldHVybiAwOyB9XHJcbiAgICAgICAgaWYgKHBvaW50ID49IGVuZCkgeyByZXR1cm4gMTsgfVxyXG4gICAgICAgIHZhciB4ID0gKHBvaW50IC0gc3RhcnQpIC8gKGVuZCAtIHN0YXJ0KTtcclxuICAgICAgICByZXR1cm4geCAqIHggKiAoMyAtIDIgKiB4KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHZhciBwcmV2aW91c1RvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xyXG5cclxuICAgICAgICB2YXIgc2Nyb2xsRnJhbWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnNjcm9sbFRvcCAhPSBwcmV2aW91c1RvcCkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KFwiaW50ZXJydXB0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICB2YXIgcG9pbnQgPSBzbW9vdGhTdGVwKHN0YXJ0VGltZSwgZW5kVGltZSwgbm93KTtcclxuICAgICAgICAgICAgdmFyIGZyYW1lVG9wID0gTWF0aC5yb3VuZChzdGFydFRvcCArIChkaXN0YW5jZSAqIHBvaW50KSk7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gZnJhbWVUb3A7XHJcblxyXG4gICAgICAgICAgICBpZiAobm93ID49IGVuZFRpbWUpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuc2Nyb2xsVG9wID09PSBwcmV2aW91c1RvcFxyXG4gICAgICAgICAgICAgICAgJiYgZWxlbWVudC5zY3JvbGxUb3AgIT09IGZyYW1lVG9wKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcHJldmlvdXNUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoc2Nyb2xsRnJhbWUsIDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0VGltZW91dChzY3JvbGxGcmFtZSwgMCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlZmVyKCkge1xyXG4gICAgZnVuY3Rpb24gRGVmZXJyZWQoKSB7XHJcbiAgICAgICAgdGhpcy5wcm9taXNlID0gbmV3IFByb21pc2UoKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcclxuICAgICAgICAgICAgdGhpcy5yZWplY3QgPSByZWplY3Q7XHJcbiAgICAgICAgfSkuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHRoaXMudGhlbiA9IHRoaXMucHJvbWlzZS50aGVuLmJpbmQodGhpcy5wcm9taXNlKTtcclxuICAgICAgICB0aGlzLmNhdGNoID0gdGhpcy5wcm9taXNlLmNhdGNoLmJpbmQodGhpcy5wcm9taXNlKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIG5ldyBEZWZlcnJlZCgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmx1cihlbGVtZW50ID0gbnVsbCkge1xyXG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudCAhPT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgcmV0dXJuO1xyXG4gICAgdmFyIHRlbXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRlbXApO1xyXG4gICAgdGVtcC5mb2N1cygpO1xyXG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0ZW1wKTtcclxufSJdfQ==
