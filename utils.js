var X = X || {};

X.Utils = (function() {

  'use strict';

  return {

    /**
      *
      * Bitwise operations
      *
      */

  	nth_bit: function(value, n) {
  		return !!(value & 1 << n);
  	},
  	
    sign: function(value) {
      return Utils.nth_bit(value, 7);
    },
    
  	is_negative: function(value) {
  		return !!Utils.sign(value);
  	},
    
    signed: function(value) {  
      return this.nth_bit(value, 7) * -128 + (value & ~(1 << 7));
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
      * Misc.
      *
      */

    hex8: function(value) {
      return '0x' + value.toString(16).toUpperCase();
    },

    hex16: function(value) {
      return '0x' + value.toString(16).toUpperCase();
    }

  };

})();
