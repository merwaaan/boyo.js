var X = X ||{};

X.Cartridge = (function() {

	'use strict';

	var data = [];

  var mbc_names = {
    None: [0x0, 0x8, 0x9],
    MBC1: [0x1, 0x2, 0x3],
    MBC2: [0x5, 0x6],
    MBC3: [0xF, 0x10, 0x11, 0x13],
    MBC4: [0x15, 0x16, 0x17],
    MBC5: [0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E]
  };

  var MemoryBankControllers = {
    
    None: {
      r: function(address) {
        return data[address];
      },
      w: function(address, value) {
        return data[address] = value;
      }
    },

    MBC1: {
      rom_bank: 0,
      ram_bank: 0,
      mode: 0, // 0 -> ROM banking, 1 -> RAM banking
      ram_enabled: false,
      r: function(address) {
        if (address < 0x4000) {
          return data[address];  
        }
        else if (address < 0x8000) {
         return data[this.rom_bank*0x4000 + address - 0x4000];
        }
        else if (address < 0xC000) {
          return data[0xA000 + this.ram_bank*0x2000 + address - 0x2000]; // TODO check
        }
      },
      w: function(address, value) {
        if (address < 0x2000) {
          this.ram_enabled = value == 0x0A;
        }
        else if (address < 0x4000) {
          this.rom_bank = (this.rom_bank & 0x60) | (value & 0x1F);
        }
        else if (address < 0x6000) {
          if (this.mode == 0)
            this.rom_bank = (this.rom_bank & 0x1F) | (value & 0x3) << 5;
          else
            this.ram_bank = value & 0x3;
        }
        else {
          this.mode = value; // & 1 ???
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

    mbc: null,

  	init: function(bytes) {

      data = bytes;

      _.each(mbc_names, function(codes, type) {
        if (_.contains(codes, this.type)) {
          this.mbc = MemoryBankControllers[type];
          return;
        }
      }.bind(this));
  	},

  	r: function(address) {

  		return this.mbc.r(address);
  	},

  	w: function(address, value) {

  		return this.mbc.w(address, value);
  	}

  };

})();
