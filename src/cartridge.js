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

  var ram_sizes = [0, 0x800, 0x2000, 0x20000];

  var MemoryBankControllers = {
    
    None: {
      
      r: function(address) {
        return address < 0x8000 ? data[address] : data[0x8000 + address - 0xA000];
      },
      
      w: function(address, value) {
        return address < 0x8000 ? data[address] = value : data[0x8000 + address - 0xA000] = value;
      }
    },

    MBC1: {

      ram_enable: false,
      rom_bank_lo: 1,
      rom_bank_hi: 0, // Alternatively used as RAM bank number
      mode: 0,

      r: function(address) {
        
        if (address < 0x4000) { // ROM Bank 0
          return data[address];
        }
        else if (address < 0x8000) { // ROM Bank n
          var rom_bank = this.rom_bank_lo | (this.mode == 0 ? this.rom_bank_hi << 5 : 0);
          if (rom_bank % 0x20 == 0) ++rom_bank;
          return data[rom_bank*0x4000 + address - 0x4000];
        }
        else { // RAM bank n
          var ram_bank = this.mode == 0 ? 0 : this.rom_bank_hi;
          return data[X.Cartridge.rom_size + ram_bank*0x2000 + address - 0xA000];
        }
      },
      
      // TODO optimize (better to compute banks once on w than more often on r)
      w: function(address, value) {
        
        if (address < 0x2000) {
          this.ram_enable = value == 0x0A;
        }
        else if (address < 0x4000) {
          this.rom_bank_lo = value;
        }
        else if (address < 0x6000) {
          this.rom_bank_hi = value;
        }
        else if (address < 0x8000) {
          this.mode = value;
        }
        else {
          var ram_bank = this.mode == 0 ? 0 : this.rom_bank_hi;
          return data[X.Cartridge.rom_size + ram_bank*0x2000 + address - 0xA000] = value;
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
    get rom_size() { return 0x8000 << data[0x148]; },
    get ram_size() { return ram_sizes[data[0x149]]; },

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

      // XXX what if no cartridge?
      
  		return this.mbc.r(address);
  	},

  	w: function(address, value) {

  		return this.mbc.w(address, value);
  	}

  };

})();
