var X = X || {};

X.Utils = (function() {

  'use strict';

  return {

    /**
      *
      * Bitwise operations
      *
      */

    bit: function(value, n) {
      return !!(value & 1 << n);
    },

    signed: function(value) {
      return value < 0x80 ? value : value - 0x100;
    },

    hi: function(value) {
      return value >> 8;
    },

    lo: function(value) {
      return value & 0x00FF;
    },

    hilo: function(hi, lo) {
      return hi << 8 | lo;
    },

    random8: function() {
      return Math.floor(Math.random() * 0xFF)
    },

    /**
      * Misc.
      */

    fill: function(array, value) {

      var value = value || 0;

      for (var i = 0; i < array.length; ++i)
        array[i] = value;
    },

    hex8: function(value) {
      return ('0' + value.toString(16).toUpperCase()).substr(-2);
    },

    hex16: function(value) {
      return ('000' + value.toString(16).toUpperCase()).substr(-4);
    },

    inherit: function(SubClass, SuperClass) {
      SubClass.prototype = Object.create(SuperClass.prototype);
      SubClass.prototype.constructor = SubClass;
    }

  };

})();


// object.watch
if (!Object.prototype.watch) {
  Object.defineProperty(Object.prototype, "watch", {
      enumerable: false
    , configurable: true
    , writable: false
    , value: function (prop, handler) {
      var
        oldval = this[prop]
      , newval = oldval
      , getter = function () {
        return newval;
      }
      /*, setter = function (val) {
        oldval = newval;
        return newval = handler.call(this, prop, oldval, val);
      }*/
      , setter = function (val) {
        oldval = newval;
        handler.call(this, prop, oldval, val)
        return newval = val;
      }
      ;

      if (delete this[prop]) { // can't watch constants
        Object.defineProperty(this, prop, {
            get: getter
          , set: setter
          , enumerable: true
          , configurable: true
        });
      }
    }
  });
}

// object.unwatch
if (!Object.prototype.unwatch) {
  Object.defineProperty(Object.prototype, "unwatch", {
      enumerable: false
    , configurable: true
    , writable: false
    , value: function (prop) {
      var val = this[prop];
      delete this[prop]; // remove accessors
      this[prop] = val;
    }
  });
}

