var X = X ||{};

X.Cartridge = (function() {

	'use strict';

	var data = [];

  var mbc;
  var MemoryBankControllers = {
    
    0x0: { // None
      r: function(address) {
        return data[address];
      },
      w: function(address, value) {
        return data[address] = value;
      }
    },

    0x1: { // MBC1
      bank: 1,
      r: function(address) {
        return address < 0x4000 ? data[address] : data[bank*0x4000 + address - 0x4000];
      },
      w: function(address, value) {
        if (address >= 0x2000 && address < 0x4000) {
          bank = (bank & 0xE0) | (value & 0x1F);
        }
        else if (address >= 0x4000 && address < 0x6000) {
          bank = (bank & 0x1F) | (value & 0x3) << 5;
        }
      }
    },
  };

  return {

		get title() { return _.map(data.slice(0x134, 0x144), function(x) { return String.fromCharCode(x); }).join(''); },
    get manufacturer() { return data.slice(0x13F, 0x143); },
		get licensee() { return data.slice(0x144, 0x146); }, // TODO old new
		get destination() { return data[0x14A]; },
		get version() { return data[0x14C]; },

		get type() { return data[0x147]; },
		get rom_size() { return data[0x148]; },
		get ram_size() { return data[0x149]; },

  	init: function(bytes) {

  		data = bytes;

      mbc = MemoryBankControllers[this.type];
  	},

  	r: function(address) {

  		return mbc.r(address);
  	},

  	w: function(address, value) {

  		return mbc.w(address, value);
  	}

  };

})();
