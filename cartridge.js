var X = X ||{};

X.Cartridge = (function() {

	'use strict';

	var data = [];

  return {

		get title() { return data.slice(0x134, 0x144); },
		get manufacturer() { return data.slice(0x13F, 0x143); },
		get licensee() { return data.slice(0x144, 0x146); }, // TODO old new
		get destination() { return data[0x14A]; },
		get version() { return data[0x14C]; },

		get cartridge_type() { return data[0x147]; },
		get rom_size() { return data[0x148]; },
		get ram_size() { return data[0x149]; },

  	init: function(bytes) {

  		data = bytes;
  	},

  	r: function(address) {

  		return data[address];
  	},

  	w: function(address) {

  		return data[address];
  	}

  };

})();
