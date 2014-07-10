var X = X || {};

X.Utils = {

	nth_bit: function(value, n) {
		return value & 1 << n ? 1 : 0;
	},
	
  sign: function(value) {
    return Utils.nth_bit(value, 7);
  },
  
	is_negative: function(value) {
		return !!Utils.sign(value);
	},
  
  signed: function(value) {  
    return Utils.nth_bit(value, 7) * -128 + (value & ~(1 << 7));
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
    return value; // TODO
  },
  
  hilo: function(hi, lo) {
    return hi << 8 | lo;
  },
  
  random8: function() {
    return Math.floor(Math.random() * 0xFF)
  }
};
