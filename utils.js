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
  	
    sign: function(value) {
      return Utils.bit(value, 7);
    },
    
  	is_negative: function(value) {
  		return !!Utils.sign(value);
  	},
    
    signed: function(value) {  
      return this.bit(value, 7) * -128 + (value & ~(1 << 7));
    },
    
  	wrap8: function(value) {
  		return value & 0xFF;
  	},
  	
  	wrap16: function(value) {
  		return value & 0xFFFF;
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
      *
      * Drawing
      *
      */

    tile_to_cache: function(tile) {

    },

    cache_to_image: function(cache, image) {

      for (var y = 0; y < 8; ++y)
        for (var x = 0; x < 8; ++x) {
          var color = X.PPU.color(cache[y*8 + x], 'bg_palette').slice(4,15).split(',');
          var index = y*8*4 + x*4;
          image[index] = color[0];
          image[index + 1] = color[1];
          image[index + 2] = color[2];
          image[index + 3] = 255;
        }
    },

    /**
      *
      * Misc.
      *
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

